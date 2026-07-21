# W20 Static-Export and Cross-Surface Convergence — relevant files

Use these files when extending Factory-reference **static-export / cross-surface
convergence** after W19 a11y / responsive / budget gates land. W20 owns
convergence evidence, CI/script wiring, and narrow reconciliation under
`src/lib/build/`, `src/lib/seo/`, verify scripts, and related test entrypoints.

Do **not** redesign nav, search, locale, migration, or W08/W09 renderer
ownership. Do **not** reopen W00–W19 feature ownership, hybrid placement, or
B00–B10b / R00–R02.

## Story 001 — focused contract and projection gates

| Path | Role |
| --- | --- |
| `src/lib/verify/w20-contract-projection-convergence.ts` | Catalog of required contract + projection suite paths and §17 gate families |
| `src/lib/verify/w20-contract-projection-convergence.test.ts` | Catalog completeness / file-existence / family-coverage proofs |
| `scripts/run-w20-contract-projection-tests.ts` | Runner: catalog proof then focused suite |
| `package.json` → `test:w20-contract-projection` | Maintainer / automation entry |
| `Makefile` → `test-w20-contract-projection` | Shared Makefile contract |

### Contract suites (W03 acquisition)

* `src/lib/references/api-package-artifact-resolver.test.ts` — public subpaths + missing-export rejection
* `src/lib/references/api-package-manifest-membership.test.ts` — manifest membership / hashes
* `src/lib/references/api-package-format-version-gate.test.ts` — format-version fail-closed
* `src/lib/references/api-package-consumed-hash-ledger.test.ts` — consumed-hash completeness ledger
* `src/lib/references/reference-cross-link-resolver.test.ts` — missing / malformed ref rejection

### Projection suites (W04 + live OpenAPI projection)

* `src/lib/references/reference-item.test.ts` / `schema-model.test.ts` / `family-normalized-models.test.ts`
* `src/lib/references/normalize-family-artifacts.test.ts` — OpenAPI / CLI / MCP / JS / events
* `src/lib/references/reference-anchor-registry.test.ts` — anchors
* `src/lib/references/reference-display-projection.test.ts` / `reference-search-projection.test.ts`
* `src/lib/references/reference-model-fixtures.test.ts` — fixture-backed integration
* `src/lib/references/mcp-input-schema-projection.test.ts`
* `src/features/references/api/single-page-projection.test.ts`
* `src/lib/references/family-inventory-contract-drift.test.ts` — CLI / MCP / JS identity drift

### Reproduce

```bash
make test-w20-contract-projection
# or: bun run test:w20-contract-projection
```

## Story 002 — content and registry validation

| Path | Role |
| --- | --- |
| `src/lib/verify/w20-content-registry-convergence.ts` | Catalog of command gates, focused suites, and required published Factory-reference URLs |
| `src/lib/verify/w20-content-registry-convergence.test.ts` | Catalog completeness + published-route presence proofs against `publishedDocsIndex` |
| `scripts/run-w20-content-registry-tests.ts` | Runner: catalog → `make validate-data` → `make verify-content-runtime-completeness` → focused suites |
| `package.json` → `test:w20-content-registry` | Maintainer / automation entry |
| `Makefile` → `test-w20-content-registry` | Shared Makefile contract |

### Command gates

* `make validate-data` — registry / derived page-bundle validation
* `make verify-content-runtime-completeness` — content-runtime completeness gate

### Focused suites

* `src/lib/content/published-docs-registry-contract.test.ts` — factories / workers / workstations section contracts
* `src/lib/content/docs-catch-all-static-params.test.ts` — catch-all static params include references / factories / workers / workstations children

### Reproduce

```bash
make test-w20-content-registry
# or: bun run test:w20-content-registry
```

## Story 003 — link and anchor validation

| Path | Role |
| --- | --- |
| `src/lib/verify/w20-link-anchor-convergence.ts` | Catalog of linkcheck command gate + focused link/anchor suite paths and §17 gate families |
| `src/lib/verify/w20-link-anchor-convergence.test.ts` | Catalog completeness / file-existence / family-coverage proofs |
| `scripts/run-w20-link-anchor-tests.ts` | Runner: catalog → `make linkcheck` → focused suites |
| `package.json` → `test:w20-link-anchor` | Maintainer / automation entry |
| `Makefile` → `test-w20-link-anchor` | Shared Makefile contract |

### Command gate

* `make linkcheck` — documentation link + heading/section anchor validation (`scripts/validate-links.ts`)

### Focused suites

* `src/lib/build/validate-links.test.ts` — link inventory helpers + full `validateDocumentationLinks` pass
* `src/lib/references/reference-anchor-registry.test.ts` — operations, schema-pointer, CLI, MCP, JS, events + collision fail-closed
* `src/lib/references/assign-family-reference-anchors.test.ts` — CLI / MCP / JS registry anchor assignment
* `src/features/references/api/operation-anchors.test.ts` — API operation deep-link anchors
* `src/features/references/schema/schema-composition.test.tsx` — schema-pointer field anchors

### Reproduce

```bash
make test-w20-link-anchor
# or: bun run test:w20-link-anchor
```

Upstream lane docs (do not fork ownership):

* [package-artifact-resolver-relevant-files](./package-artifact-resolver-relevant-files.md)
* [normalized-reference-model-relevant-files](./normalized-reference-model-relevant-files.md)
* [unified-api-reference-renderer-relevant-files](./unified-api-reference-renderer-relevant-files.md)
* [w19-accessibility-responsive-budgets-relevant-files](./w19-accessibility-responsive-budgets-relevant-files.md)
* [content-page-generation-workflow-relevant-files](./content-page-generation-workflow-relevant-files.md)
* [derived-page-validation-relevant-files](./derived-page-validation-relevant-files.md)

## Story 004 — search functional / static-search verification

| Path | Role |
| --- | --- |
| `src/lib/verify/w20-search-functional-convergence.ts` | Catalog of static-search command gate + W16 item deep-link suite paths and §17 gate families |
| `src/lib/verify/w20-search-functional-convergence.test.ts` | Catalog completeness / file-existence / family-coverage proofs |
| `src/lib/verify/w20-search-functional-browser-verify.test.tsx` | Browser-path proof: live `docsSearchApi.search` → item deep-link → navigable fragment href |
| `scripts/run-w20-search-functional-tests.ts` | Runner: catalog → `make test-website-static-search` → focused suites |
| `package.json` → `test:w20-search-functional` | Maintainer / automation entry |
| `Makefile` → `test-w20-search-functional` | Shared Makefile contract |
| `Makefile` → `test-website-static-search` | Command gate wrapping `test:website:static-search` |

### Command gate

* `make test-website-static-search` — `docs-search-bootstrap-path`, `export-search-bootstrap`, and `verify-export-search-bootstrap-client-path`

### Focused suites (W16 item deep-links + representative queries)

* `src/lib/content/factory-search-reference-shape-adaptation.test.ts` — event-corpus shape → fragment URL adaptation
* `src/lib/content/factory-search-api-schema-indexing.test.ts` — API operation + schema field owning-page deep links
* `src/lib/content/factory-search-cli-mcp-js-event-indexing.test.ts` — CLI / MCP / JS / event item deep links
* `src/lib/content/factory-search-item-hits-above-page-crowding.test.ts` — item `#…` hits above owning-page crowding
* `src/lib/content/factory-search-payload-gate-representative-queries.test.ts` — bootstrap budget + representative family queries
* `src/lib/verify/w20-search-functional-browser-verify.test.tsx` — browser-path item deep-link + navigable href

### Reproduce

```bash
make test-w20-search-functional
# or: bun run test:w20-search-functional
```

Worktree note: Next/Turbopack often cannot start without local `node_modules`.
Prove search → item deep-link navigation via live `docsSearchApi.search` (same
`/api/search` pipeline) plus the browser-verify suite above — do not redesign
search ranking or W16 projection ownership.

## Story 005 — accessibility / responsive / focused payload budgets

| Path | Role |
| --- | --- |
| `src/lib/verify/w20-a11y-responsive-convergence.ts` | Catalog of `make a11y` command gate, W19 suite inventory, focused payload-budget routes, and narrow keyboard browser-path contract |
| `src/lib/verify/w20-a11y-responsive-convergence.test.ts` | Catalog completeness / file-existence / family-coverage proofs |
| `src/lib/verify/w20-a11y-responsive-browser-verify.test.tsx` | Browser-path proof: API representative at narrow (390) width with keyboard focus visible on primary control |
| `scripts/run-w20-a11y-responsive-tests.ts` | Runner: catalog → `make a11y` → browser-path suite |
| `package.json` → `test:w20-a11y-responsive` | Maintainer / automation entry |
| `Makefile` → `test-w20-a11y-responsive` | Shared Makefile contract |

### Command gate

* `make a11y` — critical-route + W19 reference-surface a11y / responsive /
  focused payload-budget always-on suites (`test:a11y`)

### Catalogued W19 / W20 suites (evidence inventory)

* `a11y-responsive-contract.test.ts` — critical-route a11y contract
* `a11y-reference-surface-contract.test.ts` — six representative routes × five layouts
* `a11y-reference-payload-budget.test.ts` — focused API / events / factory-schema budgets (does **not** raise total-site ceilings; story 008 owns `make budget`)
* `a11y-reference-keyboard-contract.test.ts` + `reference-keyboard-navigation.a11y.test.tsx`
* `reference-responsive-overflow.a11y.test.tsx`
* Screen-reader / hash-focus / copy / reduced-motion / long-token / no-JS / browser-closeout contract tests
* `w20-a11y-responsive-browser-verify.test.tsx` — narrow + keyboard focus browser path

### Reproduce

```bash
make test-w20-a11y-responsive
# or: bun run test:w20-a11y-responsive
```

Worktree note: prove narrow-width keyboard focus via the API navigation harness
+ W19 keyboard chrome contract (happy-dom), not a second Playwright matrix.
Do not redesign W19 harness ownership.

## Story 006 — full static export without a live Factory host

| Path | Role |
| --- | --- |
| `src/lib/verify/w20-static-export-convergence.ts` | Catalog of `make build` command gate, FR-33 route probes, FR-34 no-host markers, and `evaluateStaticExportConvergence` |
| `src/lib/verify/w20-static-export-convergence.test.ts` | Catalog completeness + fixture evaluation proofs |
| `src/lib/verify/w20-static-export-out-verify.test.ts` | Trusted `out/` FR-33 corpus + FR-34 no-host / no-proxy verify |
| `scripts/run-w20-static-export-tests.ts` | Runner: catalog → `make build` → post-build suites |
| `package.json` → `test:w20-static-export` | Maintainer / automation entry |
| `Makefile` → `test-w20-static-export` | Shared Makefile contract |

### Command gate

* `make build` — full static export (`bun run build:export`) emitting trusted `out/`

### Focused suites (FR-33 / FR-34)

* `src/features/references/api/playground-suppression.test.ts` — playground disabled + proxyUrl unset
* `src/lib/references/events/events-lib.test.ts` — `EVENT_STREAM_SAFETY` no live host / proxy / playground
* `src/content/docs/references/published-route-states.test.tsx` — CLI/MCP/JS inventory loads without Factory host env
* `src/lib/verify/w20-static-export-out-verify.test.ts` — exported HTML corpus markers + forbidden proxy absence

### Reproduce

```bash
make test-w20-static-export
# or: bun run test:w20-static-export
```

Worktree note: the out/ verify suite requires a trusted export from the command
gate. Do not invent a second Pages-prefixed rebuild here (story 007 owns that).

## Story 007 — Pages-prefixed export and deployed-artifact guard

| Path | Role |
| --- | --- |
| `src/lib/verify/w20-pages-prefixed-export-convergence.ts` | Catalog of prefixed rebuild + guard command gates, probe inventory, and §17 gate families |
| `src/lib/verify/w20-pages-prefixed-export-convergence.test.ts` | Catalog completeness / file-existence / family-coverage proofs |
| `src/lib/verify/w20-pages-prefixed-export-out-verify.test.ts` | Trusted project-site `out/` prefix consumer verify |
| `scripts/run-w20-pages-prefixed-export-tests.ts` | Runner: catalog → prefixed `make build` → `make guard-pages-deployed-artifact` → post-guard suites |
| `package.json` → `test:w20-pages-prefixed-export` | Maintainer / automation entry |
| `Makefile` → `test-w20-pages-prefixed-export` | Shared Makefile contract |

### Command gates

* `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs make build` — project-site prefixed static export emitting trusted `out/`
* `make guard-pages-deployed-artifact` — HTTP-probe home / getting-started / comparing / search bootstrap / CSS / JS on that same `out/` (no second full export)

### Focused suites

* `src/lib/verify/pages-prefixed-rebuild-r02-convergence.test.ts` — base path + probe inventory + prefixed accept / unprefixed reject
* `src/lib/build/guard-pages-deployed-artifact.test.ts` — guard evaluation + fixture probe proofs
* `src/lib/build/deploy-pages-workflow-contract.test.ts` — `deploy-pages.yml` sets base path, guard before upload
* `src/lib/build/verify-export-base-path.test.ts` — HTML asset / nav prefix helpers
* `src/lib/build/verify-project-site-export-consumers.test.ts` — search-bootstrap + asset consumer evaluation
* `src/lib/verify/w20-pages-prefixed-export-out-verify.test.ts` — live `out/` project-site consumer verify

### Reproduce

```bash
make test-w20-pages-prefixed-export
# or: bun run test:w20-pages-prefixed-export
```

Live gate sequence (no intervening unprefixed rebuild):

```bash
GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs make build
make guard-pages-deployed-artifact
```

Worktree note: the out/ verify suite requires the prefixed rebuild from the
command gate. Do not run an unprefixed `make build` between the rebuild and
the guard.

## Story 008 — total-site and reference payload budgets

| Path | Role |
| --- | --- |
| `src/lib/verify/w20-budget-convergence.ts` | Catalog of `make budget` command gate, total-site + focused payload suites, and §17 gate families |
| `src/lib/verify/w20-budget-convergence.test.ts` | Catalog completeness / file-existence / family-coverage / baseline-lock proofs |
| `src/lib/verify/w20-budget-out-verify.test.ts` | Trusted `out/` total-site + focused reference payload evaluate |
| `scripts/run-w20-budget-tests.ts` | Runner: catalog → `make budget` → post-command suites |
| `package.json` → `test:w20-budget` | Maintainer / automation entry |
| `Makefile` → `test-w20-budget` | Shared Makefile contract |

### Command gate

* `make budget` — total-site export ceilings (`FACTORY_EXPORTED_SITE_BUDGET_BASELINES`) then W19 focused API / events / factory-schema page payloads against the same trusted `out/`

### Focused suites

* `src/lib/build/exported-site-budget.test.ts` — total-site baseline + fixture evaluation
* `src/lib/verify/a11y-reference-payload-budget.test.ts` — focused page ceilings + fixture evaluation
* `src/lib/verify/w20-budget-out-verify.test.ts` — live `out/` total-site + focused evaluate

### Reproduce

```bash
make test-w20-budget
# or: bun run test:w20-budget
```

Live gate sequence (budget reuses `out/`):

```bash
make build
make budget
```

Worktree note: do not silently raise total-site ceilings without evidence-backed
inventory growth. Focused W19 ceilings stay under story 008 ownership for
close-out; story 005 only reconfirmed they remain enforced via `make a11y`.

## Story 009 — package resolver / client-chunk exclusion

| Path | Role |
| --- | --- |
| `src/lib/verify/w20-client-chunk-exclusion-convergence.ts` | Catalog of W03 browser-bundle exclusion suites, browser-safe / server-only module inventories, and §17 / FR-11 gate families |
| `src/lib/verify/w20-client-chunk-exclusion-convergence.test.ts` | Catalog completeness / file-existence / family-coverage / inventory-lock proofs |
| `scripts/run-w20-client-chunk-exclusion-tests.ts` | Runner: catalog → focused exclusion suites |
| `package.json` → `test:w20-client-chunk-exclusion` | Maintainer / automation entry |
| `Makefile` → `test-w20-client-chunk-exclusion` | Shared Makefile contract |

### Focused suites (W03 acquisition browser exclusion)

* `src/lib/references/api-package-acquisition-browser-exclusion.test.ts` — leak-marker evaluation, browser-safe helper chunks, server-only resolver fail-closed, package-internal illegal-target rejection
* `src/lib/references/api-package-acquisition-browser-exclusion.ts` — pure module inventories + leak evaluation helpers
* `src/lib/references/api-package-acquisition-browser-exclusion-bundling.ts` — Bun `target: "browser"` bundler used by exclusion proofs (build/server-only)

### Reproduce

```bash
make test-w20-client-chunk-exclusion
# or: bun run test:w20-client-chunk-exclusion
```

Worktree note: restore the established W03 exclusion boundary when tip drift
introduces a leak — do not patch `node_modules` or reopen package ownership.
Upstream lane doc: [package-artifact-resolver-relevant-files](./package-artifact-resolver-relevant-files.md).

## Story 010 — ownership map + closed migration ledger

| Path | Role |
| --- | --- |
| `src/lib/verify/w20-ownership-migration-convergence.ts` | Plan §9 page + §11 component ownership/test-surface map, W18 closure suite catalog, pure `evaluateOwnershipMigrationConvergence` |
| `src/lib/verify/w20-ownership-migration-convergence.test.ts` | Catalog completeness / path-existence / zero-orphan / ledger-closed proofs |
| `scripts/run-w20-ownership-migration-tests.ts` | Runner: catalog → W18 migration closure suites |
| `package.json` → `test:w20-ownership-migration` | Maintainer / automation entry |
| `Makefile` → `test-w20-ownership-migration` | Shared Makefile contract |

### Focused suites (W18 migration ledger closure)

* `src/lib/seo/documentation-route-migration.test.ts` — ledger contract + §10 row inventory
* `src/lib/seo/documentation-route-migration-closure.test.tsx` — fully closed ledger + important anchors + sitemap/canonical proofs
* `src/lib/seo/documentation-route-migration-canonical.test.ts` — canonical declaration pairing
* `src/lib/seo/documentation-route-migration-links.test.tsx` — inbound link / compatibility HTML proofs
* `src/lib/seo/documentation-route-migration.ts` — temporary §10 ledger + static compatibility mechanism

### Reproduce

```bash
make test-w20-ownership-migration
# or: bun run test:w20-ownership-migration
```

Worktree note: map every plan §9 page and §11 component to an existing owner
workstream + test surface — do not invent product pages or unpublished schemas.
Assert W18 ledger remains fully closed via existing closure suites; do not
reopen W18 mechanism design. Upstream lane doc:
[static-seo-metadata-relevant-files](./static-seo-metadata-relevant-files.md).

## Story 011 — final evidence + upstream follow-ups

| Path | Role |
| --- | --- |
| `src/lib/verify/w20-final-evidence-convergence.ts` | §17 gate-family evidence map, Worker/Workstation upstream follow-ups, browser probe inventory, `evaluateFinalEvidenceConvergence` |
| `src/lib/verify/w20-final-evidence-convergence.test.ts` | Catalog completeness / family coverage / upstream-scope / evaluation proofs |
| `src/lib/verify/w20-final-evidence-browser-verify.test.ts` | Trusted `out/` loopback HTTP fetch of API / events / schema / authored factory-worker-workstation surfaces (no Factory host) |
| `scripts/run-w20-final-evidence-tests.ts` | Runner: catalog → `make check` → browser-verify suite |
| `package.json` → `test:w20-final-evidence` / `check` | Maintainer / automation entry |
| `Makefile` → `test-w20-final-evidence` | Shared Makefile contract |

### Command gate

* `make check` — lint + typecheck (`bun run check` mirrors the same pair)

### Evidence inventory (stories 001–010 pointers)

* Contract + projection → `make test-w20-contract-projection`
* Content/registry → `make test-w20-content-registry`
* Link/anchor → `make test-w20-link-anchor`
* Search → `make test-w20-search-functional`
* A11y/responsive → `make test-w20-a11y-responsive`
* Static export → `make test-w20-static-export`
* Pages guard → `make test-w20-pages-prefixed-export`
* Budgets → `make test-w20-budget`
* Client-chunk exclusion → `make test-w20-client-chunk-exclusion`
* Ownership map + migration closure → `make test-w20-ownership-migration`

### Upstream follow-ups (locked scope)

* Worker/Workstation discriminated-schema only (`AgentWorker`,
  `RepeaterWorkstation`, `ClassifierWorkstation` aspirational `$defs`; installed
  `Worker` / `Workstation` remain broad objects per baseline). Do **not** invent
  unpublished schemas or new product surfaces.

### Reproduce

```bash
make test-w20-final-evidence
# or: bun run test:w20-final-evidence
```

Live gate sequence (browser verify reuses `out/`):

```bash
make build
make check
bun test src/lib/verify/w20-final-evidence-browser-verify.test.ts
```

Worktree note: final evidence catalogues prior W20 binders rather than
re-running every §17 family; `make check` + exported-surface HTTP verify are
the story-011 executable gates. Upstream docs:
[variant-overlay-contract-relevant-files](./variant-overlay-contract-relevant-files.md),
[factory-references-w00-baseline-relevant-files](./factory-references-w00-baseline-relevant-files.md).

## Ownership fence

W20 may reconcile wiring under `src/lib/build/`, `src/lib/seo/`, `src/lib/verify/`,
and verify scripts when combined-tip drift breaks an existing gate. Prefer
restoring the established exclusion / projection boundary over redesign.
