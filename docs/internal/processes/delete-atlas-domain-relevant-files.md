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

## Story 003: delete topology explorers and routes

| Path | Role |
| --- | --- |
| `src/features/topology/` | Deleted Cytoscape topology explorer package |
| `src/app/(site)/topology/` / `src/app/[locale]/topology/` | Deleted live `/topology` product route modules |
| `src/app/(site)/site-renderers.tsx` | No longer renders `TopologyPrototype`; browse graph-map still uses `TopologyBrowsePage` |
| `src/features/ai/topology.ts` / `src/features/ai/server.ts` | Stop re-exporting deleted topology explorers |
| `src/lib/site/model-atlas-site-config.ts` | Drop topology from `primaryNav` so the shell no longer links the product surface |
| `src/lib/content/topology-*.ts` / `TopologyBrowsePage` | Keep browse classification helpers; they are not the `/topology` explorer product |

## Story 004: remove Model Atlas AI search enrichment

| Path | Role |
| --- | --- |
| `src/lib/search/build-documents.ts` | Composes base + generic `enrichSearchDocument` only; no Atlas AI facet adapter |
| `src/lib/search/model-atlas-ai-search-enrichment-adapter.ts` | Deleted; previously appended `modelFamily` / `sourceType` / `modalities` / `trainingRegimeIds` / `optimizes` |
| `src/lib/search/index.ts` | No longer re-exports Atlas AI enrichment helpers |
| `src/lib/search/build-documents.test.ts` | Asserts built documents stay free of Atlas AI-only facet keys |
| `src/lib/search/types.ts` | Optional Atlas AI facet keys may remain on the type for compatibility; builder must not populate them |
| `docs/internal/processes/search-domain-relevant-files.md` | Search pipeline map after adapter removal |


## Story 005: delete Atlas-specific verifiers and make/package entrypoints

| Path | Role |
| --- | --- |
| `Makefile` | Removed `verify-atlas-*`, `build-export`, and Phase-1 convergence targets |
| `package.json` | Removed `verify:export-*`, `verify:phase-1-*`, `verify:phase-2-*`, `verify:rendered-quality-*` scripts |
| `scripts/verify-phase-1-*.ts`, `scripts/verify-grouped-query-attention-built-route.ts`, `scripts/verify-docs-footer-hover-built-route.ts`, `scripts/run-phase-1-*.ts` | Deleted Atlas/Phase-1 verifier entrypoints |
| `src/lib/build/verify-phase-1-*.ts`, `src/lib/build/verify-*-built-route.ts` | Deleted Atlas built-route / export route verifiers |
| `src/lib/build/export-out-directory.ts` | Generic `out/` helpers relocated from deleted Phase-1 export verifier for `emit-export-search-index` |
| `src/lib/build/built-app-html-paths.ts` | Generic base-path HTML normalizer relocated from deleted built-app test utils |
| `src/lib/verify/phase-1*`, `*module-convergence*`, `*gqa*`, rendered-quality / customer-ask Atlas helpers | Deleted Atlas-only verify helpers |
| `scripts/run-website-verifier-tests.ts` | Empty-shell skip when no website verifier suites remain |
| `src/lib/verify/production-integration-test-paths.ts` | Dropped retired Atlas built-route integration paths |

Required `make check` / `make test` / `make build` must not invoke deleted Atlas verifiers.

## Later stories in this PRD

- `006` removes remaining Atlas feature packages/routes
- `007` proves `make check` / `make test` / `make build` end-to-end


## Empty collection directories in git

After clearing Atlas registry/docs collections, keep empty section directories in
git with `.gitkeep` (for example `src/content/registry/graphs/.gitkeep`). CI
clones omit untracked empty dirs; `generate-graph-registry-runtime` also
tolerates a missing graphs root by emitting an empty runtime.

## Related

- [ci-deploy-foundation-relevant-files.md](./ci-deploy-foundation-relevant-files.md) — required make targets must not re-chain Atlas verifiers
