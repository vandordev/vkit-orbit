# Cross-runtime River job contracts

Jobs use a stable, versioned `kind` and JSON-only `args`. TypeScript producers
validate payloads with Zod before insertion. Go workers decode the same fields
into a matching struct and return retryable errors when downstream delivery
fails. Breaking payload changes require a new `.vN` kind; additive compatible
fields must remain decodable by older workers.
