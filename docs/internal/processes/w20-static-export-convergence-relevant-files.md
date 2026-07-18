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

## Ownership fence

W20 may reconcile wiring under `src/lib/build/`, `src/lib/seo/`, `src/lib/verify/`,
and verify scripts when combined-tip drift breaks an existing gate. Prefer
restoring the established exclusion / projection boundary over redesign.
