# Delete Model Atlas Domain Relevant Files

Use these files when stripping Model Atlas page bundles, registry records, and
Atlas-coupled test gates so the rewrite shell can validate with empty CLI
collections.

## Story 001: page bundles and registry records

| Path | Role |
| --- | --- |
| `src/content/docs/{models,modules,papers,training,systems,glossary,concepts}/` | Atlas MDX page bundles (cleared; section dirs may remain empty) |
| `src/content/docs/getting-started.mdx` | Non-Atlas shell placeholder kept for Fumadocs wiring |
| `src/content/registry/{models,modules,papers,training-regimes,systems,concepts,graphs,tables,classifications,citations,datasets,organizations}/` | Atlas registry collections cleared for empty-shell validation |
| `src/content/registry/tags/` | Keep only tags still referenced by remaining blog posts (plus `taxonomy` parent) |
| `src/content/blog/*/page.mdx` | Clear `relatedDocIds` and `/docs/...` prose links when Atlas targets are gone |
| `scripts/validate-registry.ts` / `bun run validate-data` | Maintainer registry/content validation path that must pass without Atlas fixtures |
| `src/lib/content/validate-registry.ts` | `phase1PageDirectories` is empty after Atlas deletion |
| `src/lib/content/critical-docs-smoke.ts` | Critical-doc smoke rules/probes emptied with Atlas pages |
| `src/lib/content/graph-message-runtime.ts` | Must not statically import deleted page message JSON |
| `src/lib/content/yaml-frontmatter.ts` | Treat YAML `[]` as an empty array (align with next-mdx-remote) |
| `src/lib/content/table-registry-generation.ts` | Emit biome-friendly `[] as const` when no table records remain |
| `scripts/run-website-functionality-tests.ts` | Exclude Atlas discovery/search/layout/feature suites from required `make test` |

## Validation sequence after deletion

1. `bun run prepare:content-runtime` (regenerates empty published-docs / registry / table runtimes)
2. `bun run validate-data`
3. `bun run typecheck`
4. `bun run lint`
5. `bun run test` (website suite with Atlas exclusions)

## Story 002: delete `src/features/models` and host imports

| Path | Role |
| --- | --- |
| `src/features/models/` | Deleted Atlas model/module/paper/system/training renderers |
| `src/lib/content/mdx-components.tsx` | Host MDX registration no longer maps Atlas model components |
| `src/features/docs/components/PageAsset.tsx` | Renders image/graph/table/chart placeholders without Atlas React Flow charts |
| `src/features/ai/models.ts` / `src/features/ai/server.ts` | Stop re-exporting deleted `@/features/models` renderers |
| `src/lib/verify/module-attention-math-variable-definitions.ts` | Pure math-id constants relocated from deleted models package for remaining Atlas verifiers |
| `src/lib/verify/registry-graph-flow-theme.ts` | Graph theme/selector constants relocated for remaining static-export verifiers |
| `src/lib/docs/component-manifest.ts` | Drop deleted models coverage entries / thin wrappers |
| `docs/templates/*.mdx` | Authoring templates no longer import deleted Atlas components |

## Later stories in this PRD

- `003` deletes topology explorers/routes
- `004` removes Model Atlas AI search enrichment
- `005` deletes Atlas verifier scripts and make/package entrypoints
- `006` removes remaining Atlas feature packages/routes
- `007` proves `make check` / `make test` / `make build` end-to-end

## Related

- [ci-deploy-foundation-relevant-files.md](./ci-deploy-foundation-relevant-files.md) — required make targets must not re-chain Atlas verifiers
