# Responsive shared hooks foundation — relevant files

## Shared responsive state boundary

- Canonical breakpoint values live in `src/lib/responsive-tokens.ts` (`RESPONSIVE_BREAKPOINTS_PX`, `classifyShellViewport`). Keep `src/app/globals.css` media queries aligned with these pixel values.
- Shell viewport types live in `src/types/media.ts` (`ShellViewport`, `ResponsiveShellState`).
- Low-level SSR-safe viewport band detection lives in `src/hooks/media/useBreakpoint.ts` (`useSyncExternalStore` + shared tokens; no per-page `window.matchMedia`).
- Canonical shell responsive state boundary: `src/hooks/layout/useResponsiveShellState.ts`.
- Shell UI projection without owning layout markup: `src/components/shell/responsive-shell-root.tsx` (sets `data-shell-viewport` and `data-shell-narrow`).

## Shell integration

- `src/components/docs/docs-shell.tsx` and `src/components/landing/landing-shell.tsx` wrap their roots with `ResponsiveShellRoot` instead of ad hoc viewport logic.
- CSS layout still uses token-aligned media queries in `src/app/globals.css`; interactive shell behavior should consume `useResponsiveShellState` rather than route-local viewport checks.

## Verification

- Pure breakpoint classification: `tests/unit/responsive-tokens.test.ts`
- Hook and shell projection behavior: `tests/unit/responsive-shell-state.test.tsx`
- Existing shell landmark tests remain in `tests/unit/docs-shell.test.tsx` and `tests/unit/homepage-shell.test.tsx`

## Contributor commands

- Root `Makefile`: `make setup`, `make check`, `make test`, `make build` (see `docs/internal/processes/bootstrap-static-export-foundation-relevant-files.md`).
