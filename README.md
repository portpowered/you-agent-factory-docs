# you-agent-factory docs

[![CI](https://github.com/portpowered/you-agent-factory-docs/actions/workflows/ci.yml/badge.svg)](https://github.com/portpowered/you-agent-factory-docs/actions/workflows/ci.yml)

Static documentation site for the
[you-agent-factory](https://github.com/portpowered/you-agent-factory) CLI and
agent-factory workflow system.

Readers use this site to install and run the CLI, follow use-case guides, look up
concepts and techniques, compare approaches, and read news/blog posts.

This repository is **not** the retired Model Atlas / Learn Language Models
attention-reference product. It is also not a benchmark leaderboard or a
paper-download mirror.

## Product shape

The intended site covers:

* **Install / run** — get the CLI, run named workflows, understand the factory loop
* **Guides** — loops, Cursor dynamic workflows, write-review loops, and related use cases
* **Concepts and techniques** — harness, loop, worktree, ralph, planner-executor, and peers
* **Documentation** — configuration, workstations, harness support, CLI, MCP, API
* **Comparisons and news** — listicles, examinations, and blog posts

Content collections for the rewrite era are `guides`, `concepts`, `techniques`,
and `documentation`, plus glossary and blog surfaces.

## Website stack

The app is a statically rendered Next.js App Router site using:

* Fumadocs for MDX documentation routes and source loading
* Orama through Fumadocs for search
* React Flow, Recharts, Tailwind, and shadcn/ui for interactive and UI surfaces
* Bun for package scripts and tests
* Biome for linting and formatting

Content is split into page structure, localized messages, page-local assets, and
structured registry records:

```txt
src/content/docs/**/page.mdx        # page structure
src/content/docs/**/messages/*.json # localized text
src/content/docs/**/assets.json     # page-local asset references
src/content/registry/**/*.json      # structured records for search and relations
```

## Important Docs

Start here for rewrite planning and contributor orientation.

Planner rewrite working set (`docs/temp/` is gitignored local planner state; create
or refresh these paths in a checkout when doing rewrite planning):

* [docs/temp/customer-ask.md](./docs/temp/customer-ask.md) — live customer ask
* [docs/temp/big-docs](./docs/temp/big-docs) — durable rewrite planning artifacts

Committed orientation docs:

* [AGENTS.md](./AGENTS.md) — agent and planner operating rules
* [docs/documentation-site-pages-needed.md](./docs/documentation-site-pages-needed.md) — page inventory
* [docs/architecture.md](./docs/architecture.md)
* [docs/site-fundamentals.md](./docs/site-fundamentals.md)
* [docs/data-model.md](./docs/data-model.md)
* [docs/documentation-template.md](./docs/documentation-template.md)
* [factory/docs/standards/docs-writing-standards.md](./factory/docs/standards/docs-writing-standards.md)
* [docs/operations.md](./docs/operations.md) — CI/deploy posture and maintainer runbooks ([release](./docs/operations.md#release-process), [SHA proof](./docs/operations.md#commit-sha-traceability), [smoke](./docs/operations.md#read-only-post-deploy-checks), [rollback](./docs/operations.md#rollback-process), [incidents](./docs/operations.md#incident-diagnosis), [status](./docs/operations.md#deployment-status-expectations), [PR preview](./docs/operations.md#pr-preview-policy))

## Local Development

Install dependencies and start the docs site:

```sh
bun install
make dev
```

`make setup` is the frozen-lockfile install path used by CI (`bun install --frozen-lockfile`).
`make dev` runs the same Next.js entrypoint as `bun run dev`. Open
`http://localhost:3000` for the home page.

## Quality Gates

Local maintainers and GitHub Actions share one Makefile contract (owned by the
B00 CI/deploy foundation lane — do not edit `Makefile` or `.github/workflows/*`
from meta-doc rewrite work):

| Stage | Command | Role |
| --- | --- | --- |
| Install | `make setup` | `bun install --frozen-lockfile` |
| Static analysis | `make check` | typecheck then lint |
| Tests | `make test` | website functionality suite |
| Reader-facing | `make test-reader-facing` | search / layout / a11y contracts |
| CI / verify / build contracts | `make test-ci-contract` / `test-verify-contract` / `test-build-contract` | workflow alignment + tooling contracts |
| Static export | `make build` | `bun run build:export` → `out/` |
| Integration | `make test-integration` | live shell / lifecycle contracts on trusted `out/` |
| Budget | `make budget` | measures existing `out/` against factory baselines (fails closed) |
| Component coverage | `make component-coverage` | factory component + verifier coverage baselines |
| Data / links | `make validate-data` / `make linkcheck` | registry + internal link validation |
| Full local path | `make ci` | same required suites as CI `verify` |

Fresh checkout proof:

```sh
make setup
make ci
```

`.github/workflows/ci.yml` runs the aligned required path (`make setup` →
`check` → `test` → `test-reader-facing` → `test-ci-contract` →
`test-verify-contract` → `test-build-contract` → `build` → `test-integration` →
`budget` → `component-coverage` → `validate-data` → `linkcheck`) on pull
requests and pushes — the same suites as `make ci` (see
`src/lib/ci-required-path.ts`).
`.github/workflows/deploy-pages.yml` validates with a Pages-focused subset on
`main` (check / test / build / guard / budget), then publishes `out/` to GitHub
Pages.

Retired Atlas / Phase 1 route-verifier sprawl is **not** part of the required
contributor path. Prefer `make ci` (or the individual Makefile stages above).

See [docs/operations.md](./docs/operations.md) and
[docs/internal/processes/ci-deploy-foundation-relevant-files.md](./docs/internal/processes/ci-deploy-foundation-relevant-files.md)
for deploy posture, Pages settings, and required-gate behavior. Contributor
and maintainer entry points for the live runbooks:

| Concern | Runbook |
| --- | --- |
| Release on `main` | [Release process](./docs/operations.md#release-process) |
| Prove which SHA is live | [Commit-SHA traceability](./docs/operations.md#commit-sha-traceability) |
| Read-only live-site smoke | [Read-only post-deploy checks](./docs/operations.md#read-only-post-deploy-checks) |
| Non-destructive recovery | [Rollback process](./docs/operations.md#rollback-process) |
| Incident diagnosis | [Incident diagnosis](./docs/operations.md#incident-diagnosis) |
| Checks on `main` vs PRs | [Deployment status expectations](./docs/operations.md#deployment-status-expectations) |
| Hosted PR previews | [PR preview policy](./docs/operations.md#pr-preview-policy) (**Deferred**) |

Also linked from
[docs/contributors/CONTRIBUTING.md](./docs/contributors/CONTRIBUTING.md#operations-runbooks).

### Useful individual targets

```sh
make setup              # bun install --frozen-lockfile
make check              # typecheck then lint
make test               # website functionality suite
make build              # static export to out/
make budget             # exported-site budget gate (measures out/; fails closed)
make component-coverage # component + verifier coverage gate
make test-reader-facing # search / layout / a11y contracts
make test-integration   # production-integration path on trusted out/
make ci                 # full local required path (aligned with CI verify)
make lint               # Biome check
make format             # Biome format --write
make typecheck          # tsc --noEmit (after content-runtime prep)
make validate-data      # registry and content validation
make linkcheck          # internal docs link validation
```

You do not need to run `fumadocs-mdx` manually. Supported command scripts run
`prepare:content-runtime` and invoke `fumadocs-mdx` when `.source/` is required.

## Static export (GitHub Pages)

`make build` runs `bun run build:export` (`NEXT_STATIC_EXPORT=1`) and emits
`out/`. CI calls plain `make build` for verification. Deploy-pages sets
`GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` on its build step so the
uploaded `out/` matches the project site at
`https://portpowered.github.io/you-agent-factory-docs`.

Reproduce the project-site artifact locally with the same command deploy-pages
uses:

```sh
GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs make build
```

When unset, export builds keep `/` as the base for local preview and user/org
root Pages sites. The project site requires the repository prefix.

## Docs authoring

Canonical page bundles share one page-spec generation path. Templates live in
`docs/templates/`; see [docs/documentation-template.md](./docs/documentation-template.md).

```sh
bun run generate:page-bundle -- --spec page-specs/my-page.json --dry-run
bun run generate:page-bundle -- --spec page-specs/my-page.json
```

For content pull requests, the supported local review-readiness proof is:

```sh
bun run doctor:content-pr
```

Use `make check` / `make test` / `make build` for the repository quality gate.

## Agent Factory Loop

This docs repo is built and maintained with an agent factory called `you`.
**Only the PLANNER / meta-planner role should use `you`.** Non-planners must not
start the workflow runtime.

Figure out how `you` works with `you -h` and `you docs agents`. Do not run `you`
directly unless you are the planner.

Factory loop docs:

* [factory/workstations/ideafy/AGENTS.md](./factory/workstations/ideafy/AGENTS.md)
* [factory/factory.json](./factory/factory.json)
* [factory/docs/batch-inputs.md](./factory/docs/batch-inputs.md)

Rewrite planning state for this product lives under:

```txt
docs/temp/customer-ask.md
docs/temp/big-docs/
```
