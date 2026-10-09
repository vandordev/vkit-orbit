import type { Meta, StoryObj } from "@storybook/react";
import logoUrl from "@repo/brand/logo.png";
import { brand } from "./index";
import "./tokens.css";

const meta = {
	title: "Brand/Identity",
	parameters: { layout: "centered" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Identity: Story = {
	render: () => (
		<div className="flex flex-col items-center gap-6">
			<div className="bg-foreground p-6">
				<img src={logoUrl} alt={`${brand.name} logo`} width={180} height={180} />
			</div>
			<p className="text-xl font-semibold">{brand.name}</p>
		</div>
	),
};

const colorRoles = [
	"background",
	"foreground",
	"primary",
	"primary-foreground",
	"muted",
	"muted-foreground",
	"secondary",
	"secondary-foreground",
	"accent",
	"accent-foreground",
	"destructive",
	"input",
	"border",
	"ring",
] as const;

export const ColorTokens: Story = {
	render: () => (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
			{colorRoles.map((role) => (
				<div key={role} className="flex items-center gap-3">
					<span
						aria-hidden="true"
						className="size-10 shrink-0 rounded-md border border-border"
						style={{ backgroundColor: `var(--${role})` }}
					/>
					<code className="text-sm">--{role}</code>
				</div>
			))}
		</div>
	),
};
