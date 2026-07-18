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
* `src/components/references/api/single-page-projection.test.ts`
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
* `src/components/references/api/operation-anchors.test.ts` — API operation deep-link anchors
* `src/components/references/schema/schema-composition.test.tsx` — schema-pointer field anchors

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

* `src/components/references/api/playground-suppression.test.ts` — playground disabled + proxyUrl unset
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

## Ownership fence

W20 may reconcile wiring under `src/lib/build/`, `src/lib/seo/`, `src/lib/verify/`,
and verify scripts when combined-tip drift breaks an existing gate. Prefer
restoring the established exclusion / projection boundary over redesign.
