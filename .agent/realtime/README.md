# Realtime

Realtime owns one Socket.IO runtime per process, with typed app/listener/ticket/
publisher config only and no database requirement. It owns ticket
and room authorization and the private publisher endpoint. Web routes never
treat realtime payloads as source of truth; events only invalidate or refetch
authoritative same-origin tRPC data. Browser URL arrives via public runtime query,
not client env, and ticket authentication remains separate.
