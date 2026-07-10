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

- **active** — still excluded from plain `make test` on purpose (fixture isolation, planner/governance suites, content render suites not yet restored).
- **replaced** — excluded here because a named required suite owns the contract (`make test-build-contract`, `make test-verify-contract`, `make test-integration`, or a pending story-002/005 suite). Every replaced entry must set `ownedBy`.
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
| Layout shell files under `src/tests/layout/` (sidebar/TOC/index) | `make test-integration` today; required layout suite in story 002 |
| `src/tests/search/`, `src/tests/features/`, `src/tests/a11y/`, search UI files | Pending required search/layout/a11y suites (story 002) |
| `src/lib/docs/`, `src/tests/docs/` | `make component-coverage` (story 005) |
| `src/tests/ci/` | Build-contract for Pages/workflow pieces; remaining CI inventory in story 003 |

## Related

- [ci-deploy-foundation-relevant-files.md](./ci-deploy-foundation-relevant-files.md) — Makefile / workflow contract map
- [delete-atlas-domain-relevant-files.md](./delete-atlas-domain-relevant-files.md) — Atlas deletion history that left these exclusions behind
