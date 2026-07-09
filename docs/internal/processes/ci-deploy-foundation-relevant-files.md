# CI and GitHub Pages Deploy Foundation Relevant Files

Use these files when aligning local Makefile targets with GitHub Actions CI and
Pages deploy for the rewrite-era foundation pipeline.

## Maintainer command contract

| Stage | Makefile target | Behavior |
| --- | --- | --- |
| Install | `make setup` | `bun install --frozen-lockfile` |
| Static analysis | `make check` | `typecheck` then `lint` (fails if either fails) |
| Tests | `make test` | Existing website test entrypoint |
| Static export / build | `make build` | Runs `bun run build:export` (`NEXT_STATIC_EXPORT=1`); produces `out/` for Pages |
| Exported-site budget | `make budget` | Rewrite-safe gate, or honest transitional skip/pass exiting 0 |
| Component coverage | `make component-coverage` | Rewrite-safe gate, or honest transitional skip/pass exiting 0 |

Workflows that call this contract:

- `.github/workflows/ci.yml` — setup → Playwright Chromium → check → test → build → budget → component-coverage
- `.github/workflows/deploy-pages.yml` — setup → Playwright Chromium → check → test → build → budget, then upload `out/`

Reproduce any failing workflow stage locally with the same `make <target>` after
`make setup` (and `bunx playwright install --with-deps chromium` when website
tests need a browser).

## Key files

| Path | Role |
| --- | --- |
| `Makefile` | Public local/CI command contract for the stages above |
| `.github/workflows/ci.yml` | Required PR/push verification stages (`jobs.verify`) |
| `.github/workflows/deploy-pages.yml` | Main-branch Pages validate + deploy; artifact path `out/` |
| `docs/operations.md` | Maintainer-facing CI/deploy posture aligned to the Makefile contract |
| `package.json` | Underlying Bun scripts (`typecheck`, `lint`, `test`, `build:export`) |

## `make build` vs `make build-export`

- `make build` is the CI/Pages contract: `bun run build:export` only. It must
  emit `out/` and must not chain Atlas/Phase-1 route verifiers.
- Former `make build-export` (export + Phase 1 verifiers) was retired with
  Atlas verifier deletion. CI and deploy-pages call `make build` only.

## Atlas / Phase-1 post-build verifiers (retired)

`rewrite-delete-atlas-domain` deleted Atlas-specific verifier scripts and their
Makefile/`package.json` entrypoints (`verify-atlas-*`, Phase-1 export/route
convergence passes, GQA built-route checks, and related `src/lib/verify`
helpers). Do not reintroduce those targets into `make build`, `make check`,
`make test`, CI, or deploy-pages.

`scripts/run-website-functionality-tests.ts` (plain `make test`) still excludes
Atlas discovery/search/content/feature packages that require deleted Model Atlas
page fixtures. See [delete-atlas-domain-relevant-files.md](./delete-atlas-domain-relevant-files.md).

## Empty `generateStaticParams` under static export

Next.js `output: "export"` fails with a misleading "missing generateStaticParams()"
error when a dynamic route returns `[]`. Use `ensureStaticExportParams` from
`src/lib/build/static-export.ts` to emit a single placeholder param that the page
already `notFound()`s (see localized blog `[slug]`).

## Transitional skip/pass gates

During rewrite foundation, `budget` and `component-coverage` may print a clear
skip message and exit 0 when no rewrite-safe enforcement exists yet. Do not hide
failures from `check`, `test`, or the static-export build behind those skips.

## Related

- [operations.md](../../operations.md) — maintainer CI/deploy posture for the rewrite-era Makefile contract

## Stale inventory tests

`src/tests/ci/github-actions-*.test.ts` still describe the older matrix /
`deploy.yml` / `make build-export` layout. They are excluded from plain
`make test` (`scripts/run-website-functionality-tests.ts` skips `src/tests/ci/`).
Do not treat those inventory tests as the live workflow contract; prefer
command-level verification of the Makefile targets and the YAML files above.

## Repository-facing workflow identity

- Live workflow display names are project-neutral: `CI` and `Deploy GitHub Pages`
  (jobs `verify`, `Canonical validation`, `Deploy to GitHub Pages`).
- The README CI badge must point at
  `portpowered/you-agent-factory-docs` / `.github/workflows/ci.yml`, not the
  legacy `ai-model-reference` repository.
- Maintainer `GITHUB_PAGES_BASE_PATH` examples in README should use the current
  repository name when illustrating project-site export.

## Mergeability: brittle HTML / inventory test drift

When required CI `make test` fails after foundation Makefile work for reasons
outside the story diff, prefer the smallest mergeability fix:

- Align stale nav/tag/blog inventory expectations with current published config
  (for example primary nav `/blog`, published inference tags, current blog title).
- For rendered HTML that asserts contiguous prose containing auto-linked terms
  such as `serving` (`tag.inference` aliases), assert the surrounding fragments
  and the auto-link `href` instead of rewriting customer copy.
- Restore missing internal notes files required by existing tests (for example
  `docs/phase-2-3-reconciliation-implementation-notes.md`) rather than deleting
  the dependency assessment test.
