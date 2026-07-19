# Cross-runtime River job contracts

Jobs use a stable, versioned `kind` and JSON-only `args`. TypeScript producers
validate payloads with Zod before insertion. Go workers decode the same fields
into a matching struct and return retryable errors when downstream delivery
fails. Breaking payload changes require a new `.vN` kind; additive compatible
fields must remain decodable by older workers.

## Baseline example

The boilerplate's only example job is `example.realtime-notification.v1`. Its
JSON args are:

```json
{
  "resourceId": "example-resource",
  "workspaceId": "example-workspace"
}
```

The example writes no Prisma model. It is enqueued manually through Elysia or
through the disabled-by-default scheduler, then consumed by the Go worker.
