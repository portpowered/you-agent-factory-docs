# Shared shell behavior foundation — relevant files

## Shared shell contract

- Canonical shell configuration lives in `src/lib/shared-shell-config.ts` as `sharedShellConfig`. Later lanes extend labels, destinations, docs navigation groups, and structural options there instead of duplicating route-local shell data.
- Transient UI such as disclosure open state stays in component state inside `src/components/shell/shared-shell.tsx`; it is not part of `sharedShellConfig`.
- `src/components/shell/shared-shell.tsx` is the single global frame for homepage and docs entry routes. It renders shared header, optional docs sidebar, main content slot, and footer framing.
- Reusable accessible navigation primitives live in `src/components/shell/shared-shell-navigation.tsx` (`SharedShellPrimaryNavigation`, `SharedShellNavigationLink`, `SharedShellDocsNavigation`). Both surfaces consume the same destination contract from `sharedShellConfig`; external GitHub links expose `(opens in new tab)` in the accessible name.
- `src/components/landing/landing-shell.tsx` and `src/components/docs/docs-shell.tsx` are thin surface wrappers that project page content into `SharedShell` instead of owning independent header or layout wiring.
- `src/lib/shell.ts` re-exports legacy copy constants and `sharedShellConfig` for existing imports; prefer `@/lib/shared-shell-config` for new shell work.

## Verification

- `tests/unit/shared-shell.test.tsx` proves the shared frame contract, config separation, and surface-specific header destinations.
- `tests/unit/shared-shell-navigation.test.tsx` proves reusable navigation primitives, keyboard reachability, accessible external-link names, and the shared destination contract across surfaces.
- Homepage and docs shell tests remain focused on surface content and navigation expectations after adopting the shared frame.

## Styling

- Shared shell layout and navigation classes use the `shared-shell__*` prefix in `src/app/globals.css`.
- Surface-specific content styling remains under `landing-shell__*` and `docs-shell__*` prefixes.
