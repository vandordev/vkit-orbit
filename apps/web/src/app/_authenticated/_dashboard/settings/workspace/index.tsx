import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceSettings } from "./-components/workspace-settings";
export const Route = createFileRoute("/_authenticated/_dashboard/settings/workspace/")({ component: WorkspaceSettings });
