import type { RiverInsertClient } from "@repo/queue";

export function registerSchedules(queue: RiverInsertClient): () => void {
	void queue;
	return () => {};
}
