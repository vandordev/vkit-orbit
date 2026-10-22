import type { Meta, StoryObj } from "@storybook/react";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { useState } from "react";
import { AuthFormView } from "./auth-form-view";

function Preview({ mode }: { mode: "sign-in" | "register" }) {
	const [router] = useState(() =>
		createRouter({
			routeTree: createRootRoute({ component: () => <AuthFormView mode={mode} onSubmit={(event) => event.preventDefault()} /> }),
			history: createMemoryHistory({ initialEntries: ["/"] }),
		}),
	);
	return <RouterProvider router={router} />;
}
const meta = { title: "Web/Pages/Auth", component: AuthFormView, parameters: { layout: "fullscreen" } } satisfies Meta<typeof AuthFormView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SignIn: Story = {
	args: { mode: "sign-in", onSubmit: (event) => event.preventDefault() },
	render: () => <Preview mode="sign-in" />,
};
export const Register: Story = {
	args: { mode: "register", onSubmit: (event) => event.preventDefault() },
	render: () => <Preview mode="register" />,
};
