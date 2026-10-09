import { z } from "zod";

// v1 timestamps allow UTC minute precision as well as seconds/fractions.
// Zod 4's datetime requires seconds for qualified times; preserve the existing
// wire acceptance without importing any Zod 3 compatibility API.
const date = z.iso.date();
export const wireDatetimeSchema = z.string().refine(value => {
	return /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?Z$/.test(value) && date.safeParse(value.slice(0, 10)).success;
}, "Invalid datetime");
