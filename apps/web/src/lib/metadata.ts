export type MetadataInput = {
	title: string;
	description: string;
	pathname?: string;
	image?: string;
};

export function createMetadata({ title, description, pathname, image }: MetadataInput) {
	const fullTitle = title === "Vkit Orbit" ? title : `${title} | Vkit Orbit`;

	return {
		meta: [
			{ title: fullTitle },
			{ name: "description", content: description },
			{ property: "og:title", content: fullTitle },
			{ property: "og:description", content: description },
			...(image ? [{ property: "og:image", content: image }] : []),
		],
		links: pathname ? [{ rel: "canonical", href: pathname }] : [],
	};
}
