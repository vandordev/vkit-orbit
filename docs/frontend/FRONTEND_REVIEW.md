# Frontend review template

Copy per review or record the findings in the task handoff. Read
[DESIGN.md](DESIGN.md) and [FRONTEND_CONTRACT.md](FRONTEND_CONTRACT.md).
This blank template is not a passed audit of existing screens.

## Tiny-change gate

For a small UI-sensitive edit, record just the surface, task/state affected,
user-visible impact, risk to avoid, and applicable verification. Use the full
review below for broader page, pattern or component-system changes.

## Review context

- Surface, user, primary task and entry/return journey:
- Commit/source, brief, stories/screenshots and date:
- Verdict: pass / pass with notes / needs polish / needs refactor / blocked.
- Main strength, main risk and smallest useful next step:

## Product and journey

- [ ] First decision, primary action and success criterion are clear.
- [ ] Displayed objects/data match schema and available runtime contracts.
- [ ] Container fits the task; short detail does not become an empty page and
      substantial work is not squeezed into a drawer.
- [ ] Browse, inspect, edit and submit responsibilities are understandable.
- [ ] Empty, no-match, error and permission states offer supported recovery.
- [ ] Placeholder/schema/story support is not presented as a live capability.

## Overlay and navigation, when applicable

- [ ] List filters, pagination, selection and scroll survive the round trip.
- [ ] Deep links, reload/direct entry, Back/Forward and explicit close agree.
- [ ] Initial focus, keyboard operation, Escape and focus restoration are correct.
- [ ] Modal/non-modal background interaction and scroll behavior are intentional.
- [ ] Unsaved edits and switching records cannot silently lose or misapply work.
- [ ] No unnecessary overlay stacks; selected-record requests cannot render stale detail.
- [ ] Mobile/zoom/keyboard layouts keep content, close and task actions reachable.

## Copy, craft and safety

- [ ] Human result/next action precede codes, IDs and diagnostics.
- [ ] Language is consistent; README/agent reasoning is not primary interface copy.
- [ ] Groups align; spacing/density and whitespace have a purpose.
- [ ] Primary/secondary/utility actions are distinct and close to their targets.
- [ ] Read-only status, navigation and editable controls look meaningfully different.
- [ ] Selected/status states do not rely on color alone.
- [ ] Long content and tags do not break the page or conceal essential information.
- [ ] Labels, validation and focus feedback are accessible; errors preserve input.
- [ ] Submission feedback prevents accidental duplicates and reports accepted results.
- [ ] Destructive actions have truthful scope and supported protection/recovery.
- [ ] Secrets and sensitive information are absent from UI, fixtures and evidence.
- [ ] Shared primitives and brand tokens are reused; new abstractions are justified.

## Verification and findings

Mark each item passed, failed, blocked or not applicable with a reason. No implied
pass from an unchecked item, a typecheck, or a static Storybook build.

- Affected owner/consumer typechecks: commands and fresh results.
- Browser Storybook: story IDs, desktop/mobile, applicable state screenshots.
- Keyboard/focus, overlay open/close, form feedback and reduced-motion checks.
- Explicitly unverified runtime boundaries and unresolved checks.
- Findings: severity, source/screenshot evidence, user impact and proposed fix.
- Follow-up decisions needing approval; reusable lessons worth codifying.

Follow [repository verification policy](../../.agent/verification.md), not a
generic skill's broader test/build recommendations. Documentation-only work needs
link/format/consistency review, not a preview server. A UI review does not authorize
backend services, system tests, scope changes, commits to another branch or a merge.
