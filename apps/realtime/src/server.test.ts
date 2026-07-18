import { afterEach, expect, test } from "bun:test";
import { io } from "socket.io-client";

import { createRealtimeServer } from "./server";

const runtimes: ReturnType<typeof createRealtimeServer>[] = [];

afterEach(async () => {
  await Promise.all(runtimes.splice(0).map((runtime) => runtime.close()));
});

function createRuntime(authorizeWorkspace = async () => false, corsOrigin?: string) {
  const runtime = createRealtimeServer({
    publishApiKey: "publisher-key",
    authenticate: async () => ({ id: "user-1" }),
    authorizeWorkspace,
    corsOrigin,
  });
  runtimes.push(runtime);
  return runtime;
}

test("rejects an internal event without publisher credentials", async () => {
  const runtime = createRuntime();
  const port = await runtime.listen(0);

  const response = await fetch(`http://127.0.0.1:${port}/internal/events`, {
    method: "POST",
    body: "{}",
  });

  expect(response.status).toBe(401);
});

test("does not join an unauthorized workspace", async () => {
  const runtime = createRuntime();
  const port = await runtime.listen(0);
  const client = io(`http://127.0.0.1:${port}`, {
    path: "/ws",
    auth: { ticket: "ticket" },
    transports: ["websocket"],
  });

  await new Promise<void>((resolve, reject) => {
    client.once("connect", resolve);
    client.once("connect_error", reject);
  });
  const result = await client.emitWithAck("join-workspace", "w1");
  await new Promise<void>((resolve) => {
    client.once("disconnect", () => resolve());
    client.close();
  });

  expect(result).toEqual({ ok: false });
});

test("rejects a disallowed browser origin during the Socket.IO handshake", async () => {
  const runtime = createRuntime(async () => true, "http://allowed.example");
  const port = await runtime.listen(0);
  const client = io(`http://127.0.0.1:${port}`, { path: "/ws", auth: { ticket: "ticket" }, transports: ["websocket"], extraHeaders: { origin: "http://evil.example" } });
  await expect(new Promise<void>((resolve, reject) => { client.once("connect", () => reject(new Error("connected"))); client.once("connect_error", () => resolve()); })).resolves.toBeUndefined();
  client.close();
});

test("delivers a validated event to an authorized workspace room", async () => {
  const runtime = createRuntime(async () => true);
  const port = await runtime.listen(0);
  const client = io(`http://127.0.0.1:${port}`, { path: "/ws", auth: { ticket: "ticket" }, transports: ["websocket"] });
  await new Promise<void>((resolve, reject) => { client.once("connect", resolve); client.once("connect_error", reject); });
  expect(await client.emitWithAck("join-workspace", "w1")).toEqual({ ok: true });
  const eventPromise = new Promise<unknown>((resolve) => client.once("realtime-event", resolve));
  const response = await fetch(`http://127.0.0.1:${port}/internal/events`, { method: "POST", headers: { "content-type": "application/json", "x-realtime-api-key": "publisher-key" }, body: JSON.stringify({ type: "resource.updated", eventId: "b7fa9ad5-9c93-4cce-a83d-8d0438abef12", occurredAt: "2026-07-19T00:00:00.000Z", resourceId: "r1", workspaceId: "w1" }) });
  expect(response.status).toBe(202);
  expect(await eventPromise).toMatchObject({ workspaceId: "w1" });
  client.close();
});
