import { t, type TSchema } from "elysia";

import { createQueryFingerprint, decodeCursor, encodeCursor, type CursorPosition } from "./cursor";

type DescriptionOptions = {
	description: string;
};

type SortDefinition = DescriptionOptions;

type EnumFilter<Values extends readonly string[] = readonly string[]> = DescriptionOptions & {
	kind: "enum";
	values: Values;
};

type DateRangeFilter = DescriptionOptions & {
	kind: "date-range";
};

type CollectionFilter = EnumFilter | DateRangeFilter;
type FilterDefinitions = Record<string, CollectionFilter>;

type CollectionConfig<Filters extends FilterDefinitions, Sorts extends Record<string, SortDefinition>> = {
	page: { defaultSize: number; maxSize: number };
	sorts: Sorts;
	defaultSort: readonly string[];
	tieBreaker: Extract<keyof Sorts, string>;
	filters: Filters;
	search?: DescriptionOptions;
};

type ParsedFilter<Filter extends CollectionFilter> =
	Filter extends EnumFilter<infer Values> ? Values[number] : Filter extends DateRangeFilter ? { gte?: Date; lte?: Date } : never;

type ParsedFilters<Filters extends FilterDefinitions> = {
	[Name in keyof Filters]?: ParsedFilter<Filters[Name]>;
};

export type CollectionQuery<Filters extends FilterDefinitions = FilterDefinitions> = {
	pagination: {
		type: "cursor";
		size: number;
		after?: CursorPosition;
		before?: CursorPosition;
	};
	sort: Array<{ field: string; direction: "asc" | "desc" }>;
	filters: ParsedFilters<Filters>;
	search?: string;
};

export type CollectionDefinition<
	Filters extends FilterDefinitions = FilterDefinitions,
	Sorts extends Record<string, SortDefinition> = Record<string, SortDefinition>,
> = {
	readonly config: CollectionConfig<Filters, Sorts>;
	readonly querySchema: TSchema;
	parse(query: Record<string, unknown>): CollectionQuery<Filters>;
	createCursor(query: CollectionQuery<Filters>, position: CursorPosition): string;
	serialize(query: CollectionQuery<Filters>): URLSearchParams;
};

export function enumFilter<const Values extends readonly [string, ...string[]]>(
	values: Values,
	options: DescriptionOptions,
): EnumFilter<Values> {
	return { kind: "enum", values, ...options };
}

export function dateRangeFilter(options: DescriptionOptions): DateRangeFilter {
	return { kind: "date-range", ...options };
}

export function defineCollection<const Filters extends FilterDefinitions, const Sorts extends Record<string, SortDefinition>>(
	config: CollectionConfig<Filters, Sorts>,
): CollectionDefinition<Filters, Sorts> {
	assertCollectionConfig(config);
	const querySchema = createQuerySchema(config);
	const knownKeys = new Set(Object.keys(querySchema.properties));

	return {
		config,
		querySchema,
		parse(query) {
			for (const key of Object.keys(query)) {
				if (!knownKeys.has(key) || query[key] === undefined) {
					if (query[key] === undefined) continue;
					throw new Error(`Unknown collection query parameter: ${key}`);
				}
			}

			const size = parsePageSize(query["page[size]"], config.page);
			const sort = parseSort(query.sort, config);
			const filters = parseFilters(query, config.filters);
			const search = parseSearch(query.q, config.search);
			const after = query["page[after]"];
			const before = query["page[before]"];
			if (after !== undefined && before !== undefined) {
				throw new Error("Only one cursor direction may be used");
			}

			const fingerprint = createFingerprint(sort, filters, search);
			const pagination: CollectionQuery<Filters>["pagination"] = { type: "cursor", size };
			if (after !== undefined) pagination.after = decodeCursor(asString(after, "page[after]"), fingerprint);
			if (before !== undefined) pagination.before = decodeCursor(asString(before, "page[before]"), fingerprint);

			return { pagination, sort, filters, ...(search ? { search } : {}) };
		},
		createCursor(query, position) {
			return encodeCursor({ position, fingerprint: createFingerprint(query.sort, query.filters, query.search) });
		},
		serialize(query) {
			const parameters = new URLSearchParams();
			parameters.set("page[size]", String(query.pagination.size));
			parameters.set("sort", query.sort.map(({ field, direction }) => `${direction === "desc" ? "-" : ""}${field}`).join(","));

			for (const [name, filter] of Object.entries(config.filters)) {
				const value = query.filters[name];
				if (value === undefined) continue;
				if (filter.kind === "enum") {
					parameters.set(`filter[${name}]`, String(value));
					continue;
				}

				const range = value as { gte?: Date; lte?: Date };
				if (range.gte) parameters.set(`filter[${name}][gte]`, range.gte.toISOString());
				if (range.lte) parameters.set(`filter[${name}][lte]`, range.lte.toISOString());
			}
			if (query.search) parameters.set("q", query.search);
			if (query.pagination.after)
				parameters.set(
					"page[after]",
					encodeCursor({ position: query.pagination.after, fingerprint: createFingerprint(query.sort, query.filters, query.search) }),
				);
			if (query.pagination.before)
				parameters.set(
					"page[before]",
					encodeCursor({ position: query.pagination.before, fingerprint: createFingerprint(query.sort, query.filters, query.search) }),
				);
			return parameters;
		},
	};
}

function createFingerprint(sort: CollectionQuery["sort"], filters: Record<string, unknown>, search: string | undefined) {
	return createQueryFingerprint({
		sort: sort.map(({ field, direction }) => `${direction === "desc" ? "-" : ""}${field}`),
		filters,
		search,
	});
}

function createQuerySchema<Filters extends FilterDefinitions, Sorts extends Record<string, SortDefinition>>(
	config: CollectionConfig<Filters, Sorts>,
) {
	const properties: Record<string, TSchema> = {
		"page[size]": t.Optional(
			t.Numeric({
				minimum: 1,
				maximum: config.page.maxSize,
				multipleOf: 1,
				description: "Maximum number of items to return.",
				examples: [config.page.defaultSize],
			}),
		),
		"page[after]": t.Optional(
			t.String({
				description: "Opaque cursor that continues forward from a previous response.",
				examples: ["eyJ2IjoxfQ"],
			}),
		),
		"page[before]": t.Optional(
			t.String({
				description: "Opaque cursor that continues backward from a previous response.",
				examples: ["eyJ2IjoxfQ"],
			}),
		),
		sort: t.Optional(
			t.String({
				description: "Comma-separated sort fields. Prefix a field with - for descending order.",
				examples: [config.defaultSort.join(",")],
			}),
		),
	};

	for (const [name, filter] of Object.entries(config.filters)) {
		if (filter.kind === "enum") {
			properties[`filter[${name}]`] = t.Optional(
				t.UnionEnum(filter.values as [string, ...string[]], {
					description: filter.description,
					examples: [filter.values[0]],
				}),
			);
			continue;
		}

		properties[`filter[${name}][gte]`] = t.Optional(
			t.String({
				format: "date-time",
				description: `${filter.description} Inclusive lower bound.`,
				examples: ["2026-01-01T00:00:00.000Z"],
			}),
		);
		properties[`filter[${name}][lte]`] = t.Optional(
			t.String({
				format: "date-time",
				description: `${filter.description} Inclusive upper bound.`,
				examples: ["2026-12-31T23:59:59.999Z"],
			}),
		);
	}

	if (config.search) {
		properties.q = t.Optional(t.String({ description: config.search.description, examples: ["invoice"] }));
	}

	return t.Object(properties, { additionalProperties: false });
}

function assertCollectionConfig<Filters extends FilterDefinitions, Sorts extends Record<string, SortDefinition>>(
	config: CollectionConfig<Filters, Sorts>,
) {
	if (!Number.isSafeInteger(config.page.defaultSize) || config.page.defaultSize < 1) {
		throw new Error("Collection default page size must be a positive integer");
	}
	if (!Number.isSafeInteger(config.page.maxSize) || config.page.maxSize < config.page.defaultSize) {
		throw new Error("Collection maximum page size must be an integer at least as large as the default");
	}
	if (!(config.tieBreaker in config.sorts)) {
		throw new Error("Collection tie breaker must be declared as sortable");
	}
	parseSort(config.defaultSort.join(","), config);
}

function parsePageSize(value: unknown, page: { defaultSize: number; maxSize: number }): number {
	if (value === undefined) return page.defaultSize;
	const size = typeof value === "number" ? value : Number(value);
	if (!Number.isSafeInteger(size) || size < 1 || size > page.maxSize) {
		throw new Error("Invalid collection page size");
	}
	return size;
}

function parseSort<Filters extends FilterDefinitions, Sorts extends Record<string, SortDefinition>>(
	value: unknown,
	config: CollectionConfig<Filters, Sorts>,
) {
	const source = value === undefined ? config.defaultSort : asString(value, "sort").split(",");
	const seen = new Set<string>();
	const sort = source.map((token) => {
		const direction = token.startsWith("-") ? "desc" : "asc";
		const field = direction === "desc" ? token.slice(1) : token;
		if (!field || seen.has(field) || !(field in config.sorts)) {
			throw new Error("Invalid collection sort");
		}
		seen.add(field);
		return { field, direction } as const;
	});
	if (!seen.has(config.tieBreaker)) {
		sort.push({ field: config.tieBreaker, direction: "asc" });
	}
	return sort;
}

function parseFilters<Filters extends FilterDefinitions>(query: Record<string, unknown>, filters: Filters): ParsedFilters<Filters> {
	const parsed: Record<string, unknown> = {};
	for (const [name, filter] of Object.entries(filters)) {
		if (filter.kind === "enum") {
			const value = query[`filter[${name}]`];
			if (value === undefined) continue;
			const stringValue = asString(value, `filter[${name}]`);
			if (!filter.values.includes(stringValue)) {
				throw new Error(`Invalid collection filter: ${name}`);
			}
			parsed[name] = stringValue;
			continue;
		}

		const gte = parseDate(query[`filter[${name}][gte]`], `filter[${name}][gte]`);
		const lte = parseDate(query[`filter[${name}][lte]`], `filter[${name}][lte]`);
		if (gte || lte) parsed[name] = { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
	}
	return parsed as ParsedFilters<Filters>;
}

function parseSearch(value: unknown, definition: DescriptionOptions | undefined): string | undefined {
	if (value === undefined) return undefined;
	if (!definition) throw new Error("Collection search is not supported");
	const search = asString(value, "q").trim();
	if (!search) throw new Error("Collection search must not be empty");
	return search;
}

function parseDate(value: unknown, name: string): Date | undefined {
	if (value === undefined) return undefined;
	const date = new Date(asString(value, name));
	if (Number.isNaN(date.getTime())) throw new Error(`Invalid collection filter: ${name}`);
	return date;
}

function asString(value: unknown, name: string): string {
	if (typeof value !== "string") throw new Error(`Invalid collection query parameter: ${name}`);
	return value;
}
