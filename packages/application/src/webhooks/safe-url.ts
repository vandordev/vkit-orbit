import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const blocked = new BlockList();
for (const [address, bits] of [
	["0.0.0.0", 8],
	["10.0.0.0", 8],
	["100.64.0.0", 10],
	["127.0.0.0", 8],
	["169.254.0.0", 16],
	["172.16.0.0", 12],
	["192.0.0.0", 24],
	["192.0.2.0", 24],
	["192.168.0.0", 16],
	["198.18.0.0", 15],
	["198.51.100.0", 24],
	["203.0.113.0", 24],
	["224.0.0.0", 3],
] as const)
	blocked.addSubnet(address, bits, "ipv4");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
for (const [address, bits] of [
	["2001::", 23],
	["2001:db8::", 32],
	["2002::", 16],
] as const)
	blocked.addSubnet(address, bits, "ipv6");

export type WebhookUrlPolicy = { resolve?: (host: string) => Promise<readonly string[]> };
export type WebhookTarget = { url: URL; address: string; family: 4 | 6 };

export async function validateWebhookUrl(value: string, policy: WebhookUrlPolicy = {}): Promise<WebhookTarget> {
	const url = new URL(value);
	if (url.protocol !== "https:" || url.username || url.password || url.hash || (url.port && url.port !== "443")) {
		throw new Error("WEBHOOK_URL_REJECTED");
	}
	const host = url.hostname.replace(/^\[|\]$/g, "");
	const addresses = isIP(host)
		? [host]
		: policy.resolve
			? await policy.resolve(host)
			: (await lookup(host, { all: true })).map(({ address }) => address);
	if (!addresses.length) throw new Error("WEBHOOK_URL_REJECTED");
	for (const address of addresses) {
		const family = isIP(address);
		if (!family || (family === 4 ? blocked.check(address, "ipv4") : !globalV6.check(address, "ipv6") || blocked.check(address, "ipv6"))) {
			throw new Error("WEBHOOK_URL_REJECTED");
		}
	}
	return { url, address: addresses[0]!, family: isIP(addresses[0]!) as 4 | 6 };
}
