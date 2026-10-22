import type { Meta, StoryObj } from "@storybook/react";
import { RunDetailView } from "./run-detail-view";
const meta = { title: "Web/Pages/Documents/RunDetail", component: RunDetailView, args: { runId: "local-fixture" } } satisfies Meta<
	typeof RunDetailView
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Failed: Story = {};
