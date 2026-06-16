# Responsive shared hooks foundation — relevant files

## Shared responsive state boundary

- Canonical breakpoint values live in `src/lib/responsive-tokens.ts` (`RESPONSIVE_BREAKPOINTS_PX`, `classifyShellViewport`). Keep `src/app/globals.css` media queries aligned with these pixel values.
- Shell viewport types live in `src/types/media.ts` (`ShellViewport`, `ResponsiveShellState`).
- Low-level SSR-safe viewport band detection lives in `src/hooks/media/useBreakpoint.ts` (`useSyncExternalStore` + shared tokens; no per-page `window.matchMedia`).
- Canonical shell responsive state boundary: `src/hooks/layout/useResponsiveShellState.ts`.
- Shell UI projection without owning layout markup: `src/components/shell/responsive-shell-root.tsx` (sets `data-shell-viewport`, `data-shell-narrow`, and `data-shell-reduced-motion`).

## Shell integration

- `SharedShell` in `src/components/shell/shared-shell.tsx` wraps the shared shell frame with `ResponsiveShellRoot`.
- Narrow-viewport header disclosure: `SharedShellHeader` uses `useShellDisclosure` with `ShellDisclosureTrigger` / `ShellDisclosurePanel`.
- Narrow-viewport docs sidebar disclosure: `SharedShellDocsAside` uses the same shared disclosure primitives.
- `src/components/docs/docs-shell.tsx` and `src/components/landing/landing-shell.tsx` compose `SharedShell` with localized config instead of ad hoc viewport logic.
- CSS layout uses token-aligned media queries in `src/app/globals.css`; interactive shell behavior consumes `useResponsiveShellState` and `data-shell-*` attributes rather than route-local viewport checks.

## Verification

- Pure breakpoint classification: `tests/unit/responsive-tokens.test.ts`
- Hook and shell projection behavior: `tests/unit/responsive-shell-state.test.tsx`
- Disclosure keyboard behavior: `tests/unit/shell-disclosure.test.tsx`
- Shared shell responsive contract: `tests/unit/shared-shell-responsive.test.tsx`
- Existing shell landmark tests remain in `tests/unit/docs-shell.test.tsx` and `tests/unit/homepage-shell.test.tsx`
- Shell tests that assert always-visible navigation should mock desktop width (`RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1`); `tests/setup/testing-library.ts` calls `resetMatchMedia()` after each test so narrow-viewport mocks do not leak across files.

## Contributor commands

- Root `Makefile`: `make setup`, `make check`, `make test`, `make build` (see `docs/internal/processes/bootstrap-static-export-foundation-relevant-files.md`).

## Superseded shell logic

- Per-surface `docs-shell` / `landing-shell` nav markup replaced by shared `SharedShell` frame plus localized `sharedShellConfig`.
- `useSharedShellNavigationDisclosure` replaced by keyboard-safe `useShellDisclosure` in the shared responsive layer.
- Breakpoint-specific CSS at 768px replaced by token-aligned 639px / 1023px rules gated by `data-shell-narrow`.
