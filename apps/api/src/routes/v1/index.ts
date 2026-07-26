import { createRoutes } from "../create-routes";
import { systemRoutes } from "./system";

export function createV1Routes() {
	return createRoutes(1).use(systemRoutes);
}
