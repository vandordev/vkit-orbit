# Realtime

Realtime is optional and owns one Socket.IO runtime per process. It owns ticket
and room authorization and the private publisher endpoint. Web routes never
treat realtime payloads as source of truth; events only invalidate or refetch
authoritative, versioned Elysia data.
