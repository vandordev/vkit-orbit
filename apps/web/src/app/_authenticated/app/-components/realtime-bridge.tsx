import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { trpc } from "../../../../trpc/client";
import { bindRealtimeInvalidation, createRealtimeSocket } from "../../../../lib/realtime";

export function RealtimeBridge() {
	// A Socket.IO reconnect invalidates the cached same-origin tRPC query.
	const queryClient = useQueryClient();
	const ticketQuery = useQuery({ queryKey: ["workspace", "realtime-ticket"], queryFn: () => trpc.auth.realtimeTicket.query() });
	useEffect(() => {
		if (!ticketQuery.data) return;
		const socket = createRealtimeSocket(ticketQuery.data.ticket);
		const dispose = bindRealtimeInvalidation(socket, queryClient);
		socket.on("connect", () => void socket.emit("join-workspace", ticketQuery.data.workspaceId));
		socket.connect();
		return () => {
			dispose();
			socket.close();
		};
	}, [queryClient, ticketQuery.data]);
	return null;
}
