import type { Meta, StoryObj } from "@storybook/react";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { useState } from "react";
import { DocumentTable } from "./document-table";

function Preview(props: Parameters<typeof DocumentTable>[0]) {
	const [router] = useState(() =>
		createRouter({
			routeTree: createRootRoute({ component: () => <DocumentTable {...props} /> }),
			history: createMemoryHistory({ initialEntries: ["/"] }),
		}),
	);
	return <RouterProvider router={router} />;
}
const meta = { title: "Web/Components/DocumentTable", component: DocumentTable } satisfies Meta<typeof DocumentTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = { render: () => <Preview /> };
export const Populated: Story = {
	render: () => (
		<Preview
			documents={[
				{ id: "fixture-report", name: "Quarterly report.txt", status: "READY" },
				{ id: "fixture-notes", name: "A long document filename for responsive inspection.md", status: "UPLOADING" },
			]}
		/>
	),
};
