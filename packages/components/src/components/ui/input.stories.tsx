import type { Meta, StoryObj } from "@storybook/react";
import { useRef, useState } from "react";
import { Button } from "./button";
import { Input } from "./input";

const meta = { title: "Vandor UI/Input", component: Input, args: { label: "Document title", placeholder: "Enter a title" } } satisfies Meta<
	typeof Input
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true, defaultValue: "Read-only fixture" } };
export const Invalid: Story = {
	args: { "aria-invalid": true, "aria-describedby": "input-error" },
	render: (args) => (
		<div>
			<Input {...args} />
			<p id="input-error" role="alert">
				Enter a document title.
			</p>
		</div>
	),
};
export const File: Story = {
	args: { label: "Choose a .txt or .md document", type: "file", accept: ".txt,.md,text/plain,text/markdown", placeholder: undefined },
	render: function FilePreview(args) {
		const [filename, setFilename] = useState("No file selected");
		return (
			<div className="grid gap-3">
				<Input {...args} onChange={(event) => setFilename(event.currentTarget.files?.[0]?.name ?? "No file selected")} />
				<p role="status">{filename}</p>
			</div>
		);
	},
};
export const Form: Story = {
	render: function FormPreview() {
		const [saved, setSaved] = useState("");
		const ref = useRef<HTMLInputElement>(null);
		return (
			<form
				className="grid max-w-md gap-4"
				onSubmit={(event) => {
					event.preventDefault();
					setSaved(String(new FormData(event.currentTarget).get("title")));
				}}
			>
				<Input ref={ref} id="fixture-title" label="Document title" name="title" required defaultValue="Quarterly report" />
				<Button type="submit">Save title</Button>
				<Button type="button" variant="outline" onClick={() => ref.current?.focus()}>
					Focus title
				</Button>
				<p role="status">{saved ? `Saved: ${saved}` : "Local form fixture"}</p>
			</form>
		);
	},
};
