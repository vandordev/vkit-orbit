import type { Meta, StoryObj } from "@storybook/react";
import { WorkspaceSettings } from "./workspace-settings";
const meta = { title: "Web/Pages/Settings/Workspace", component: WorkspaceSettings } satisfies Meta<typeof WorkspaceSettings>;
export default meta;
type Story = StoryObj<typeof meta>;
// Existing placeholder save action, no persistence is installed by this migration.
export const Default: Story = {};
