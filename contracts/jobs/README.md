# Cross-runtime BullMQ job contracts

`packages/queue/src/contracts/` owns versioned names and strict JSON payload
schemas. Producers and TypeScript workers validate those schemas. Breaking
payload changes require a new `.vN` name. PostgreSQL outbox intents are the
durable source; Redis is the transport.

| Contract                    | Queue         | Payload                           |
| --------------------------- | ------------- | --------------------------------- |
| `document.validate.v1`      | documents     | workspaceId, runId, revision      |
| `document.analyze.v1`       | documents     | workspaceId, runId, revision      |
| `document.finalize.v1`      | documents     | workspaceId, runId, revision      |
| `document.recover.v1`       | documents     | workspaceId, runId, revision      |
| `document.cleanup.v1`       | documents     | workspaceId, documentId, revision |
| `webhook.deliver.v1`        | webhooks      | workspaceId, deliveryId, revision |
| `notification.publish.v1`   | notifications | workspaceId, eventId, revision    |
| `maintenance.processing.v1` | documents     | limit (1–1000, default 100)       |
| `maintenance.webhooks.v1`   | webhooks      | limit (1–1000, default 100)       |
| `maintenance.uploads.v1`    | documents     | limit (1–1000, default 100)       |

Stage payload `revision` refers to `ProcessingRun.stageRevision`, not the
document's processing-attempt revision. Webhook revision is attempts + 1.
Maintenance jobs scan bounded eligible rows; they contain no fake workspace
or business IDs. Upload cleanup selects uploads older than 24 hours.

The relay routes intents to their contract's queue with deterministic job IDs.
Expired outbox and webhook claims are recoverable. Completion records a durable
notification event and signed webhook deliveries in the same database
transaction. Notifications carry invalidation metadata only; workers notify
Elysia, and Elysia alone publishes to Socket.IO.
