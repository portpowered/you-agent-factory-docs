# Restore Required Tests Gates — Relevant Files

Use these files when inventorying website-suite exclusions, deleting obsolete
Atlas skips, and restoring bounded required gates after rewrite foundation.

## Story 001: exclusion inventory and obsolete Atlas deletion

| Path | Role |
| --- | --- |
| `src/lib/website-functionality-exclusions.ts` | Classified exclusion inventory (`active` / `replaced`) for prefixes, Atlas HTML-assertion suffixes, and explicit files; documents `ownedBy` for replaced contracts; lists deleted obsolete Atlas suites and removed dead prefixes |
| `src/lib/website-functionality-exclusions.test.ts` | Proves every live exclusion is classified, explicit file paths exist, deleted-package prefixes are not kept as skips, obsolete Atlas suites are gone, and built-app/built-route suffixes stay excluded |
| `scripts/run-website-functionality-tests.ts` | Plain `make test` runner; consumes the classified inventory via `isWebsiteFunctionalityExcluded` |
| `src/tests/content/attention-tag-landing.test.ts` | **Deleted** obsolete Atlas attention tag landing suite (required deleted `/docs/modules/*` surfaces) |
| `src/tests/content/architecture-index.test.ts` | **Deleted** obsolete Atlas architecture-index suite (required deleted glossary/module baselines) |
| `src/tests/content/glossary-index.test.ts` | **Deleted** obsolete Atlas glossary-index suite (required 50+ deleted glossary pages) |

### Classification rules

- **active** — still excluded from plain `make test` on purpose (fixture isolation, planner/governance suites, content render suites not yet restored, Atlas-stale fixtures awaiting factory rewrite).
- **replaced** — excluded here because a named required suite owns the contract (`make test-build-contract`, `make test-verify-contract`, `make test-integration`, `make test-reader-facing`, or a pending story-005 suite). Every replaced entry must set `ownedBy`.
- **obsolete** — not kept in the live lists. Delete the suite and/or remove the exclusion entry (missing paths, deleted `src/features/ai/` / `src/features/models/`, missing `src/tests/build/`, Atlas-only suites that cannot run).

### Removed obsolete exclusion prefixes

- `src/features/ai/`
- `src/features/models/`
- `src/tests/build/`

### Replaced ownership (summary)

| Exclusion | Owning suite |
| --- | --- |
| `src/lib/build/` | `make test-build-contract` / `bun run test:build-contract` |
| `src/lib/verify/` | `make test-verify-contract` / `bun run test:verify-contract` (+ integration for lifecycle) |
| Layout shell files under `src/tests/layout/` (sidebar/TOC/index/home) | `make test-reader-facing` (+ `make test-integration` for sidebar/TOC/index) |
| `src/tests/search/` (current factory paths), `src/tests/features/`, `src/tests/a11y/`, `src/lib/search/` (current factory paths) | `make test-reader-facing` / `bun run test:reader-facing` |
| `src/lib/docs/`, `src/tests/docs/` | `make component-coverage` (story 005) |
| `src/tests/ci/` | `make test-ci-contract` (workflow/Makefile alignment); `make test-build-contract` for Pages/export pieces |

## Story 002: reader-facing search / layout / a11y required suite

| Path | Role |
| --- | --- |
| `src/lib/reader-facing-required-test-paths.ts` | Explicit bounded path list for current factory search, layout shell, and a11y contracts |
| `src/lib/reader-facing-required-test-paths.test.ts` | Proves the path list is non-empty, files exist, and Atlas built-app/built-route patterns stay out |
| `scripts/run-reader-facing-required-tests.ts` | Runner for `bun run test:reader-facing`; prints `make test-reader-facing` on failure |
| `Makefile` `test-reader-facing` / `package.json` `test:reader-facing` | Maintainer + CI entrypoint; included in `make ci` and `.github/workflows/ci.yml` |
| `src/lib/navigation/docs-sidebar-contract.ts` | Factory sidebar URL constants (`TOKENS_CONCEPT_URL`, `HARNESS_CONCEPT_URL`, `RALPH_TECHNIQUE_URL`, …) used by layout/a11y contracts |
| `src/tests/a11y/*.a11y.test.tsx` | Accessibility smokes rewritten for factory Guides/Concepts/Techniques/search (`harness`) surfaces |
| `src/tests/layout/docs-sidebar-navigation.test.tsx` | Page-tree + soft-skip built-HTML sidebar contracts for factory collections |

Atlas-era GQA/module query fixtures under `src/tests/search/` (parity/panel) and related UI suites remain excluded as `active` until rewritten; do not reintroduce `*-built-app` / `*-built-route-convergence` into the required path.

Reproduce a failing reader-facing gate locally with:

```sh
make test-reader-facing
```

## Story 003: CI, build, verify, and integration contracts

| Path | Role |
| --- | --- |
| `src/lib/verify/verify-contract-required-test-paths.ts` | Explicit bounded path list for current factory verifier/tooling contracts; empty list is a misconfiguration |
| `src/lib/verify/verify-contract-required-test-paths.test.ts` | Proves the path list is non-empty, files exist, and Atlas built-app/built-route patterns stay out |
| `scripts/run-website-verifier-tests.ts` | `make test-verify-contract` runner; fails closed when the required set is empty; prints `make test-verify-contract` on failure |
| `src/lib/ci-contract-required-test-paths.ts` | Explicit bounded path list for workflow/Makefile alignment contracts (not the full heavy `src/tests/ci/` tree) |
| `src/lib/ci-contract-required-test-paths.test.ts` | Proves the CI contract path list is non-empty and excludes fresh-checkout/content-runtime proofs |
| `scripts/run-ci-contract-required-tests.ts` | Runner for `bun run test:ci-contract`; prints `make test-ci-contract` on failure |
| `Makefile` `test-ci-contract` / `test-verify-contract` / `test-build-contract` / `test-integration` | Maintainer + CI entrypoints; included in `make ci` |
| `.github/workflows/ci.yml` | Linear required path invokes the same story-003 suites after `make test` / reader-facing; runs `make build` before `make test-integration` |
| `src/lib/verify/production-integration-test-paths.ts` | Post-build integration path set for live shell/lifecycle contracts |
| `src/tests/ci/github-actions-make-ci.test.ts` | Asserts Makefile `ci:` order and that the workflow invokes the required make targets |
| `src/tests/ci/github-actions-bun-install.test.ts` | Asserts pinned Bun + `make setup` (frozen lockfile) install posture |

Do **not** restore the Atlas empty-shell skip that exited 0 when `websiteVerifierPatterns` was empty. Verify-contract must run the factory tooling list or fail closed.

Reproduce failing gates locally with:

```sh
make test-ci-contract
make test-verify-contract
make test-build-contract
make test-integration
```

## Story 004: exported-site budget with factory baselines

| Path | Role |
| --- | --- |
| `src/lib/build/exported-site-budget.ts` | Pure measurement/evaluation of `out/` against factory baselines (total size, `_next/static/**/*.js`, `api/search*`); prints reproduction command on failure |
| `src/lib/build/exported-site-budget.test.ts` | Fixture proofs for pass, breach, missing export, and missing JS/search surfaces; included in `make test-build-contract` |
| `scripts/run-exported-site-budget.ts` | CLI for `bun run budget` / `make budget`; measures existing `out/` only (no competing full export) |
| `Makefile` `budget` / `package.json` `budget` | Maintainer + CI/deploy entrypoint; invoked after `make build` in `.github/workflows/ci.yml` and `deploy-pages.yml` |

Factory baselines (calibrated 2026-07-10 UTC against a clean factory export with headroom):

- `maxTotalOutBytes`: 85_000_000
- `maxNextStaticJsBytes`: 3_500_000
- `maxSearchBootstrapBytes`: 4_000_000

The gate never passes via an unconditional skip/`exit 0`. Missing or incomplete
`out/` fails closed. Reproduce locally with:

```sh
make build
make budget
```

## Related

- [ci-deploy-foundation-relevant-files.md](./ci-deploy-foundation-relevant-files.md) — Makefile / workflow contract map
- [delete-atlas-domain-relevant-files.md](./delete-atlas-domain-relevant-files.md) — Atlas deletion history that left these exclusions behind
