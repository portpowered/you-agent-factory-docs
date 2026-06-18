# Shared shell behavior foundation — relevant files

## Shared shell contract

- Canonical shell configuration lives in `src/lib/shared-shell-config.ts` as `sharedShellConfig`. Later lanes extend labels, destinations, docs navigation groups, and structural options there instead of duplicating route-local shell data.
- Extension-point guidance and `createSharedShellConfig` live in `src/lib/shared-shell-extension-points.ts`. Use `SHARED_SHELL_CANONICAL_EXTENSION_POINTS` for config-driven labels and navigation, and `SHARED_SHELL_PROJECTED_EXTENSION_POINTS` for page content, docs current-item projection, and disclosure state.
- Transient UI such as disclosure open state stays in component state inside `src/components/shell/shared-shell-header.tsx`; it is not part of `sharedShellConfig`.
- `src/components/shell/shared-shell.tsx` is the single global frame for homepage and docs entry routes. It renders shared header, optional docs sidebar (`docsNavigationGroups`), main content slot, and footer framing.
- Reusable accessible navigation primitives live in `src/components/shell/shared-shell-navigation.tsx` (`SharedShellPrimaryNavigation`, `SharedShellNavigationLink`, `SharedShellDocsNavigation`). Both surfaces consume the same destination contract from `sharedShellConfig`; external GitHub links expose `(opens in new tab)` in the accessible name.
- Shared shell interactive primitives should flow through `src/components/ui/button.tsx` rather than restating focus, spacing, and variant classes inline.
- When a shell disclosure control renders through `Button`, declare its breakpoint display contract through the primitive call site (for example `displayClassName="hidden max-[1023px]:inline-flex"`) instead of relying on legacy `shared-shell__*` selectors to override the primitive's default display utility.
- Responsive shell behavior keeps viewport state in `ResponsiveShellRoot` and `useShellDisclosure`, but the layout and breakpoint presentation should live on the owning component markup through Tailwind responsive utilities and `data-[shell-disclosure=...]` animation hooks instead of global selector blocks.
- `src/components/landing/landing-shell.tsx` remains the shared-shell surface wrapper for the homepage, while the docs route has moved to the Fumadocs-owned path in `src/components/docs/fumadocs-docs-layout.tsx` with `src/components/docs/docs-route-chrome.tsx` handling the narrowed docs-specific chrome.
- `src/lib/shell.ts` remains a deprecated re-export for legacy imports; prefer `@/lib/shared-shell-config` and `@/lib/shared-shell-extension-points` for new shell work.

## Extension points for later lanes

- **Localization:** override label fields on `sharedShellConfig` or merge lane-specific values with `createSharedShellConfig({ brand, primaryNavigation, docsNavigationGroups, responsive })`.
- **Docs navigation IA:** append groups to `docsNavigationGroups`; each group renders through `SharedShellDocsNavigation` without changing the shell frame.
- **Richer page composition:** keep route-specific sections in surface wrappers via the `SharedShell` `children` slot and `currentDocsItemId` prop.
- **Do not extend:** menu open/closed state belongs in `useSharedShellNavigationDisclosure`, not canonical config.

## Verification

- `tests/unit/shared-shell.test.tsx` proves the shared frame contract, config separation, and surface-specific header destinations.
- `tests/unit/shared-shell-navigation.test.tsx` proves reusable navigation primitives, keyboard reachability, accessible external-link names, and the shared destination contract across surfaces.
- `tests/unit/shared-shell-responsive.test.tsx` proves SSR-safe initial disclosure state, menu toggle wiring, and shared responsive header behavior across surfaces.
- `tests/unit/reconciled-export-browser.test.ts` is the reviewer-facing proof for computed desktop-hidden/mobile-visible disclosure behavior on the built export; use it when a shell styling change could regress real breakpoint visibility.
- `tests/unit/shared-shell-extension-points.test.tsx` proves canonical config extension, multiple docs navigation groups, and projected-state separation.
- Homepage and docs shell tests remain focused on surface content and navigation expectations after adopting the shared frame.

## Styling

- The `shared-shell` root class remains a non-styling test and state hook for responsive-shell assertions, while layout and navigation presentation now live on Tailwind-owned component markup backed by semantic tokens from `src/app/globals.css`.
- Structural wrappers that need reusable shell-or-homepage card treatment should use `src/components/ui/card.tsx` and override only the narrow delta, such as muted nested cards or shadow removal.
- `src/app/globals.css` is now the narrow baseline for shared token projection, base rules, and the `shell-disclosure-reveal` keyframe. Avoid moving shared shell presentation back into bespoke selector clusters there.
- Prefer observable roles, labels, and shared primitive classes in tests before reintroducing feature-specific shell or landing selector hooks.

## Deferred legacy styling boundary

- The shared shell, homepage CTA groups, docs overview framing, doc-page outline card, breadcrumbs, progression, search, and diagram wrappers now demonstrate the reviewed Tailwind and primitive path in built output through component-owned utility classes plus `ui-button` and `ui-card`.
- Future styling lanes should keep generated or third-party-backed docs surfaces on reusable primitives, semantic utilities, or explicit component-level class constants rather than re-expanding `globals.css` into the primary presentation contract.
