# Page or interaction brief template

Copy this template beside the owning presentation component or into
`docs/frontend/pages/<surface>.md` for a new/substantially changed surface.
Replace prompts with decisions; mark inapplicable sections with a reason. Do not
copy this internal brief into the UI. It is not an implementation authorization.

## Context and journey

- Product in ordinary words; intended user and permissions:
- Core objects and relevant schema/typed transport evidence:
- Surface type and product temperament:
- Primary task and first decision:
- Entry/previous step and context already available:
- Success feedback, next step and failure recovery:
- User-facing language/vocabulary; technical detail kept secondary:

## Container decision

- Selected pattern: inline / popover / drawer / dialog / page / split view.
- Why it fits realistic content, task complexity and originating context:
- Alternatives rejected and why; refer to [the contract](FRONTEND_CONTRACT.md):
- Mobile/zoom/keyboard behavior; primary action placement:
- If a drawer: evidence the installed shared primitive supports this use, or
  the bounded shared-primitive work required before integration:
- If a page with little content: why a contextual drawer is insufficient:

## Navigation and editing contract

- URL selection/deep link, refresh and direct-entry behavior:
- Back/Forward, explicit close and safe fallback:
- Preserved list filters/sort/page/selection/scroll:
- Initial focus, Escape, backdrop, background interaction and return focus:
- Unsaved input on dismissal, navigation or record switching:
- Pending requests, duplicate submission and stale-selection handling:
- Destructive scope, confirmation/undo and server capability evidence:

## Information and craft

- Priority order: task/result → useful context → secondary diagnostics.
- Primary, secondary and utility actions; proximity to target:
- Grouping, alignment, spacing/density and intentional whitespace:
- Human labels, status/control distinction and non-color state signals:
- Long labels/filenames/IDs, table overflow and narrow-screen treatment:
- Reused components/public entrypoints; justification for anything new:
- Unsupported capabilities or data; what must not be implied on screen:

## States and verification record

For each applicable state, describe the user impact, displayed feedback, next step
and deterministic story. Mark unsupported or irrelevant states explicitly.

- Pending / empty / no matches / populated / long content:
- Error / permission denied / unavailable or deleted selection:
- Editing / submitting / success / destructive confirmation:
- Desktop / mobile / keyboard / focus / reduced motion:
- Affected native typecheck commands and results:
- Story IDs, browser evidence and unresolved checks:
- Runtime integrations not verified; approvals required for changed scope:

## Decisions and exceptions

Record the date, decision, product reason, alternatives, preserved usability,
approval when required, and invalidated/repeated verification. Do not silently
turn a one-page exception into a project-wide rule.
