# Realtime

Realtime is optional. It owns Socket.IO ticket and room authorization and the
private publisher endpoint. Web routes never treat realtime payloads as source
of truth; events only invalidate or refetch authoritative Elysia data.
