import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function PublicHeader() {
	return <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6"><Link to="/" className="font-mono text-sm tracking-[0.3em] text-cyan-300">VKIT / ORBIT</Link><Button asChild variant="outline"><a href="https://github.com/vandordev/vx" target="_blank" rel="noreferrer">Read the contracts</a></Button></header>;
}
