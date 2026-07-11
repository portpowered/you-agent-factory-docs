# Factory Components Host Integration Relevant Files

Use these files when installing or consuming `@you-agent-factory/components` from
the docs host (rewrite-era factory-ui wrappers, styles, transpile).

## Package facts

| Fact | Value |
| --- | --- |
| Package | `@you-agent-factory/components@0.0.0` |
| Export style | TypeScript source via `exports` (`types`/`default` → `.ts` / `.tsx`) |
| Styles entry | `@you-agent-factory/components/styles.css` |
| Category entrypoints needed by the host | `/graphs`, `/charts`, `/data-display` |

The package does **not** ship a compiled `dist/`. The host must transpile the
package (Next `transpilePackages`) and import styles once from the global CSS
entry. Do not vendor or fork package source into this repo.

## Key host files

| Path | Role |
| --- | --- |
| `package.json` | Runtime dependency on `@you-agent-factory/components@0.0.0` |
| `next.config.ts` | `transpilePackages: ["@you-agent-factory/components"]` so Next compiles TS source exports |
| `src/lib/factory-components/host-package-surface.ts` | Minimal host import proving root + category resolution/typecheck |
| `src/app/globals.css` | Single `@import "@you-agent-factory/components/styles.css"` after Tailwind (package README order); host `:root` shadcn tokens map to `--color-af-foundation-*` (factory-dark), not legacy teal/coral oklch |
| `src/lib/theme/host-semantic-theme-tokens.ts` | Contract for host semantic → foundation bindings + resolved factory-dark hex; keep aligned with `globals.css` `:root` |
| `src/app/root-layout.shared.tsx` | Root `<html className="dark" data-color-palette="factory-dark">` so package palette presets stay explicit |
| `src/lib/factory-components/host-package-styles.ts` | Resolves the published `styles.css` export map entry for smoke verification |
| `src/features/factory-ui/graphs.ts` | Thin re-export of `@you-agent-factory/components/graphs` (viewport/node/edge helpers); no domain logic or styles import |
| `src/features/factory-ui/charts.ts` | Thin re-export of `@you-agent-factory/components/charts` (ChartContainer, ChartStatePanel, tooltip/legend helpers); no domain series models or styles import |
| `src/features/factory-ui/data-display.ts` | Thin re-export of DataTable + CodePanel from `@you-agent-factory/components/data-display`; columns/rows/code stay caller-owned; no styles import |
| `src/lib/docs/component-manifest.ts` | Reusable coverage boundary: factory-ui wrappers in `REUSABLE_THIN_WRAPPERS`; Atlas `AttentionVariantComparisonGraph` / `RegistryGraphFlow` are not in `REUSABLE_COVERAGE_COMPONENTS` |
| `src/lib/docs/component-coverage-gate.ts` | Allows `src/features/factory-ui/` via `FACTORY_UI_MANIFEST_PREFIX` alongside components/search/tags paths |

## Styles import contract

- Import `@you-agent-factory/components/styles.css` **exactly once** in
  `src/app/globals.css` (the stylesheet every app/static-export layout already
  pulls in). Place it immediately after `@import "tailwindcss"` so package
  `@theme` tokens layer correctly with Tailwind v4.
- Do **not** re-import package styles from `src/features/factory-ui/*` wrappers.
- Prove the styles export resolves with `resolveFactoryComponentsStylesPath()`;
  do not add tests that only count `@import` lines in `globals.css`.

## Host semantic theme remap (factory-dark)

- Package `color-palette-presets.css` defines `--color-af-foundation-*` for
  `factory-dark` (near-black `#050b10`, warm ink `#f7f2e8`, yellow accent
  `#f5c76f` / strong `#ecbf58`, cool secondary `#507f8c`).
- Host shadcn variables (`--background`, `--primary`, `--secondary`, …) in
  `globals.css` must `var()` those foundation keys. Do not paste a second
  teal/coral oklch palette into `:root`.
- Keep `src/lib/theme/host-semantic-theme-tokens.ts` as the binding contract;
  prove resolved primary/secondary/background with
  `host-semantic-theme-tokens.test.ts` (behavioral color checks, not a CSS
  source inventory).
- Contrast lock: `HOST_SEMANTIC_CONTRAST_PAIRINGS` +
  `src/lib/theme/color-contrast.ts` assert readable WCAG ratios for
  primary/secondary/foreground pairings on the dark product theme
  (`color-contrast.test.ts`). Secondary button fill is ~4.48:1 — lane floor
  is 4.4 for that pairing; body/primary stay at 4.5+.
- Set `data-color-palette="factory-dark"` on the root document element.

## Thin factory-ui graph wrappers

- Host path: `src/features/factory-ui/graphs.ts` — re-export only from
  `@you-agent-factory/components/graphs`.
- Smoke-test with fixture props via `@testing-library/react`.
  `GraphViewportSurface` mounts without React Flow; `GraphNodeShell` /
  handle badges need a `ReactFlowProvider` ancestor (same pattern as
  `RegistryGraphFlow` tests).
- Do not put registry IDs, Atlas copy, or data fetching in the wrapper module.

## Thin factory-ui chart wrappers

- Host path: `src/features/factory-ui/charts.ts` — re-export only from
  `@you-agent-factory/components/charts`.
- Host apps already depend on `recharts` for Recharts children
  (`LineChart`, `Line`, axes). Keep series config/data caller-owned.
- Smoke-test `ChartContainer` with fixture `ChartConfig` + Recharts children
  (`role="img"` + `data-chart-container`). Also exercise `ChartStatePanel`
  empty (`role="status"`) and error (`role="alert"`) states.
- Do not import package styles from the wrapper module.

## Thin factory-ui DataTable and CodePanel wrappers

- Host path: `src/features/factory-ui/data-display.ts` — re-export
  `DataTable`, `CodePanel`, and related types/helpers from
  `@you-agent-factory/components/data-display`.
- Keep column definitions, row data, and code content caller-owned; the
  wrapper adds no domain matrix models or Atlas assumptions.
- Smoke-test `DataTable` success with fixture columns/rows
  (`role="table"` + cell text), plus at least one non-success state:
  empty → `role="status"`, error → `role="alert"`.
- Smoke-test `CodePanel` with fixture code text on a `<pre>` surface.
- Do not import package styles from the wrapper module.

## Component manifest retarget

- Remove Atlas `AttentionVariantComparisonGraph` and `RegistryGraphFlow` from
  `REUSABLE_COVERAGE_COMPONENTS` / `PHASE_1_MODULE_PAGE_COVERAGE_COMPONENTS`.
  Leave the Atlas implementation files in place for existing page consumers;
  deletion/migration belongs to later lanes.
- Register factory-ui wrappers in `REUSABLE_THIN_WRAPPERS` with
  `forwardsTo` pointing at the package category (or DataTable / CodePanel) and
  smoke tests under `src/features/factory-ui/*.test.tsx`.
- Coverage gate must allow `src/features/factory-ui/`
  (`FACTORY_UI_MANIFEST_PREFIX` in `component-coverage-gate.ts`); thin wrappers
  skip line-percent thresholds and only require existing smoke test files.

## Verification preference

Prove install/transpile by compiling and importing real package exports (and later
by rendering factory-ui wrappers with fixture props). Avoid meta-tests that only
scan `package.json` keys, CSS `@import` counts, import-path inventories, or live
`REUSABLE_COVERAGE_COMPONENTS` / `REUSABLE_THIN_WRAPPERS` membership lists.
Prove gate path allowlisting and thin-wrapper evaluation with fixture inputs in
`component-coverage-gate.test.ts`; keep render smoke tests under
`src/features/factory-ui/*.test.tsx`.

## Related

- PRD lane: `rewrite-components-package`
- Upstream foundation: `rewrite-ci-deploy-foundation-zero` (Makefile/CI/static-export contract)
