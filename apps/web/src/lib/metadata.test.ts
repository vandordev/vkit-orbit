import { describe, expect, test } from "bun:test";

import { createMetadata } from "./metadata";

describe("createMetadata", () => {
	test("adds the brand and canonical metadata for a route", () => {
		const metadata = createMetadata({ title: "Pricing", description: "Plans", pathname: "/pricing" });
		expect(metadata.meta).toEqual(expect.arrayContaining([
				{ title: "Pricing | Vkit Orbit" },
				{ name: "description", content: "Plans" },
				{ property: "og:title", content: "Pricing | Vkit Orbit" },
		]));
		expect(metadata.links).toEqual([{ rel: "canonical", href: "/pricing" }]);
	});

	test("does not duplicate the brand title and supports an image", () => {
		const metadata = createMetadata({ title: "Vkit Orbit", description: "Home", image: "/orbit.png" });
		expect(metadata.meta).toEqual(expect.arrayContaining([{ title: "Vkit Orbit" }, { property: "og:image", content: "/orbit.png" }]));
		expect(metadata.links).toEqual([]);
	});
});
