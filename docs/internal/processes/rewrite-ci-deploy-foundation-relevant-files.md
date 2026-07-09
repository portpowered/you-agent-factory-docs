# Rewrite CI and Deploy Foundation — relevant files

Foundation work aligning the Makefile with `.github/workflows/ci.yml` and
`.github/workflows/deploy-pages.yml`.

## Makefile CI contract

| Target | Role |
|--------|------|
| `make setup` | `bun install --frozen-lockfile` — dependency install for local and CI |
| `make check` | `typecheck` + `lint` — static analysis gate |
| `make test` | `bun run test` — website functionality tests |
| `make build` | `bun run build:export` then `scripts/verify-static-export-out-dir.ts` — emits `out/` for GitHub Pages |
| `make budget` | transitional pass/skip until exported-site budget is enforced |
| `make component-coverage` | transitional pass/skip until component coverage is enforced |

Workflows call these targets in order; maintainers should reproduce failures
with the same `make` stage name shown in the GitHub Actions step.

## Static export verification

- `src/lib/build/verify-static-export-out-dir.ts` — shared `out/` presence check
- `scripts/verify-static-export-out-dir.ts` — Makefile gate after `build:export`
- `src/tests/build/make-build-static-export-contract.test.ts` — proves `make build` emits `out/`

## Legacy / opt-in targets

`make ci` and `make build-export` (export route verifiers on top of `make build`)
remain for backward compatibility. Atlas `.next` verifiers moved to
`make build-app-with-atlas-verifiers` (story 003 will further gate required paths).
