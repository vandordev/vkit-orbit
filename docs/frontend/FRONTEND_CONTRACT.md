# Frontend UX contract

Applies to new and substantially changed surfaces in this boilerplate. Existing
screens are not retroactively certified. Read [design direction](DESIGN.md) first;
the detailed source for component ownership remains
[`.agent/components.md`](../../.agent/components.md).

## Safety and truthfulness

- Never expose credentials, tokens, private URLs or sensitive data in ordinary UI,
  fixtures, screenshots or browser diagnostics.
- Enforce authorization server-side; hiding a control is not authorization. Give
  permission-denied users a truthful next step, not an unusable submit action.
- Destructive or consequential actions need proportionate confirmation, undo or
  another explicit safety mechanism. Identify the affected object and scope.
  Undo is offered only when the backend actually supports it.
- Do not fabricate data, progress, persistence, health, retry, cancellation or
  recovery capabilities. Check schema and runtime feasibility before design.
- Every core asynchronous surface handles pending, failure and applicable empty
  states; preserve the primary task on small screens and with long content.

## Choose the smallest sufficient interaction

Prefer the container that supports the user's task while preserving useful context.
Content length is evidence, not the only criterion. Record meaningful tradeoffs in
the [page brief](PAGE_BRIEF.md).

| Pattern        | Prefer when                                                                                        | Choose something else when                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Inline         | A small related value, expandable explanation or reversible local edit fits its context            | It crowds the list, hides validation or becomes a multi-step task                          |
| Popover/menu   | A short contextual choice or lightweight tool belongs near a trigger                               | It contains a long form, detailed reading or critical work                                 |
| Detail drawer  | Compact inspection or bounded editing benefits from keeping the originating list/context           | Nested navigation, comparison, long reading or complex editing needs a dedicated workspace |
| Dialog         | A focused decision, confirmation or short blocking task must be resolved before continuing         | It is a browsing/detail surface or an oversized configuration form                         |
| Dedicated page | A substantial task, long content, several meaningful sections or independent navigation needs room | A few facts and one small action would leave an otherwise empty page                       |
| Split view     | Frequent inspect/compare work benefits from simultaneously usable list and detail                  | Width makes both panes cramped or the user only occasionally inspects an item              |

**Default:** opening a compact detail from a collection uses a drawer when it
comfortably supports realistic content, actions and mobile use. Do not create a
full page merely because the action is called Details. Do not force a drawer
merely because a record has few fields. Short content may still need a page for
independent navigation, comparison or a consumer-specific workflow.

Deep linking does not by itself require a fullscreen page: a routed drawer may
support it. Conversely, URL-addressability alone does not make a drawer appropriate.
For expanding tasks, provide a meaningful full-page continuation when supported,
not a redundant Open full page action on every drawer.

## Drawer and dialog behavior

- Use shared accessible primitives, with an accessible title, an explicit close
  control and purposeful initial focus. Modal overlays contain focus and make
  background content inert; intentionally non-modal panels must not trap focus.
- Escape dismisses when safe. Backdrop dismissal is optional and must never
  silently discard edits. Restore focus to the trigger or a sensible surviving
  target; define the fallback when deletion removes the originating row.
- Prefer one active task overlay. Switch its selected record rather than stacking
  drawers. A necessary safety confirmation must have correct focus/escape ordering;
  avoid serial overlays and nested editing flows.
- Separate header, scrollable content and task actions. Actions remain reachable
  with narrow screens, browser zoom, touch keyboards and long validation messages.
  Prevent background scrolling for modal overlays, not all non-modal panels.
- Protect unsaved edits across close, record switching and navigation: offer a
  supported save/discard/continue choice or retain the draft deliberately. Do not
  promise preservation across reloads unless implemented.
- Opening another record while a request is pending must not display a stale
  previous record or apply its response/actions to the new selection.
- The currently installed `@repo/components/drawer` is a scoped left-navigation
  drawer (see the [package contract](../../packages/components/README.md)), not a
  general detail/edit API. Assess and extend/install the shared primitive before
  adopting this pattern; do not duplicate an overlay locally in an application.

## Navigation and list context

- Preserve applicable filters, sorting, page/cursor, selection and scroll when
  opening, closing or returning from detail. Do not silently reset to page one.
- Decide whether selection belongs in the URL. Use URL state for details users
  need to share, reload or revisit; local state may suit transient utility panels.
- Specify browser Back/Forward, refresh/direct entry, close and fallback behavior.
  Closing a routed drawer must not blindly call Back and send a direct visitor
  outside the app. Opening/closing must not add duplicate history entries.
- Keep real navigation as links, including open-in-new-tab behavior where relevant;
  use buttons for actions. Do not make a row's controls conflict with row navigation.
- If a selected item disappears or access changes, provide a truthful unavailable
  state and a safe return, rather than broken detail or inaccessible stale data.

## Lists, forms and feedback

- Lists support scanning, filtering and selection. Keep complex configuration out
  of cells; tiny reversible inline edits are acceptable when validation and error
  recovery remain clear. Bulk actions show their actual selection scope.
- Distinguish no records from no search matches. Offer a supported create/upload
  action for the former, clearing/changing filters for the latter. Never add fake
  actions merely to fill an empty state.
- Use persistent accessible field labels. Explain requirements before submission,
  place errors near fields and associate them accessibly. Focus the first relevant
  error or summary without unexpectedly moving focus during ordinary typing.
- Group by user task, not schema order. Disclose optional/advanced settings
  progressively; use steps for genuine dependencies, not arbitrary field counts.
- During submission, show progress and prevent accidental duplicate submissions
  without hiding the user's input. Backend idempotency remains a separate contract.
- On failure preserve recoverable input, explain impact and offer a real next step.
  Do not replace useful server errors with raw stack traces or invented certainty.
- On success show what changed. Close an editor when its task is done, or keep it
  open when continued editing is intentional. Update the visible authoritative state;
  never show success before a save is accepted. Avoid duplicate toast and inline
  messages; critical errors must not exist only in a transient toast.

## Copy, craft and accessibility

- Put a human-readable result and next action before technical detail. Distinguish
  object lifecycle, processing state and permission state rather than combining
  unrelated statuses into one ambiguous badge. Translate codes in primary UI.
- Use existing semantic tokens and shared controls. Keep a consistent spacing,
  sizing and action hierarchy; do not make every action primary or every group a card.
- Read-only status must not look editable. Use more than color for status/selection.
  Keep actions close to their target and utility actions visually subordinate.
- Support keyboard operation, visible focus, semantic headings, accessible names
  and reduced motion. Do not place essential explanations only in hover tooltips.
- Wrap, truncate with accessible full-value access, or isolate long content in its
  own scrolling region. Do not cause document-wide horizontal overflow. Preserve
  meaningful table semantics or a purpose-built mobile alternative.
- Put the mobile primary task first. Respect safe areas and the on-screen keyboard;
  a fixed footer must not cover content, errors or the focused field.

## Adoption, exceptions and verification

Use [PAGE_BRIEF.md](PAGE_BRIEF.md) for a new/substantially reworked surface and
[FRONTEND_REVIEW.md](FRONTEND_REVIEW.md) to record evidence. Small changes use the
tiny-change gate there rather than generating paperwork for every edit.

Pattern and visual defaults can vary with a written task/product reason and an
explanation of retained usability. Record the choice, alternatives, risks and
verification in the brief. Exceptions to safety, authorization, architecture,
scope or verification authority require explicit approval; a brief is not approval.

Follow [`.agent/verification.md`](../../.agent/verification.md): UI uses affected
typechecks and browser Storybook inspection; system changes use typecheck only.
Start/restart Storybook only with the required permission. These documents do not
authorize builds, lint/full gates, backend/system tests, databases or services.
For documentation-only adoption, review links, consistency and formatting; do not
start Storybook or claim visual/runtime acceptance.
