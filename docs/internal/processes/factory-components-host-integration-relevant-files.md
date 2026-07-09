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
| `src/app/globals.css` | Single `@import "@you-agent-factory/components/styles.css"` (later story) |
| `src/features/factory-ui/*` | Thin re-export wrappers for graphs, charts, DataTable, CodePanel (later stories) |
| `src/lib/docs/component-manifest.ts` | Reusable coverage boundary retarget away from Atlas graph components (later story) |

## Verification preference

Prove install/transpile by compiling and importing real package exports (and later
by rendering factory-ui wrappers with fixture props). Avoid meta-tests that only
scan `package.json` keys, CSS `@import` counts, or import-path inventories.

## Related

- PRD lane: `rewrite-components-package`
- Upstream foundation: `rewrite-ci-deploy-foundation-zero` (Makefile/CI/static-export contract)
