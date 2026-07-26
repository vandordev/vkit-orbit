# Cross-runtime River job contracts

Jobs use a stable, versioned `kind` and JSON-only `args`. TypeScript producers
validate payloads with Zod before insertion. Go workers decode the same fields
into a matching struct and return retryable errors when downstream delivery
fails. Breaking payload changes require a new `.vN` kind; additive compatible
fields must remain decodable by older workers.

## Optional recipe example

The baseline installs no job contracts by default. The opt-in
`recipes/realtime-notification/` recipe supplies
`example.realtime-notification.v1`; its JSON args are:

```json
{
	"resourceId": "example-resource",
	"workspaceId": "example-workspace"
}
```

The recipe writes no Prisma model. After explicit installation it can be
enqueued through its Elysia adapter or scheduler, then consumed by its Go
worker handler. Workers notify Elysia only after success; Elysia publishes to
Socket.IO.
