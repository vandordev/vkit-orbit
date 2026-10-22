import type { Meta, StoryObj } from "@storybook/react";
import { HeroText } from "./hero-shutter-text";
const meta = {
	title: "Web/Components/HeroText",
	component: HeroText,
	parameters: { layout: "fullscreen" },
	decorators: [
		(Story) => (
			<div className="h-[500px]">
				<Story />
			</div>
		),
	],
	args: { text: "ORBIT" },
} satisfies Meta<typeof HeroText>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
