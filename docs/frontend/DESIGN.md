# Frontend design direction

## Scope and authority

This is the design baseline for this boilerplate, not a claim that every current
screen already meets it. Read [the UX contract](FRONTEND_CONTRACT.md) for behavior,
use [the page brief](PAGE_BRIEF.md) before substantial surface changes, and record
evidence with [the review checklist](FRONTEND_REVIEW.md).

Repository architecture, shared primitive ownership, brand ownership and
[verification policy](../../.agent/verification.md) still apply. This document
does not authorize new features, schema changes, dependencies or runtime checks.

## Product cognition

The installed example helps workspace members upload plain-text/Markdown documents
and inspect their processing. Its core objects are workspace, document and
processing run; API keys and webhooks are developer-facing configuration. A document
and a processing run have separate states and must not be presented as the same
object. Existing schema and typed transport, not imagined fixtures, determine what
can be displayed.

Source context: [PRODUCT.md](../../PRODUCT.md), [README.md](../../README.md), and
`packages/db/prisma/schema.prisma`. A consumer adopting this boilerplate must update
the product context and vocabulary for its own domain before designing new flows.
Document-processing examples below are examples, not universal boilerplate scope.

## Temperament and foundations

- Calm, clear, task-first content operations. Developer settings may be denser and
  more technical than everyday workspace screens.
- Keep the installed TanStack Start, Tailwind and shared Vandor UI foundation.
  Import primitives directly from `@repo/components/<name>`; consult
  [component ownership](../../.agent/components.md) before adding anything.
- Reuse identity and semantic colors from `packages/brand`; do not invent a parallel
  palette or copy Universe branding. Preserve the installed light theme unless a
  separate theme change is approved.
- Existing table primitives support simple browsing. A richer table engine, form
  library or overlay API is an explicit dependency/implementation decision, not
  something a design brief may assume is installed.

## Visual direction

- Use balanced density for everyday lists and forms; compact layouts when scanning
  many operational records. Give difficult decisions more space, not bigger chrome.
- Retain the current typography and component tokens. Use weight, scale, grouping
  and whitespace for hierarchy before adding decorative containers.
- Align headings, filters, rows and footers to a coherent grid. Use a small set of
  repeated spacing steps within each surface and reuse existing component sizing.
- Use surfaces and borders to express actual groups. Avoid nested cards or a card
  per field; whitespace is valid when it supports reading, not unfinished content.
- Keep one visually dominant action per task region. Secondary and utility actions
  stay quieter; destructive styling communicates risk, not emphasis alone.
- Place actions beside their target. Status is read-only, not an input or a tab.
  Selection uses more than color alone, such as weight plus a background or marker.
- Handle long filenames, labels, IDs and tags deliberately. Truncate only when the
  full value remains available accessibly; wrap or isolate diagnostic content.
- Motion explains state changes. Respect reduced motion and avoid decorative waits
  before an operational task becomes usable.

These are craft defaults, not a global ban on color, gradients, cards or expressive
design. A different product or marketing surface may justify another direction;
record why it fits without weakening accessibility or task clarity.

## Journeys before screens

For each surface, identify who arrives, what they already know, the first decision,
completion feedback and a safe recovery path. Typical patterns are:

- Browse → inspect a compact detail → close and continue at the same list position.
- Browse → start substantial work on a dedicated page → return to retained context.
- Enter data → validate → submit → explicit result; preserve recoverable input on error.

Choose the container using the UX contract, not the route tree or number of fields.
On mobile, prioritize the current task and action before secondary metadata; do not
simply stack every desktop region. A drawer may become fullscreen while retaining
its dismissal, history, focus and unsaved-change semantics.

## Vocabulary and evidence

Current example screens use English. Keep each product surface's chosen language
consistent; the developer's chat language is not a request to translate the UI.
Use words such as Documents, Processing, Upload, Retry and Save changes when they
describe a supported action. Technical codes, IDs, hashes and JSON belong in
secondary diagnostics unless the task explicitly requires them. A filename may be
the primary document label; do not demote useful human-recognizable names as IDs.

Loading/empty/error/success copy describes what happened and what the user can do,
not the agent's design intent. Never imply that a placeholder action, schema field
or Storybook fixture proves a working runtime capability. Existing gaps require a
scoped implementation, not a success claim in documentation.
