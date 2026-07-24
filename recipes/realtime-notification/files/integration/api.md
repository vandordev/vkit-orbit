# API integration

Copy `../apps/api/src/routes/examples.ts`, export `createExampleRoutes`, and
register it in the app factory with a consumer-owned `enqueueExample` adapter.
The adapter uses the recipe queue contract and remains server-side.
