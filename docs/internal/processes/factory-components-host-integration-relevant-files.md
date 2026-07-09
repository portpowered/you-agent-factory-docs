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
| `src/app/globals.css` | Single `@import "@you-agent-factory/components/styles.css"` after Tailwind (package README order) |
| `src/lib/factory-components/host-package-styles.ts` | Resolves the published `styles.css` export map entry for smoke verification |
| `src/features/factory-ui/graphs.ts` | Thin re-export of `@you-agent-factory/components/graphs` (viewport/node/edge helpers); no domain logic or styles import |
| `src/features/factory-ui/charts.ts` | Thin re-export of `@you-agent-factory/components/charts` (ChartContainer, ChartStatePanel, tooltip/legend helpers); no domain series models or styles import |
| `src/features/factory-ui/*` | Thin re-export wrappers for DataTable, CodePanel (later stories) |
| `src/lib/docs/component-manifest.ts` | Reusable coverage boundary retarget away from Atlas graph components (later story) |

## Styles import contract

- Import `@you-agent-factory/components/styles.css` **exactly once** in
  `src/app/globals.css` (the stylesheet every app/static-export layout already
  pulls in). Place it immediately after `@import "tailwindcss"` so package
  `@theme` tokens layer correctly with Tailwind v4.
- Do **not** re-import package styles from `src/features/factory-ui/*` wrappers.
- Prove the styles export resolves with `resolveFactoryComponentsStylesPath()`;
  do not add tests that only count `@import` lines in `globals.css`.

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

## Verification preference

Prove install/transpile by compiling and importing real package exports (and later
by rendering factory-ui wrappers with fixture props). Avoid meta-tests that only
scan `package.json` keys, CSS `@import` counts, or import-path inventories.

## Related

- PRD lane: `rewrite-components-package`
- Upstream foundation: `rewrite-ci-deploy-foundation-zero` (Makefile/CI/static-export contract)
