# Chart wrappers foundation — relevant files

## Contributor command path

- Root `Makefile` remains the shared entrypoint: `setup`, `check`, `test`, `build`.
- `make check` runs `bun run typecheck` then `bun run lint`.
- `make test` runs `bun test` with happy-dom preloaded from `bunfig.toml`.

## Chart foundation boundary

- Shared chart input types and reviewer-visible summary helpers live in `src/lib/docs-charts.ts`.
- Reviewer-visible chart-example route constants and example-navigation wiring also live in `src/lib/docs-charts.ts`, and `loadDocsShellNavigation()` composes that helper with the existing code-presentation example section.
- Reusable docs chart wrappers live under `src/components/docs/primitives/` and are re-exported from `src/components/docs/primitives/index.ts`.
- `DocsChartFrame` is the canonical wrapper boundary for authored chart data and config; future chart types should consume authored inputs through this component instead of owning their own `ResponsiveContainer`, reduced-motion, or chart summary wiring.
- `DocsLineChart` is the first concrete chart wrapper; it keeps authored `DocsChartConfig` / data inputs intact while projecting them into Recharts line, axis, and grid primitives.
- Shared reduced-motion behavior comes from `src/hooks/media/useReducedMotion.ts`; do not add chart-local `matchMedia` listeners.
- Recharts cartesian chart primitives currently import from `recharts/es6/*` with local declarations in `src/types/recharts-esm.d.ts` because Bun's test runtime does not reliably expose all cartesian named exports through the root `recharts` entrypoint.
- Shared chart styling extends `src/app/globals.css` using the existing landing/docs tokens.
- The reviewer-visible chart proof surface is `src/components/docs/chart-example.tsx`, rendered from `src/app/docs/examples/charts/page.tsx`.

## Verification

- Focused wrapper behavior belongs in `tests/unit/docs-chart-frame.test.tsx`.
- Concrete line-chart behavior belongs in `tests/unit/docs-line-chart.test.tsx`; keep proofs on authored-input projection, reduced-motion behavior, and responsive-overflow wiring rather than SVG snapshots.
- The reviewer-visible chart example surface is covered in `tests/unit/chart-example.test.tsx`, docs navigation assertions in `tests/unit/docs-shell.test.tsx` and `tests/unit/docs-navigation.test.ts`, and export reachability in `tests/unit/static-export.test.ts`.
- Wrapper tests should assert the authored-input boundary directly, prove reduced-motion projection through `useReducedMotion`, and cover explicit empty-state behavior instead of snapshotting library SVG internals.
