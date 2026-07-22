# Optional Admin Workspace UI Design

## Goal

Offer an opt-in operations-dashboard template that preserves Broadcaster's UI
lessons without imposing a product identity, routes, or heavy dependencies on
the boilerplate baseline.

## Scope

- A configurable authenticated app shell with responsive/collapsible sidebar,
  user menu, command palette, and keyboard-accessible navigation.
- A neutral design-token layer and a curated set of shadcn primitives.
- Auth integration hooks that are optional and degrade to consumer-provided
  current-user and logout callbacks.
- Guidance for static design examples and a separate, optional data-table
  package.
- A strict-context utility where a template component needs a required context.

## Out of scope

- Broadcaster brand, navigation names, campaign/customer data, or mock data.
- Installing Niko Table or Animate UI code in every generated project.
- Changing the baseline home page or adding authenticated routes by default.

## Design

The template is copied or installed deliberately by a consuming project. It
uses neutral navigation descriptors and callbacks so product routes, icons,
permissions, and identity are supplied by that project. It composes existing
TanStack Router and React Query patterns without creating a second browser API
transport.

The data-table experience is a documented optional add-on. Its large vendored
implementation is not copied into the starter; a consumer may choose it only
when advanced filtering, virtualisation, column management, or spreadsheet
interaction justify its maintenance cost.

## Acceptance criteria

- Baseline install gains no UI dependency, route, or build cost.
- Template tests cover collapsed navigation labels/tooltips, keyboard command
  palette invocation, current-user loading state, and logout callback.
- Navigation is driven by neutral descriptors and can be filtered by a
  consumer-supplied authorization predicate.
- The template satisfies existing Tailwind/shadcn accessibility conventions.
- The data-table guide documents its dependency and maintenance trade-off.
