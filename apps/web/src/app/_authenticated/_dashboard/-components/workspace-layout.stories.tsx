import type { Meta, StoryObj } from "@storybook/react";
import { ActivityIcon, FileTextIcon, KeyRoundIcon, LayoutDashboardIcon, SettingsIcon } from "lucide-react";
import { WorkspaceLayout } from "./workspace-layout";

const navigation = [
	{ id: "overview", label: "Overview", icon: <LayoutDashboardIcon />, active: true, link: <a href="#overview" /> },
	{ id: "documents", label: "Documents", icon: <FileTextIcon />, link: <a href="#documents" /> },
	{ id: "activity", label: "Activity", icon: <ActivityIcon />, link: <a href="#activity" /> },
	{ id: "developers", label: "Developers", icon: <KeyRoundIcon />, link: <a href="#developers" /> },
	{ id: "settings", label: "Settings", icon: <SettingsIcon />, link: <a href="#settings" /> },
];
const meta = {
	title: "Web/Layouts/Workspace",
	component: WorkspaceLayout,
	parameters: { layout: "fullscreen" },
	args: {
		navigation,
		workspace: { status: "ready", label: "Orbit documents" },
		account: { status: "ready", label: "avery@example.test" },
		heading: "Overview",
		children: (
			<section className="flex flex-col gap-3">
				<h1 className="text-2xl font-semibold">Overview</h1>
				<p className="max-w-prose text-muted-foreground">Manage your documents and processing runs.</p>
				<p className="text-sm text-muted-foreground">Local presentation fixtures only. No runtime metrics are shown.</p>
			</section>
		),
	},
} satisfies Meta<typeof WorkspaceLayout>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Collapsed: Story = { args: { defaultCollapsed: true } };
export const Pending: Story = { args: { workspace: { status: "pending" }, account: { status: "pending" } } };
export const Error: Story = {
	args: { workspace: { status: "error", onRetry: () => {} }, account: { status: "error", onRetry: () => {} } },
};
export const NoWorkspace: Story = { args: { workspace: { status: "unselected" } } };
export const LongContent: Story = {
	args: {
		workspace: { status: "ready", label: "An exceptionally long workspace name for document operations and internal records" },
		account: { status: "ready", label: "avery.with.an.exceptionally.long.email@documents.example.test" },
		children: (
			<section className="flex flex-col gap-4">
				<h1 className="text-2xl font-semibold">Documents</h1>
				{Array.from({ length: 40 }, (_, index) => (
					<p key={index} className="border-b border-border py-3">
						Document example {index + 1}
					</p>
				))}
			</section>
		),
	},
};
