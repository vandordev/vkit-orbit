import { $ } from "bun";
await $`cd packages/db && bun run db:migrate`;
