import type { Meta, StoryObj } from "@storybook/react";
import { StatusTimeline } from "./status-timeline";
const meta = { title: "Web/Components/StatusTimeline", component: StatusTimeline } satisfies Meta<typeof StatusTimeline>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Queued: Story = {};
export const Failed: Story = { args: { status: "FAILED" } };
