# Chart wrappers foundation — relevant files

## Contributor command path

- Root `Makefile` remains the shared entrypoint: `setup`, `check`, `test`, `build`.
- `make check` runs `bun run typecheck` then `bun run lint`.
- `make test` runs `bun test` with happy-dom preloaded from `bunfig.toml`.

## Chart foundation boundary

- Shared chart input types and reviewer-visible summary helpers live in `src/lib/docs-charts.ts`.
- Reusable docs chart wrappers live under `src/components/docs/primitives/` and are re-exported from `src/components/docs/primitives/index.ts`.
- `DocsChartFrame` is the canonical wrapper boundary for authored chart data and config; future chart types should consume authored inputs through this component instead of owning their own `ResponsiveContainer`, reduced-motion, or chart summary wiring.
- Shared reduced-motion behavior comes from `src/hooks/media/useReducedMotion.ts`; do not add chart-local `matchMedia` listeners.
- Shared chart styling extends `src/app/globals.css` using the existing landing/docs tokens.

## Verification

- Focused wrapper behavior belongs in `tests/unit/docs-chart-frame.test.tsx`.
- Wrapper tests should assert the authored-input boundary directly, prove reduced-motion projection through `useReducedMotion`, and cover explicit empty-state behavior instead of snapshotting library SVG internals.
