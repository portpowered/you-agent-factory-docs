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

Upstream lane docs (do not fork ownership):

* [package-artifact-resolver-relevant-files](./package-artifact-resolver-relevant-files.md)
* [normalized-reference-model-relevant-files](./normalized-reference-model-relevant-files.md)
* [unified-api-reference-renderer-relevant-files](./unified-api-reference-renderer-relevant-files.md)
* [w19-accessibility-responsive-budgets-relevant-files](./w19-accessibility-responsive-budgets-relevant-files.md)

## Ownership fence

W20 may reconcile wiring under `src/lib/build/`, `src/lib/seo/`, `src/lib/verify/`,
and verify scripts when combined-tip drift breaks an existing gate. Prefer
restoring the established exclusion / projection boundary over redesign.
