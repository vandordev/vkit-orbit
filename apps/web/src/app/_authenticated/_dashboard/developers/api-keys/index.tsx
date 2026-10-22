import { createFileRoute } from "@tanstack/react-router";
import { ApiKeysPage } from "./-components/api-keys-page";
export const Route = createFileRoute("/_authenticated/_dashboard/developers/api-keys/")({ component: ApiKeysPage });
