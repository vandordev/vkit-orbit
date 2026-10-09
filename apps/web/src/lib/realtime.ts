import { io, type Socket } from "socket.io-client";
import { realtimeEventSchema, type RealtimeEvent } from "@repo/realtime";
import type { PublicWebConfig } from "@repo/config/public";

export function createRealtimeSocket(input: { url: string; ticket: string }): Socket {
	return io(input.url, { path: "/ws", auth: { ticket: input.ticket }, transports: ["websocket"], autoConnect: false });
}

type RealtimeSocket = {
	on(name: string, listener: (...args: unknown[]) => void): unknown;
	off(name: string, listener: (...args: unknown[]) => void): unknown;
};
type QueryInvalidator = { invalidateQueries(filters?: { queryKey?: readonly unknown[] }): Promise<unknown> | unknown };

type BridgeSocket = RealtimeSocket & { connect(): unknown; close(): unknown; emit(name: string, ...args: unknown[]): unknown };
export function startRealtimeBridge(
	input: { ready: boolean; config?: PublicWebConfig; ticket?: { ticket: string; workspaceId: string } },
	queryClient: QueryInvalidator,
	createSocket: (input: { url: string; ticket: string }) => BridgeSocket = createRealtimeSocket,
): (() => void) | undefined {
	if (!input.ready || !input.config || !input.ticket) return;
	const { ticket, config } = input;
	const socket = createSocket({ url: config.realtimeUrl, ticket: ticket.ticket });
	const dispose = bindRealtimeInvalidation(socket, queryClient);
	const join = () => void socket.emit("join-workspace", ticket.workspaceId);
	socket.on("connect", join);
	socket.connect();
	return () => { dispose(); socket.off("connect", join); socket.close(); };
}

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
