type OpenApiSchema = {
	description?: unknown;
	examples?: unknown;
	properties?: Record<string, OpenApiSchema>;
	items?: OpenApiSchema;
	oneOf?: OpenApiSchema[];
	anyOf?: OpenApiSchema[];
};

type OpenApiOperation = {
	operationId?: unknown;
	summary?: unknown;
	description?: unknown;
	tags?: unknown;
	parameters?: Array<{ name?: unknown; schema?: OpenApiSchema }>;
	requestBody?: { content?: Record<string, { schema?: OpenApiSchema }> };
	responses?: Record<string, { description?: unknown; content?: Record<string, { schema?: OpenApiSchema }> }>;
};

type OpenApiDocument = { paths?: Record<string, Record<string, OpenApiOperation>> };

const methods = new Set(["get", "post", "put", "patch", "delete", "head", "options"]);

export function validateOpenApiDocumentation(document: OpenApiDocument): string[] {
	const violations: string[] = [];
	const operationIds = new Set<string>();

	for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
		for (const [method, operation] of Object.entries(pathItem)) {
			if (!methods.has(method)) continue;
			const label = `${method.toUpperCase()} ${path}`;
			if (!isNonEmptyString(operation.operationId)) violations.push(`${label}: operationId is required`);
			else if (operationIds.has(operation.operationId)) violations.push(`${label}: operationId '${operation.operationId}' must be unique`);
			else operationIds.add(operation.operationId);
			if (!isNonEmptyString(operation.summary)) violations.push(`${label}: summary is required`);
			if (!isNonEmptyString(operation.description)) violations.push(`${label}: description is required`);
			if (!Array.isArray(operation.tags) || operation.tags.length === 0 || operation.tags.some((tag) => !isNonEmptyString(tag))) {
				violations.push(`${label}: at least one tag is required`);
			}

			for (const parameter of operation.parameters ?? []) {
				const name = isNonEmptyString(parameter.name) ? parameter.name : "unknown";
				if (!isNonEmptyString(parameter.schema?.description)) {
					violations.push(`${label}: parameter '${name}' requires a schema description`);
				}
				if (!hasExamples(parameter.schema)) violations.push(`${label}: parameter '${name}' requires a schema example`);
			}

			for (const mediaType of Object.values(operation.requestBody?.content ?? {})) {
				validateSchema(mediaType.schema, `${label}: request body`, violations);
			}

			for (const [status, response] of Object.entries(operation.responses ?? {})) {
				if (!isNonEmptyString(response.description)) violations.push(`${label}: response ${status} requires a description`);
				const schema = response.content?.["application/json"]?.schema;
				if (!hasExamples(schema)) violations.push(`${label}: response ${status} requires an application/json example`);
				validateSchema(schema, `${label}: response ${status}`, violations);
			}
		}
	}

	return violations;
}

function validateSchema(schema: OpenApiSchema | undefined, label: string, violations: string[]) {
	if (!schema) return;
	for (const [property, child] of Object.entries(schema.properties ?? {})) {
		const propertyLabel = `${label} property '${property}'`;
		if (!isNonEmptyString(child.description)) violations.push(`${propertyLabel} requires a description`);
		if (!hasExamples(child)) violations.push(`${propertyLabel} requires an example`);
		validateSchema(child, propertyLabel, violations);
	}
	if (schema.items) validateSchema(schema.items, `${label} item`, violations);
	for (const branch of schema.oneOf ?? []) validateSchema(branch, label, violations);
	for (const branch of schema.anyOf ?? []) validateSchema(branch, label, violations);
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

function hasExamples(schema: OpenApiSchema | undefined) {
	return Array.isArray(schema?.examples) && schema.examples.length > 0;
}
