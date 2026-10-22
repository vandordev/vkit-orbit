import { createFileRoute } from "@tanstack/react-router";
import { documentSearchSchema } from "@/lib/document-search";
import { DocumentsPage } from "./-components/documents-page";
export const Route = createFileRoute("/_authenticated/_dashboard/documents/")({
	validateSearch: documentSearchSchema,
	component: DocumentsPage,
});
