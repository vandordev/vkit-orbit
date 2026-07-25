import { RotatingEarth } from "./rotating-earth";

export function OrbitHero() {
	return <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1fr_0.9fr] lg:items-center"><div className="max-w-2xl space-y-7"><p className="font-mono text-xs uppercase tracking-[0.35em] text-cyan-300">A domain-neutral runtime constellation</p><h1 className="text-5xl font-semibold tracking-[-0.06em] text-white sm:text-7xl">Build your product at the center of the orbit.</h1><p className="max-w-xl text-lg leading-8 text-slate-400">Vkit Orbit is a TanStack Start boilerplate with embedded Elysia, Prisma, River producers, a Go worker, and optional realtime, clear boundaries for the domain you bring next.</p></div><RotatingEarth width={560} height={560} className="mx-auto w-full max-w-[30rem]" /></section>;
}
