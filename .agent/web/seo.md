# TanStack Start SEO

## Authority and scope

Use the `tanstack-seo` skill for SEO work in `apps/web`, including metadata,
canonical URLs, Open Graph, Twitter Cards, JSON-LD, OG images, sitemap, robots,
LLM discovery files, and web manifest/icons. Load its relevant references before
implementation. Adapt examples to this repository; do not copy placeholder brand,
domain, routes, content, or assets. Repository architecture and
[verification policy](../verification.md) govern local paths and execution.

These are implementation rules, not a claim that every SEO layer is installed.
The current `src/lib/metadata.ts` helper provides title, description, partial OG,
and optional canonical metadata. `src/app/__root.tsx` provides charset, viewport,
favicon, `HeadContent`, and HTML language. Complete social metadata, structured
data, and discovery endpoints require separately scoped implementation.

## Configuration and ownership

- `packages/brand` is the source of truth for name, logo, and color tokens.
  Consume `@repo/brand` entrypoints; do not introduce a web-local `brand/index.ts`
  with duplicate values merely because the skill uses that example. `appConfig`
  derives identity from brand and owns app-specific SEO defaults/configuration.
- Confirm the public production origin and indexable route set with the user
  before implementation. Do not infer an origin from the repository URL, localhost,
  untrusted request headers, or `https://yoursite.com`.
- Deployment configuration uses existing YAML/config loaders, not feature-level
  `process.env` reads. Only browser-safe public SEO values may reach client code;
  never import a secret-bearing server config loader into browser modules.
- Centralize typed metadata and URL helpers. Evolve `src/lib/metadata.ts`, or use
  `src/lib/seo.ts` as an explicit replacement with a scoped call-site migration.
  Do not maintain competing helpers with inconsistent metadata or URL rules.

## HTML route heads

- Use TanStack Router's `head()` and `HeadContent`, not Next.js metadata APIs,
  client effects, or manual DOM insertion. Root defaults live in
  `src/app/__root.tsx`; each public page supplies its own title, description,
  canonical path, and relevant social/structured metadata through the shared helper.
- Suffix titles once with the configured app name. Canonical, `og:url`, and image
  URLs are absolute URLs under the approved public origin (or explicitly approved
  external images). Normalize paths/query handling deliberately, not by blindly
  concatenating strings or accepting arbitrary origins.
- Include OG type, site name, title, description, URL, image and image alt text,
  plus Twitter card/title/description/image. Add social handles, locale, author,
  article dates, and tags only when known and applicable. Do not reference missing
  images or fabricate social identities.
- Preserve charset, viewport, supported favicons, and the correct HTML `lang`.
  Parent/child head merging must not leave a child's title paired with a parent's
  stale canonical or social URL. Review the installed TanStack API's behavior.
- Private/authenticated, admin, tenant, search-result, and utility pages are not
  automatically indexable. Set explicit indexing policy with appropriate robots
  metadata; keep them out of public discovery outputs. `robots.txt` and `noindex`
  are crawler hints, not authorization or confidentiality controls.

## Structured data and public discovery

- Emit JSON-LD through `head().scripts` with `application/ld+json`. Serialize
  safely for HTML script context, including escaping `<` in user-derived strings.
  Do not concatenate raw values into scripts or markup.
- Use Organization/WebSite and Article/Breadcrumb/FAQ/Software schemas only when
  they describe real public content. Do not invent an organization, authors,
  dates, license, FAQ, ratings, or product claims from sample code.
- Sitemap includes only canonical, public, indexable pages that actually exist.
  Escape XML values and use real modification dates when available. Never include
  auth/admin/API/health/tenant-private routes or invent blog/pricing/docs pages.
- `public/robots.txt` follows the approved indexing policy and points to the
  absolute sitemap URL only when that endpoint exists. Do not copy `Allow: /`
  without deciding what this deployment should expose to crawlers.
- `llms.txt` and `llms-full.txt` contain approved public descriptions/content only.
  Do not expose uploaded documents, tenant data, secrets, authenticated API output,
  or internal implementation documentation. These optional discovery files are
  not a promise of indexing or ranking.
- Manifest/icon links must refer to installed assets and derive brand values from
  the existing owner. A manifest does not imply offline/PWA behavior is implemented.

## Server route adaptation and OG images

- Route source stays in `src/app`, not the skill's example `src/routes` tree.
  Retain the directory-first conventions in [routing.md](routing.md). For example,
  `src/app/og[.]png/index.ts` represents `/og.png`; `[.]` escapes a literal dot.
  Apply the same pattern to `/sitemap.xml` and `/llms*.txt` if installed.
- Non-HTML SEO endpoints use TanStack Start `server.handlers.GET` and return
  typed Responses with the correct PNG/XML/plaintext content type. No React
  component or UI route boundaries, and no proxy to `apps/api` is required.
- If dynamic OG images are in scope, install `satori` and `@resvg/resvg-js` in
  the web owner and keep generators, native dependencies, and fonts server-only.
  Default image size is 1200 by 630. Bound title/description inputs and reuse the
  configured brand rather than the example palette. Do not fetch arbitrary
  user-provided URLs; choose controlled font/assets and define failure handling.
- Skill cache defaults are 24 hours for public OG/LLM responses and one hour for
  a public sitemap. Use public caching only for public, non-personalized output.

## Verification

SEO helpers, route heads, serialization, and server endpoints use the system
track: affected native typechecks only. Do not start web/backend services, call
SEO endpoints or remote crawlers, render server OG images, download runtime fonts,
run tests/builds, or start Compose for verification. Route-tree regeneration
still requires the explicit authorization described in [routing.md](routing.md).

If an approved task changes visible presentation, that UI boundary uses Storybook
plus typecheck with local fixtures, without importing server OG generators into
stories. Storybook does not establish SEO response correctness or crawlability.
Report SSR metadata, endpoint responses, OG rendering, indexing, and crawler
behavior as runtime-unverified; typecheck is not proof that SEO works in production.
