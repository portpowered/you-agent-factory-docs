# Responsive shared hooks foundation — relevant files

## Shared responsive state boundary

- Canonical breakpoint values live in `src/lib/responsive-tokens.ts` (`RESPONSIVE_BREAKPOINTS_PX`, `classifyShellViewport`). Keep `src/app/globals.css` media queries aligned with these pixel values.
- Shell viewport types live in `src/types/media.ts` (`ShellViewport`, `ResponsiveShellState`).
- Low-level SSR-safe viewport band detection lives in `src/hooks/media/useBreakpoint.ts` (`useSyncExternalStore` + shared tokens; no per-page `window.matchMedia`).
- Canonical shell responsive state boundary: `src/hooks/layout/useResponsiveShellState.ts`.
- Shell UI projection without owning layout markup: `src/components/shell/responsive-shell-root.tsx` (sets `data-shell-viewport`, `data-shell-narrow`, and `data-shell-reduced-motion`).

## Narrow-viewport disclosure

- Reusable disclosure hook: `src/hooks/layout/useShellDisclosure.ts` (projected open/closed UI state; Escape dismiss; focus return to trigger).
- Disclosure types: `src/types/shell-disclosure.ts`.
- Shared trigger/panel wrappers: `src/components/shell/shell-disclosure-trigger.tsx`, `src/components/shell/shell-disclosure-panel.tsx`.
- Docs proof path: `src/components/docs/docs-shell-nav.tsx` composes the shared disclosure behavior for docs navigation on narrow viewports.
- Landing proof path: `src/components/landing/landing-shell-header-nav.tsx` composes the same disclosure primitives for header navigation on narrow viewports.

## Docs navigation extension space

- Stable nav item/section types: `src/types/docs-nav.ts` (`DocsNavItem`, `DocsNavSection`).
- Canonical nav data consumed by the docs shell: `src/lib/docs-nav.ts` (`DOCS_NAV_SECTION`). Later docs navigation depth extends `items` here without rewriting shell layout or disclosure behavior.

## Shell integration

- `src/components/docs/docs-shell.tsx` and `src/components/landing/landing-shell.tsx` wrap their roots with `ResponsiveShellRoot` instead of ad hoc viewport logic.
- CSS layout still uses token-aligned media queries in `src/app/globals.css`; interactive shell behavior should consume `useResponsiveShellState` and `useShellDisclosure` rather than route-local viewport checks.

## Reduced-motion preference

- Shared media query constant: `src/lib/media-preferences.ts` (`PREFERS_REDUCED_MOTION_MEDIA_QUERY`).
- SSR-safe reduced-motion hook: `src/hooks/media/useReducedMotion.ts` (`useSyncExternalStore`; server snapshot defaults to `false`).
- Canonical shell state includes `prefersReducedMotion` via `useResponsiveShellState`; `ResponsiveShellRoot` projects `data-shell-reduced-motion`.
- Shell disclosure reveal animation in `src/app/globals.css` is disabled when `data-shell-reduced-motion` is set or `@media (prefers-reduced-motion: reduce)` matches.

## Superseded shell-level responsive logic

- Per-surface breakpoint mismatch (docs at 768px vs landing at 640px) replaced by shared `RESPONSIVE_BREAKPOINTS_PX` tokens and `useBreakpoint`.
- Route-local or shell-local `window.matchMedia` viewport checks replaced by `useResponsiveShellState` + `ResponsiveShellRoot` data attributes.
- Inline docs nav markup in `DocsShellNav` replaced by `DOCS_NAV_SECTION` extension data; shell disclosure behavior unchanged.
- Always-visible landing header nav on narrow viewports replaced by `LandingShellHeaderNav` using shared disclosure primitives.

## Verification

- Pure breakpoint classification: `tests/unit/responsive-tokens.test.ts`
- Hook and shell projection behavior: `tests/unit/responsive-shell-state.test.tsx`
- Narrow-viewport disclosure behavior (docs and landing): `tests/unit/shell-disclosure.test.tsx`
- Reduced-motion preference hook and shell projection: `tests/unit/use-reduced-motion.test.tsx`
- Docs nav extension rendering: `tests/unit/homepage-shell.test.tsx` (`docs nav extension surface` describe block)
- Shared matchMedia stub for viewport and reduced-motion tests: `tests/helpers/mock-match-media.ts`
- Existing shell landmark tests remain in `tests/unit/docs-shell.test.tsx` and `tests/unit/homepage-shell.test.tsx`

## Contributor commands

- Root `Makefile`: `make setup`, `make check`, `make test`, `make build` (see `docs/internal/processes/bootstrap-static-export-foundation-relevant-files.md`).
