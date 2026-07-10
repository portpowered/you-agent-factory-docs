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
| `src/lib/site/you-agent-factory-site-config.ts` | CLI site config after `rewrite-site-config-contracts`; topology is not in `primaryNav` |
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

## Story 006: remaining Atlas feature packages and routes

| Path | Role |
| --- | --- |
| `src/features/generation-evolution/` | Deleted blog/docs generation-evolution explorer |
| `src/features/training-signal-evolution/` | Deleted training-signal evolution explorer |
| `src/features/roofline-throughput-explorer/` | Deleted registry-backed roofline explorer |
| `src/features/graphs/` | Deleted Atlas graph primitives (GraphFrame/LineGraph/Heatmap + training-signal stacked chart) |
| `src/features/docs/timeline/` | Deleted ontology timeline product surface |
| `src/app/docs/timeline/` / `src/app/[locale]/docs/timeline/` | Deleted live `/docs/timeline` routes |
| `src/features/ai/{timeline,server}.ts` | Empty retired barrels after timeline deletion |
| `src/lib/content/{ontology-timeline,timeline-selector-compatibility,roofline-model-size-presets,effective-roofline-model-size}.ts` | Deleted helpers that existed only for those explorers |
| `src/lib/content/mdx-components.tsx` / `blog-mdx-components.tsx` | No longer register Atlas explorer MDX components |
| `src/lib/site/you-agent-factory-site-config.ts` | Timeline not in CLI `primaryNav`; do not reintroduce `modelAtlasSiteConfig` |
| `src/app/(site)/docs/{models,modules,papers,training,systems,glossary}/` | Collection section indexes remain as empty-shell routes via `renderSectionCollectionIndexPage` |
| `src/content/blog/*/page.mdx` | Strip explorer component imports; keep prose-only posts |

## Story 007: prove the shell builds without Atlas domain content

| Path | Role |
| --- | --- |
| `Makefile` `check` / `test` / `build` | End-to-end maintainer gates that must exit 0 on the post-deletion tree |
| `src/lib/site/you-agent-factory-site-config.ts` | `homeFeaturedLinks` is empty on main after site-config contracts; no deleted Atlas module destinations |
| `out/` | Static export artifact from `make build`; browser-verify home/shell loads without `/topology` or Atlas module product destinations |
| `docs/getting-started` + empty collection section indexes | Remaining non-Atlas shell surfaces after page-bundle deletion |

Validation sequence for story 007:

1. `make check`
2. `make test`
3. `make build` (produces `out/`)
4. Serve `out/` briefly and confirm `/` loads, `/topology` and `/docs/timeline` are gone, and home featured links do not point at deleted Atlas module pages

## Empty collection directories in git

After clearing Atlas registry/docs collections, keep empty section directories in
git with `.gitkeep` (for example `src/content/registry/graphs/.gitkeep`). CI
clones omit untracked empty dirs; `generate-graph-registry-runtime` also
tolerates a missing graphs root by emitting an empty runtime.

## Mergeability with empty-CLI taxonomy (`rewrite-empty-cli-taxonomy`)

When merging main after empty-CLI taxonomy lands:

| Path | Role |
| --- | --- |
| `src/features/models/**` | Keep deleted (modify/delete: prefer HEAD deletion over main's RegistryGraphFlow edits) |
| `src/lib/content/page-template-convergence.test.tsx` | Keep writing-standards assertions; do **not** require deleted `assetId` / PageAsset graph tags |
| `src/lib/content/routable-docs-page.test.ts` | Keep CLI path-acceptance cases; assert deleted Atlas page fixtures are **absent** from `source`, not present |
| `docs/templates/{guide,technique,documentation}.*` | Accept main's CLI templates |
| `src/content/docs/{guides,techniques,documentation}/.gitkeep` | Accept empty CLI content roots from main |

## Story: delete Atlas page loaders / local-docs dispatch

| Path | Role |
| --- | --- |
| `src/lib/content/{model,module,paper,training-regime,system}-page*.ts` | Deleted Atlas page + page-load modules |
| `src/lib/content/{module,system}-shell-render.tsx` | Deleted Atlas shell-render helpers |
| `src/lib/content/compile-module-mdx.ts` / `module-comparison-table.ts` / `module-test-helpers.ts` | Deleted kind-only helpers; `collectTableMessageKeys` lives in `table-message-keys.ts` |
| `src/lib/content/local-docs-page.ts` | Factory-only sections: guides, concepts, techniques, documentation, glossary |
| `src/app/docs/docs-slug-renderer.tsx` | No Atlas section branches (systems FoldedOpeningSummary removed) |
| `src/lib/navigation/local-docs-toc.test.ts` | Asserts retired Atlas sections are rejected by `parseLocalDocsPageRef` |

Do not reintroduce Atlas section cases in `loadLocalDocsPage`. Empty Atlas
content/registry trees and live kind contracts are owned by later
`delete-ai-content-infrastructure` stories.

