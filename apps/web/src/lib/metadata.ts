import { appConfig } from "./config";

export type MetadataInput = {
	title: string;
	description: string;
	pathname?: string;
	image?: string;
};

export function createMetadata({ title, description, pathname, image }: MetadataInput) {
	const fullTitle = title === appConfig.appName ? title : `${title} | ${appConfig.appName}`;

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
