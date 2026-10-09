import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "./button";

const meta = {
	title: "Web/UI/Button",
	component: Button,
	args: { children: "Save changes" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Outline: Story = { args: { variant: "outline" } };
export const Small: Story = { args: { size: "sm" } };
export const Large: Story = { args: { size: "lg" } };
export const Disabled: Story = { args: { disabled: true } };
export const LongLabel: Story = { args: { children: "Save document processing preferences" } };
export const Link: Story = {
	args: { variant: "link", asChild: true },
	render: (args) => (
		<Button {...args}>
			<a href="#preview-result">View preview result</a>
		</Button>
	),
};
export const LocalInteraction: Story = {
	render: function LocalInteraction(args) {
		const [count, setCount] = useState(0);
		return (
			<div className="flex flex-col items-start gap-4">
				<Button {...args} onClick={() => setCount((value) => value + 1)}>
					Run local preview
				</Button>
				<p role="status">Preview actions: {count}. No API request is made.</p>
			</div>
		);
	},
};
