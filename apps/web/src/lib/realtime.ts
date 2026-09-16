import { io, type Socket } from "socket.io-client";
import { realtimeEventSchema, type RealtimeEvent } from "@repo/realtime";

export function createRealtimeSocket(ticket: string): Socket {
	return io(import.meta.env.VITE_REALTIME_URL, { path: "/ws", auth: { ticket }, transports: ["websocket"], autoConnect: false });
}

type RealtimeSocket = {
	on(name: string, listener: (...args: unknown[]) => void): unknown;
	off(name: string, listener: (...args: unknown[]) => void): unknown;
};
type QueryInvalidator = { invalidateQueries(filters?: { queryKey?: readonly unknown[] }): Promise<unknown> | unknown };

export function bindRealtimeInvalidation(socket: RealtimeSocket, queryClient: QueryInvalidator) {
	const invalidate = (...args: unknown[]) => {
		const parsed = realtimeEventSchema.safeParse(args[0]);
		const event = parsed.success ? parsed.data : undefined;
		// Events are invalidation signals only: report/result data is always refetched from tRPC.
		void queryClient.invalidateQueries(event ? { queryKey: ["workspace", event.workspaceId] } : undefined);
	};
	socket.on("realtime-event", invalidate);
	socket.on("connect", invalidate);
	return () => {
		socket.off("realtime-event", invalidate);
		socket.off("connect", invalidate);
	};
}

export function parseRealtimeEvent(value: unknown): RealtimeEvent | null {
	const result = realtimeEventSchema.safeParse(value);
	return result.success ? result.data : null;
}
