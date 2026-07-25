import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";

export function PublicHeader() {
	return <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6"><Link to="/" className="font-mono text-sm tracking-[0.3em] text-cyan-300">{appConfig.appName}</Link><Button asChild className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white"><a href={appConfig.repositoryUrl} target="_blank" rel="noreferrer">Read the contracts</a></Button></header>;
}
