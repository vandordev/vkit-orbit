import { $ } from "bun";
await $`bun --cwd packages/database run db:migrate`;
