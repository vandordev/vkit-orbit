import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { getTreaty } from "@/routes/api.$";
import { bindRealtimeInvalidation, createRealtimeSocket } from "@/lib/realtime";

export const Route = createFileRoute("/examples/realtime")({ component: RealtimeExamplePage });

export function RealtimeExamplePage({ createSocket = createRealtimeSocket }: { createSocket?: typeof createRealtimeSocket }) {
	const queryClient = useQueryClient();
	const socketRef = useRef<ReturnType<typeof createRealtimeSocket> | undefined>(undefined);
	const cleanupRef = useRef<(() => void) | undefined>(undefined);
	const [ticket, setTicket] = useState("");
	const [workspaceId, setWorkspaceId] = useState("example-workspace");
	const [resourceId, setResourceId] = useState("example-resource");
	const [connected, setConnected] = useState(false);
	useEffect(() => () => { cleanupRef.current?.(); socketRef.current?.close(); }, []);

	function connect() {
		cleanupRef.current?.();
		socketRef.current?.close();
		const socket = createSocket(ticket);
		cleanupRef.current = bindRealtimeInvalidation(socket, queryClient);
		socket.on("connect", () => setConnected(true));
		socket.on("disconnect", () => setConnected(false));
		socket.connect();
		socket.emit("join-workspace", workspaceId);
		socketRef.current = socket;
	}

	async function triggerExample() {
		await getTreaty().examples["realtime-notifications"].post({ resourceId, workspaceId });
	}

	return <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-16"><div><p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Opt-in realtime example</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Socket.IO signal invalidation</h1><p className="mt-3 text-muted-foreground">This walkthrough is opt-in: supply a product-issued ticket. It does not mint authentication credentials.</p></div><form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); connect(); }}><label className="grid gap-2 text-sm font-medium">Ticket<input className="h-10 rounded-md border border-border bg-background px-3" value={ticket} onChange={(event) => setTicket(event.target.value)} /></label><label className="grid gap-2 text-sm font-medium">Workspace ID<input className="h-10 rounded-md border border-border bg-background px-3" value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} /></label><label className="grid gap-2 text-sm font-medium">Resource ID<input className="h-10 rounded-md border border-border bg-background px-3" value={resourceId} onChange={(event) => setResourceId(event.target.value)} /></label><div className="flex flex-wrap gap-3"><Button type="submit">Connect</Button><Button type="button" variant="outline" onClick={() => void triggerExample()}>Trigger example job</Button></div></form><p role="status" className="text-sm text-muted-foreground">{connected ? "Connected; API-backed queries invalidate on event or reconnect." : "Disconnected"}</p></main>;
}
