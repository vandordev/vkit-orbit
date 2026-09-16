import { QueryClient } from "@tanstack/react-query";
export function createTRPCQueryClient() {
	return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
}
