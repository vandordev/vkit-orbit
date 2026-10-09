import { createFileRoute } from "@tanstack/react-router";
import { handleTRPC } from "../../trpc/handler";

const handle = ({ request }: { request: Request }) => handleTRPC(request);
export const Route = createFileRoute("/trpc/$")({ server: { handlers: { GET: handle, POST: handle, OPTIONS: handle } } });
