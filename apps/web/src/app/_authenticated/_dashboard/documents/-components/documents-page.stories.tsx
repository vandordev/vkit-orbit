import type { Meta, StoryObj } from "@storybook/react";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { useState } from "react";
import { DocumentsPage } from "./documents-page";
const meta = { title: "Web/Pages/Documents/Collection", component: DocumentsPage } satisfies Meta<typeof DocumentsPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {
	render: function Preview() {
		const [router] = useState(() =>
			createRouter({ routeTree: createRootRoute({ component: DocumentsPage }), history: createMemoryHistory({ initialEntries: ["/"] }) }),
		);
		return <RouterProvider router={router} />;
	},
};
