# Security

Do not commit `.env` files, database credentials, API keys, tokens, or private certificates. Use the tracked `.env.example` file as the local template.

Report a suspected vulnerability privately to the repository owner instead of opening a public issue with exploit details. Include the affected component, reproduction steps, impact, and a suggested mitigation when available.

Before deploying, provide explicit production values for server-only configuration, especially `DATABASE_URL`. Only deliberately public `VITE_*` values may enter browser bundles; all database credentials, worker keys, internal URLs, publisher keys, and ticket secrets remain server-only.
