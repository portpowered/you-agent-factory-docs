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
| `src/lib/docs/`, `src/tests/docs/` | `make component-coverage` / `bun run coverage` |
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

Factory baselines (calibrated 2026-07-10 UTC; total-out raised 2026-07-11 UTC
after concurrent launch-extra pages reached ~85.08 MiB against the prior
85 MiB ceiling; raised again 2026-07-11 UTC after concepts taxonomy repair
measured ~99.78 MiB total and ~4.08 MiB search bootstrap on CI; raised again
2026-07-11 UTC after Script/Poller workers documentation pages measured
~106.98 MiB total and ~4.32 MiB search bootstrap on CI; after
packaged-documents/factories (~106.78 MiB / ~4.27 MiB search); after
Agent/Inference workers Program docs (~107.37 MiB / ~4.40 MiB search); and after
Mock workers / Throttling and limits documentation pages measured ~107.22 MiB
total and ~4.42 MiB search bootstrap on CI; raised again 2026-07-11 UTC after
rebasing Mock workers / Throttling onto main with Script/Poller already landed
— combined export measured ~113.75 MiB total and ~4.66 MiB search bootstrap on
CI; raised again 2026-07-11 UTC after rebasing Agent/Inference workers onto
that combined main — six-page export measured ~120.83 MiB total and ~4.97 MiB
search bootstrap on CI (packaged + Mock/Throttling + Script/Poller alone had
measured ~120.24 MiB / ~4.84 MiB); projected eight-page union from those
observed deltas is ~127 MiB / ~5.15 MiB; raised again 2026-07-18 UTC after the
W05 route-family foundation lane measured ~138.27 MiB total on CI (Next static
JS ~2.65 MiB and search bootstrap ~5.16 MiB remained under their limits);
raised again 2026-07-18 UTC after the W13 Worker authored-pages lane measured
~152.37 MiB total and ~5.36 MiB search bootstrap on CI (Next static JS
~2.78 MiB remained under its limit):

- `maxTotalOutBytes`: 160_000_000
- `maxNextStaticJsBytes`: 3_500_000
- `maxSearchBootstrapBytes`: 5_500_000

The gate never passes via an unconditional skip/`exit 0`. Missing or incomplete
`out/` fails closed. Reproduce locally with:

```sh
make build
make budget
```

## Story 005: component and verifier coverage with factory baselines

| Path | Role |
| --- | --- |
| `src/lib/docs/component-manifest.ts` | Factory reusable component + thin-wrapper coverage baselines (90% line targets; factory-ui wrappers) |
| `src/lib/docs/component-coverage-gate.ts` | Pure evaluation of Bun coverage rows against the component manifest |
| `src/lib/verify/verifier-coverage-manifest.ts` | Factory verifier module baselines (server lifecycle) |
| `src/lib/verify/verifier-coverage-gate.ts` | Pure evaluation of Bun coverage rows against the verifier manifest |
| `scripts/component-coverage-gate.ts` | CLI for `bun run coverage` / `make component-coverage` / `make coverage`; prints `make component-coverage` on failure |
| `src/features/docs/components/PageAsset.test.tsx` | Factory fixture-based PageAsset shell coverage (image/graph/table/chart stubs; no Atlas module pages) |
| `Makefile` `component-coverage` / `package.json` `coverage` | Maintainer + CI entrypoint; invoked by `.github/workflows/ci.yml` |

Factory baselines use the factory-green `REUSABLE_COVERAGE_COMPONENTS` set
(typically ≥90% reachable line coverage) plus factory-ui thin wrappers and the
verifier lifecycle module. Atlas-stale phase inventories
(`PHASE_1_SEARCH_COVERAGE_COMPONENTS`, auto-link / related-docs entries) stay
documented but outside the required gate until their unit tests are rewritten.
Deleted Atlas-only coverage fixtures (`static-export-search-surfaces`,
`glossary-shell-description-auto-link`) are not referenced.

The gate never passes via an unconditional skip/`exit 0`. Reproduce locally with:

```sh
make component-coverage
```

## Story 006: reuse one trusted export for read-only probes

| Path | Role |
| --- | --- |
| `src/lib/build/acquire-trusted-project-site-export.ts` | Shared acquisition: reuse matching project-site `out/` or build once; `allowBuild: false` for probe-only posture |
| `src/lib/build/guard-pages-deployed-artifact.ts` | Pages HTTP guard: always acquires with `allowBuild: false`, then loopback-probes home / getting-started / comparing-agent-factories / search / CSS / JS |
| `scripts/guard-pages-deployed-artifact.ts` / `make guard-pages-deployed-artifact` | Deploy-path CLI; prints `make guard-pages-deployed-artifact` on failure; never runs a second `build:export` |
| `scripts/run-exported-site-budget.ts` / `make budget` | Measures existing `out/` only (no competing export) |
| `src/lib/build/required-read-only-export-probes.ts` | Inventory of required read-only probes + forbidden rebuild markers + guard failure report helper |
| `src/lib/build/required-read-only-export-probes.test.ts` | Build-contract proofs that probe CLIs never invoke `build:export` / `runStaticExportBuild`, and the guard acquires with `allowBuild: false` |
| `src/lib/build/project-site-export-consumers.proof.test.ts` | Opt-in export proof (`test:website:export-consumers`) acquires via `acquireTrustedProjectSiteExport` so a matching `out/` is reused |
| `src/lib/build/ensure-export-search-artifacts.ts` | **Deleted** — unused helper that called `runStaticExportBuild` directly and risked competing exports |

Required read-only probes after one trusted `make build`:

1. `make guard-pages-deployed-artifact` — reuse or fail closed (`allowBuild: false`)
2. `make budget` — measure existing `out/` only

Reproduce locally with:

```sh
make build
make guard-pages-deployed-artifact
make budget
```

Do not reintroduce helpers that call `runStaticExportBuild` from read-only probe CLIs. Prefer `acquireTrustedProjectSiteExport({ allowBuild: false })` for HTTP/HTML probes on an already-built artifact.

## Story 007: align make ci / workflows, reproduction commands, green required path

| Path | Role |
| --- | --- |
| `src/lib/ci-required-path.ts` | Shared inventory of `make ci` prerequisites, CI workflow make targets, and shared restored suites |
| `src/lib/ci-required-path.test.ts` | Proves Makefile `ci:` and `.github/workflows/ci.yml` stay aligned on the shared suite set |
| `src/lib/build/build-contract-required-test-paths.ts` | Explicit build-contract path list + `make test-build-contract` reproduction command (include SEO focused tests under `src/lib/seo/` when that lane lands) |
| `scripts/run-build-contract-required-tests.ts` | Runner for `bun run test:build-contract`; prints reproduction command on failure |
| `Makefile` `ci:` | Local full required path: suites through `build` → `test-integration` → `budget` → `component-coverage` → `validate-data` → `linkcheck` |
| `.github/workflows/ci.yml` | Same restored suites as `make ci` (uses `make check` instead of separate lint/typecheck) |
| `.github/workflows/deploy-pages.yml` | Pages-focused subset (check / test / build / guard / budget); not required to mirror the full verify path |
| Gate CLIs (`run-website-functionality-tests`, reader-facing, ci-contract, verify-contract, build-contract, integration, budget, component-coverage, validate-registry, validate-links) | Print `Reproduce locally with: make <target>` on failure |

Aligned required suites (both `make ci` and CI):

`test`, `test-reader-facing`, `test-ci-contract`, `test-verify-contract`, `test-build-contract`, `build`, `test-integration`, `budget`, `component-coverage`, `validate-data`, `linkcheck`

Reproduce the full local required path with:

```sh
make setup
make ci
```

Or reproduce a single failing stage with the printed `make <target>` from that gate's failure output.

## Related

- [ci-deploy-foundation-relevant-files.md](./ci-deploy-foundation-relevant-files.md) — Makefile / workflow contract map
- [delete-atlas-domain-relevant-files.md](./delete-atlas-domain-relevant-files.md) — Atlas deletion history that left these exclusions behind
