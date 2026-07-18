import { io, type Socket } from "socket.io-client";

export function createRealtimeSocket(ticket: string): Socket {
	return io(import.meta.env.VITE_REALTIME_URL, { path: "/ws", auth: { ticket }, transports: ["websocket"], autoConnect: false });
}

type RealtimeSocket = { on(name: string, listener: (...args: any[]) => void): unknown; off(name: string, listener: (...args: any[]) => void): unknown };
type QueryInvalidator = { invalidateQueries(): Promise<unknown> | unknown };

export function bindRealtimeInvalidation(socket: RealtimeSocket, queryClient: QueryInvalidator) {
	const invalidate = () => { void queryClient.invalidateQueries(); };
	socket.on("realtime-event", invalidate);
	socket.on("connect", invalidate);
	return () => {
		socket.off("realtime-event", invalidate);
		socket.off("connect", invalidate);
	};
}
