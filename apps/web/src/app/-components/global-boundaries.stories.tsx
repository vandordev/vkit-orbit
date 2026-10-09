import type { Meta, StoryObj } from "@storybook/react";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createContext, useContext, useState, type ReactNode } from "react";
import { GlobalError } from "./global-error";
import { GlobalNotFound } from "./global-not-found";

// Story-owned router context for real typed links; no app routes or API clients.
const PreviewContent = createContext<ReactNode>(null);
function BoundaryContent() {
	return useContext(PreviewContent);
}
function BoundaryPreview({ children }: { children: ReactNode }) {
	const [router] = useState(() =>
		createRouter({
			routeTree: createRootRoute({ component: BoundaryContent }),
			history: createMemoryHistory({ initialEntries: ["/"] }),
		}),
	);
	return (
		<PreviewContent.Provider value={children}>
			<RouterProvider router={router} />
		</PreviewContent.Provider>
	);
}

const meta = {
	title: "Web/Components/RouteBoundaries",
	parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Error: Story = {
	render: function ErrorPreview() {
		const [retries, setRetries] = useState(0);
		return (
			<BoundaryPreview>
				<GlobalError error={new globalThis.Error("Local story fixture")} reset={() => setRetries((count) => count + 1)} />
				<p role="status" className="text-center text-muted-foreground">
					Local retry attempts: {retries}
				</p>
			</BoundaryPreview>
		);
	},
};

export const NotFound: Story = {
	render: () => (
		<BoundaryPreview>
			<GlobalNotFound />
		</BoundaryPreview>
	),
};
