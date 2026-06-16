# Shared shell behavior foundation — relevant files

## Shared shell contract

- Canonical shell configuration lives in `src/lib/shared-shell-config.ts` as `sharedShellConfig`. Later lanes extend labels, destinations, docs navigation groups, and structural options there instead of duplicating route-local shell data.
- Extension-point guidance and `createSharedShellConfig` live in `src/lib/shared-shell-extension-points.ts`. Use `SHARED_SHELL_CANONICAL_EXTENSION_POINTS` for config-driven labels and navigation, and `SHARED_SHELL_PROJECTED_EXTENSION_POINTS` for page content, docs current-item projection, and disclosure state.
- Transient UI such as disclosure open state stays in component state inside `src/components/shell/shared-shell-header.tsx`; it is not part of `sharedShellConfig`.
- `src/components/shell/shared-shell.tsx` is the single global frame for homepage and docs entry routes. It renders shared header, optional docs sidebar (`docsNavigationGroups`), main content slot, and footer framing.
- Reusable accessible navigation primitives live in `src/components/shell/shared-shell-navigation.tsx` (`SharedShellPrimaryNavigation`, `SharedShellNavigationLink`, `SharedShellDocsNavigation`). Both surfaces consume the same destination contract from `sharedShellConfig`; external GitHub links expose `(opens in new tab)` in the accessible name.
- Responsive shell behavior uses CSS media queries in `src/app/globals.css` with the `sharedShellConfig.responsive.narrowMaxWidthPx` breakpoint (768px). Narrow-width primary navigation disclosure state is projected through `useSharedShellNavigationDisclosure` in `src/hooks/use-shared-shell-navigation-disclosure.ts` and rendered by the client `SharedShellHeader` in `src/components/shell/shared-shell-header.tsx`.
- `src/components/landing/landing-shell.tsx` and `src/components/docs/docs-shell.tsx` are thin surface wrappers that project page content into `SharedShell` instead of owning independent header or layout wiring.
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
- `tests/unit/shared-shell-extension-points.test.tsx` proves canonical config extension, multiple docs navigation groups, and projected-state separation.
- Homepage and docs shell tests remain focused on surface content and navigation expectations after adopting the shared frame.

## Styling

- Shared shell layout and navigation classes use the `shared-shell__*` prefix in `src/app/globals.css`.
- Surface-specific content styling remains under `landing-shell__*` and `docs-shell__*` prefixes.
