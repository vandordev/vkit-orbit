/** Only remove the literal legacy prefix; query and hash are forwarded verbatim. */
export function legacyDashboardHref(location: { pathname: string; searchStr: string; hash: string }) {
	const remainder = location.pathname.replace(/^\/app(?=\/|$)/, "");
	const pathname = !remainder || remainder === "/" || /^\/overview\/?$/.test(remainder) ? "/" : remainder;
	// Prevent a legacy /app//... URL from becoming a protocol-relative redirect.
	const safePathname = pathname.startsWith("//") || pathname.includes("\\") ? "/" : pathname;
	return `${safePathname}${location.searchStr}${location.hash ? `#${location.hash.replace(/^#/, "")}` : ""}`;
}
