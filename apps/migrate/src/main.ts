import { $ } from "bun";
await $`cd packages/database && bun run db:migrate`;
