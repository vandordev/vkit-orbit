import type { Meta, StoryObj } from "@storybook/react";
import { FileTextIcon, LayoutDashboardIcon } from "lucide-react";
import { useState } from "react";
import { AppShell } from "./app-shell";
import { Button } from "./button";

const meta = {
	title: "Vandor UI/AppShell",
	component: AppShell,
	parameters: { layout: "fullscreen" },
	args: {
		navigation: [
			{ id: "overview", label: "Overview", icon: <LayoutDashboardIcon />, active: true, link: <a href="#overview" /> },
			{ id: "documents", label: "Documents", icon: <FileTextIcon />, disabled: true, link: <a href="#documents" /> },
		],
		sidebarHeader: ({ collapsed }) => <span className="truncate p-2">{collapsed ? "W" : "Example workspace"}</span>,
		sidebarFooter: ({ collapsed }) => <span className="block truncate p-2">{collapsed ? "A" : "Example account"}</span>,
		header: "Overview",
		children: <h1 className="text-2xl font-semibold">Consumer content</h1>,
	},
} satisfies Meta<typeof AppShell>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Collapsed: Story = { args: { defaultCollapsed: true } };
export const Controlled: Story = {
	render: function Controlled(args) {
		const [collapsed, setCollapsed] = useState(false);
		return <AppShell {...args} collapsed={collapsed} onCollapsedChange={setCollapsed} />;
	},
};
export const Minimal: Story = { args: { navigation: [] } };

// The actual shared drawer and tooltip are exercised through this shell.
export const Keyboard: Story = { args: { children: <Button>Focusable content action</Button> } };
