import type { Meta, StoryObj } from "@storybook/react";
import { Loading, loadingVariants } from "./loading";
import { Button } from "./button";

const meta = {
	title: "Vandor UI/Loading",
	component: Loading,
	parameters: { layout: "centered" },
	args: { variant: "arc", size: 24, "aria-label": "Loading" },
	argTypes: {
		variant: { control: "select", options: loadingVariants },
		size: { control: "number", type: "number" },
		duration: { control: "number" },
		text: { control: "text" },
		"aria-label": { control: "text" },
		variantProps: { control: false },
	},
} satisfies Meta<typeof Loading>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const AllVariants: Story = {
	render: () => (
		<div className="grid w-full max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
			{loadingVariants.map((variant) => (
				<div key={variant} className="flex min-h-24 flex-col items-center justify-center gap-3">
					<Loading variant={variant} size={16} aria-label={`Loading: ${variant}`} />
					<span className="text-sm text-muted-foreground">{variant}</span>
				</div>
			))}
		</div>
	),
};
export const Sizes: Story = {
	render: () => (
		<div className="flex flex-wrap items-center gap-6">
			{[16, 24, 48].map((size) => (
				<Loading key={size} size={size} aria-label={`Loading at ${size} pixels`} />
			))}
		</div>
	),
};
export const Text: Story = {
	args: { variant: "text-dots", text: "Preparing document", size: 16, "aria-label": "Preparing document" },
};
export const VariantOptions: Story = {
	render: () => <Loading variant="bars" variantProps={{ bars: 5 }} size={32} duration={2} aria-label="Processing document" />,
};
export const WithButton: Story = {
	render: () => (
		<div className="flex flex-wrap items-center gap-6">
			<Loading aria-label="Loading preview" />
			<Button isLoading>Saving</Button>
		</div>
	),
};
