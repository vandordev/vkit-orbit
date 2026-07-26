import { Elysia, t } from "elysia";

import { prisma } from "@repo/database";

import { apiOperation } from "../openapi/operation";

export const healthRoutes = new Elysia({ prefix: "/health", tags: ["Health"] })
	.get(
		"/",
		() => ({
			success: true as const,
			data: {
				status: "healthy" as const,
				timestamp: new Date().toISOString(),
				uptime: process.uptime(),
			},
		}),
		{
			response: t.Object(
				{
					success: t.Literal(true, {
						description: "Whether the liveness check completed successfully.",
						examples: [true],
					}),
					data: t.Object({
						status: t.Literal("healthy", {
							description: "Current liveness status of this process.",
							examples: ["healthy"],
						}),
						timestamp: t.String({
							description: "ISO 8601 timestamp when the liveness response was generated.",
							examples: ["2026-07-26T00:00:00.000Z"],
						}),
						uptime: t.Number({
							description: "Process uptime in seconds.",
							examples: [3600.5],
						}),
					}),
				},
				{
					description: "Successful liveness response.",
					examples: [{ success: true, data: { status: "healthy", timestamp: "2026-07-26T00:00:00.000Z", uptime: 3600.5 } }],
				},
			),
			detail: apiOperation({
				summary: "Get process liveness",
				description: "Returns process-level liveness without querying dependent services.",
				tags: ["Health"],
			}),
		},
	)
	.get(
		"/ready",
		async ({ set }) => {
			try {
				await prisma.$queryRaw`SELECT 1`;
				return {
					success: true as const,
					data: {
						status: "ready" as const,
						timestamp: new Date().toISOString(),
					},
				};
			} catch {
				set.status = 503;
				return {
					success: false as const,
					error: "NOT_READY" as const,
					message: "Database is not ready",
					timestamp: new Date().toISOString(),
				};
			}
		},
		{
			response: {
				200: t.Object(
					{
						success: t.Literal(true),
						data: t.Object({
							status: t.Literal("ready", { description: "Current readiness status of the process.", examples: ["ready"] }),
							timestamp: t.String({
								description: "ISO 8601 timestamp when the readiness response was generated.",
								examples: ["2026-07-26T00:00:00.000Z"],
							}),
						}),
					},
					{
						description: "Successful readiness response.",
						examples: [{ success: true, data: { status: "ready", timestamp: "2026-07-26T00:00:00.000Z" } }],
					},
				),
				503: t.Object(
					{
						success: t.Literal(false),
						error: t.Literal("NOT_READY", { description: "Machine-readable readiness failure code.", examples: ["NOT_READY"] }),
						message: t.String({ description: "Human-readable explanation of the readiness failure.", examples: ["Database is not ready"] }),
						timestamp: t.String({
							description: "ISO 8601 timestamp when the readiness response was generated.",
							examples: ["2026-07-26T00:00:00.000Z"],
						}),
					},
					{
						description: "Unavailable readiness response.",
						examples: [{ success: false, error: "NOT_READY", message: "Database is not ready", timestamp: "2026-07-26T00:00:00.000Z" }],
					},
				),
			},
			detail: apiOperation({
				summary: "Get process readiness",
				description: "Checks whether the process can query its database dependency before accepting traffic.",
				tags: ["Health"],
			}),
		},
	);
