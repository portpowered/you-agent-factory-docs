# Rewrite CI and Deploy Foundation — relevant files

Foundation work aligning the Makefile with `.github/workflows/ci.yml` and
`.github/workflows/deploy-pages.yml`.

## Makefile CI contract

| Target | Role |
|--------|------|
| `make setup` | `bun install --frozen-lockfile` — dependency install for local and CI |
| `make check` | `typecheck` + `lint` — static analysis gate |
| `make test` | `bun run test` — website functionality tests |
| `make build` | production build (static export alignment in story 002) |
| `make budget` | transitional pass/skip until exported-site budget is enforced |
| `make component-coverage` | transitional pass/skip until component coverage is enforced |

Workflows call these targets in order; maintainers should reproduce failures
with the same `make` stage name shown in the GitHub Actions step.

## Legacy targets

`make ci`, `make build-export`, and Atlas-specific verifiers remain for
backward compatibility until later stories gate or remove them from required
paths.
