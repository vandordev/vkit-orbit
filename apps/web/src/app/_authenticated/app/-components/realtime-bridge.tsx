import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { trpc } from "../../../../trpc/client";
import { bindRealtimeInvalidation, createRealtimeSocket } from "../../../../lib/realtime";

export function RealtimeBridge() {
	// A Socket.IO reconnect invalidates the cached same-origin tRPC query.
	const queryClient = useQueryClient();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const configQuery = useQuery({ queryKey: ["runtime-config"], queryFn: () => trpc.config.public.query(), enabled: mounted, staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false, retry: 2 });
	const ticketQuery = useQuery({ queryKey: ["workspace", "realtime-ticket"], queryFn: () => trpc.auth.realtimeTicket.query() });
	useEffect(() => {
		if (!configQuery.isSuccess || configQuery.isError || !ticketQuery.isSuccess || ticketQuery.isError || !ticketQuery.data || !configQuery.data) return;
		const socket = createRealtimeSocket({ url: configQuery.data.realtimeUrl, ticket: ticketQuery.data.ticket });
		const dispose = bindRealtimeInvalidation(socket, queryClient);
		socket.on("connect", () => void socket.emit("join-workspace", ticketQuery.data.workspaceId));
		socket.connect();
		return () => {
			dispose();
			socket.close();
		};
	}, [queryClient, ticketQuery.data, ticketQuery.isSuccess, ticketQuery.isError, configQuery.data, configQuery.isSuccess, configQuery.isError]);
	return null;
}
