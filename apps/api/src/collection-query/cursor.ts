import { createHash } from "node:crypto";

export type CursorScalar = string | number | boolean | null;
export type CursorPosition = Record<string, CursorScalar>;

type CursorPayload = {
	v: 1;
	position: CursorPosition;
	fingerprint: string;
};

type FingerprintInput = {
	sort: readonly string[];
	filters: Record<string, unknown>;
	search?: string;
};

export function encodeCursor(payload: Omit<CursorPayload, "v">): string {
	return Buffer.from(JSON.stringify({ v: 1, ...payload } satisfies CursorPayload)).toString("base64url");
}

export function decodeCursor(value: string, expectedFingerprint: string): CursorPosition {
	try {
		if (!/^[A-Za-z0-9_-]+$/.test(value)) {
			throw new Error();
		}

		const payload: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
		if (!isCursorPayload(payload) || payload.fingerprint !== expectedFingerprint) {
			throw new Error();
		}

		return payload.position;
	} catch {
		throw new Error("Invalid collection cursor");
	}
}

export function createQueryFingerprint(input: FingerprintInput): string {
	return createHash("sha256").update(stableSerialize(input)).digest("base64url");
}

function isCursorPayload(value: unknown): value is CursorPayload {
	if (!isRecord(value) || value.v !== 1 || typeof value.fingerprint !== "string" || !isRecord(value.position)) {
		return false;
	}

	return Object.values(value.position).every(isCursorScalar);
}

function isCursorScalar(value: unknown): value is CursorScalar {
	return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function stableSerialize(value: unknown): string {
	if (value instanceof Date) {
		return JSON.stringify(value.toISOString());
	}
	if (Array.isArray(value)) {
		return `[${value.map(stableSerialize).join(",")}]`;
	}
	if (isRecord(value)) {
		return `{${Object.keys(value)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
			.join(",")}}`;
	}
	return JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
