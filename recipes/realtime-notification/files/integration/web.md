# Web integration

Copy `../apps/web/src/routes/examples/realtime.tsx` into the web route tree and
regenerate `routeTree.gen.ts`. Provide a product-issued ticket at runtime. The
page uses the generic Socket.IO invalidation client and refetches API-backed
data rather than treating realtime payloads as source-of-truth.
