# Admin Workspace UI Recipe

This is an opt-in neutral shell template. It adds no baseline route, product
label, API client, auth dependency, or build cost until a consumer copies and
registers it.

## Installation

The consumer must already have React, TanStack Router/Query, Tailwind, and the
selected shadcn primitives. Copy the files under `files/apps/web/src` into the
consumer's web app, supply navigation descriptors, and connect the
consumer-owned current-user and logout callbacks. Remove those copied files
and any route registration to uninstall.

`AdminNavigationItem` contains a neutral `label`, `to`, optional `icon`, and
optional `visible` predicate. `AdminShellProps` requires `navigation`,
`currentUser`, `onLogout`, and `children`; authorization remains consumer-owned.

## Dependency tiers

| Tier | Contents | Cost |
| --- | --- | --- |
| Core | shell, command menu, user menu, strict context, descriptors | existing React/Tailwind/shadcn |
| Optional | Animate UI sidebar enhancement | additional animation dependency and maintenance |
| Advanced | Niko Table data-grid package | large vendored surface, filtering/virtualisation/columns trade-offs |

Animate UI and Niko Table are deliberately not copied into the baseline or
this core template. Install Niko Table only when spreadsheet-like interaction,
virtualisation, and column management justify its ongoing maintenance cost.
