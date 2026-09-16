import { createServer } from "node:http";
export function createHealthServer(input: { isReady: () => boolean; port?: number }) {
	const server = createServer((request, response) => {
		if (request.url === "/health/live" || (request.url === "/health/ready" && input.isReady())) {
			response.statusCode = 200;
			response.end("ok");
			return;
		}
		response.statusCode = 503;
		response.end("not ready");
	});
	return { server, listen: () => server.listen(input.port ?? 4103) };
}
