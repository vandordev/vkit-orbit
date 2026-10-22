import type { Meta, StoryObj } from "@storybook/react";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./table";

const meta = { title: "Vandor UI/Table", component: Table } satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => (
		<div className="max-w-full overflow-x-auto rounded-xl border border-border">
			<Table className="min-w-[560px]">
				<TableCaption>Local document fixtures</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableHead scope="row">Quarterly report.txt</TableHead>
						<TableCell>COMPLETED</TableCell>
					</TableRow>
					<TableRow>
						<TableHead scope="row">A long document filename for responsive table inspection.md</TableHead>
						<TableCell>QUEUED</TableCell>
					</TableRow>
				</TableBody>
				<TableFooter>
					<TableRow>
						<TableCell colSpan={2}>2 local fixtures, no live processing</TableCell>
					</TableRow>
				</TableFooter>
			</Table>
		</div>
	),
};
