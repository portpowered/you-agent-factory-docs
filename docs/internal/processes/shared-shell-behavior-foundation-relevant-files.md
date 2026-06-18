# Shared shell behavior foundation — relevant files

## Shared shell contract

- Canonical shell configuration lives in `src/lib/shared-shell-config.ts` as `sharedShellConfig`. Later lanes extend labels, destinations, docs navigation groups, and structural options there instead of duplicating route-local shell data.
- Extension-point guidance and `createSharedShellConfig` live in `src/lib/shared-shell-extension-points.ts`. Use `SHARED_SHELL_CANONICAL_EXTENSION_POINTS` for config-driven labels and navigation, and `SHARED_SHELL_PROJECTED_EXTENSION_POINTS` for page content, docs current-item projection, and disclosure state.
- Transient UI such as disclosure open state stays in component state inside `src/components/shell/shared-shell-header.tsx`; it is not part of `sharedShellConfig`.
- `src/components/shell/shared-shell.tsx` is the single global frame for homepage and docs entry routes. It renders shared header, optional docs sidebar (`docsNavigationGroups`), main content slot, and footer framing.
- Reusable accessible navigation primitives live in `src/components/shell/shared-shell-navigation.tsx` (`SharedShellPrimaryNavigation`, `SharedShellNavigationLink`, `SharedShellDocsNavigation`). Both surfaces consume the same destination contract from `sharedShellConfig`; external GitHub links expose `(opens in new tab)` in the accessible name.
- Shared shell interactive primitives should flow through `src/components/ui/button.tsx` rather than restating focus, spacing, and variant classes inline. Keep shell-specific hooks such as `shared-shell__link` or `shared-shell__menu-toggle` as additive selectors only.
- When a shell disclosure control renders through `Button`, declare its breakpoint display contract through the primitive call site (for example `displayClassName="hidden max-[1023px]:inline-flex"`) instead of relying on legacy `shared-shell__*` selectors to override the primitive's default display utility.
- Responsive shell behavior uses CSS media queries in `src/app/globals.css` aligned with `src/lib/responsive-tokens.ts` (639px / 1023px). Narrow-width disclosure state is projected through `useShellDisclosure` and rendered by the client `SharedShellHeader` / `SharedShellDocsAside`.
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

- Shared shell layout and navigation markup keeps the `shared-shell__*` class hooks, but the presentation contract now lives primarily in Tailwind utility classes backed by semantic tokens from `src/app/globals.css`.
- Structural wrappers that need reusable shell-or-homepage card treatment should use `src/components/ui/card.tsx` and override only the narrow delta, such as muted nested cards or shadow removal.
- `src/app/globals.css` is now the narrow baseline for shared token projection, base rules, and stateful responsive selectors such as disclosure visibility and animation. Avoid moving shared shell presentation back into large bespoke selector clusters there.
- Surface wrappers may keep `landing-shell__*` or `docs-shell__*` hooks for tests and targeted overrides, but shared shell chrome should prefer utility classes on the component markup.

## Deferred legacy styling boundary

- The shared shell, homepage CTA groups, docs overview framing, and doc-page outline card now demonstrate the reviewed Tailwind and primitive path in built output through `ui-button` and `ui-card` classes.
- Remaining docs presentation selectors in `src/app/globals.css` are intentionally limited to surfaces that still need global or structure-aware treatment: `.docs-page__body` for MDX prose flow, `.docs-breadcrumbs__*` and `.docs-progression__*` for generated navigation wrappers, and `.docs-diagram__*` for Mermaid and React Flow containers.
- Future styling lanes should migrate those deferred selectors only by moving the owning surface onto reusable primitives or semantic utilities; do not re-expand `globals.css` back into the primary contract for shared shell or homepage presentation.
