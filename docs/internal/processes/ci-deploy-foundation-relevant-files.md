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

- `.github/workflows/ci.yml` — setup → check → test → build → budget → component-coverage
- `.github/workflows/deploy-pages.yml` — setup → check → test → build → budget, then upload `out/`

## Key files

| Path | Role |
| --- | --- |
| `Makefile` | Public local/CI command contract for the stages above |
| `.github/workflows/ci.yml` | Required PR/push verification stages |
| `.github/workflows/deploy-pages.yml` | Main-branch Pages validate + deploy; artifact path `out/` |
| `package.json` | Underlying Bun scripts (`typecheck`, `lint`, `test`, `build:export`) |

## `make build` vs `make build-export`

- `make build` is the CI/Pages contract: `bun run build:export` only. It must
  emit `out/` and must not chain Atlas/Phase-1 route verifiers.
- `make build-export` remains an opt-in maintainer path that runs the same
  export plus Phase 1 export route/search verifiers. CI and deploy-pages call
  `make build`, not `make build-export`.

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

- [operations.md](../../operations.md) — broader deployment posture notes (may still describe legacy deploy.yml naming until retargeted)
