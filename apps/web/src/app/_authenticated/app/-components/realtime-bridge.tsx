import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { trpc } from "../../../../trpc/client";
import { startRealtimeBridge } from "../../../../lib/realtime";

export function RealtimeBridge() {
	// A Socket.IO reconnect invalidates the cached same-origin tRPC query.
	const queryClient = useQueryClient();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const configQuery = useQuery({ queryKey: ["runtime-config"], queryFn: () => trpc.config.public.query(), enabled: mounted, staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false, retry: 2 });
	const ticketQuery = useQuery({ queryKey: ["workspace", "realtime-ticket"], queryFn: () => trpc.auth.realtimeTicket.query() });
	useEffect(() => {
		return startRealtimeBridge({ ready: configQuery.isSuccess && !configQuery.isError && ticketQuery.isSuccess && !ticketQuery.isError, config: configQuery.data, ticket: ticketQuery.data }, queryClient);
	}, [queryClient, ticketQuery.data, ticketQuery.isSuccess, ticketQuery.isError, configQuery.data, configQuery.isSuccess, configQuery.isError]);
	return null;
}
