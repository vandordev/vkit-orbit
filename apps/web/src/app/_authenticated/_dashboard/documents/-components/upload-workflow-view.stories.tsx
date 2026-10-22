import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { UploadWorkflowView } from "./upload-workflow-view";
const meta = {
	title: "Web/Components/UploadWorkflow",
	component: UploadWorkflowView,
	args: { stage: "idle", onFileChange: () => {}, onConfirm: () => {} },
} satisfies Meta<typeof UploadWorkflowView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Idle: Story = {};
export const Uploading: Story = { args: { stage: "uploading" } };
export const Analyzing: Story = { args: { stage: "analyzing" } };
export const LocalInteraction: Story = {
	render: function LocalPreview() {
		const [stage, setStage] = useState<"idle" | "uploading" | "analyzing">("idle");
		return <UploadWorkflowView stage={stage} onFileChange={() => setStage("uploading")} onConfirm={() => setStage("analyzing")} />;
	},
};
