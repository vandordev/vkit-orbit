import type { Meta, StoryObj } from "@storybook/react";
import { ApiKeysPage } from "./api-keys-page";
const meta = { title: "Web/Pages/Developers/ApiKeys", component: ApiKeysPage } satisfies Meta<typeof ApiKeysPage>;
export default meta;
type Story = StoryObj<typeof meta>;
// Existing placeholder actions, not evidence of live key management.
export const Empty: Story = {};
