# You Agent Factory Docs

You Agent Factory Docs is the public documentation and learning site for You Agent Factory, an open-source platform for turning recurring engineering work into reusable AI agent workflows.

## Contributor workflow

From the repository root, pull requests visibly gate on `make setup`, `make check`, `make test`, and `make build` in that order (see `.github/workflows/ci.yml`). Review automation then keeps `make quality-gate`, `make budget`, and `make component-coverage` as supplemental checks on the same root `Makefile` path, so contributors do not need alternate `bun` commands to match CI.
For the Phase 8 public-site budget lane, `make budget` remains the checked-in review and CI command for the exported homepage/docs route budgets plus the static JavaScript payload budget.
`make quality-gate` remains a broader local-only foundation sweep. It intentionally goes beyond pull request validation by adding localization, content, accessibility, and static-export validation on top of the narrower PR merge gate, so when it appears in review automation it supplements rather than replaces the required parity path.

Prerequisites: [Bun](https://bun.sh) 1.1 or newer.

- **`make setup`** — install or refresh dependencies after cloning or when `package.json` changes. Runs `bun install` from the repository root.
- **`make check`** — run the first reviewer-visible verification step for pull requests. Executes typecheck and lint through the root `Makefile`.
- **`make test`** — run the automated test suite through the same root target pull-request CI uses.
- **`make build`** — produce the production static export and fail if the expected `out/` directory is missing afterward.
- **`make quality-gate`** — run the enforced early foundation gate as a supplemental review-ready check. Executes typecheck, lint, localization validation, content validation, focused accessibility checks, static export correctness, search-index contract validation, and the remaining foundation unit tests. Fails fast on the first failing check.
- **`make budget`** — build the export, serve `out/` under the GitHub Pages base path on an available localhost port, then enforce the checked-in homepage/docs route budgets plus the `_next/static` JavaScript payload budget.
- **`make component-coverage`** — enforce the checked-in practical component-package coverage threshold on the same root command surface used by pull-request CI.
- **`make validate-search-index`** — run the dedicated generated-search-data contract check. Compares the checked-in `public/search/public-search-index.json` artifact against a fresh projection from normalized localized search documents and fails with regeneration guidance when they drift.

`make setup`, `make check`, `make test`, and `make build` are the required reviewer-visible pull-request validation path. `make quality-gate`, `make budget`, and `make component-coverage` stay on that same root command surface as supplemental PR checks and local review helpers; they do not replace the required top-level path. `make validate-search-index` remains the smallest direct maintainer path for search-contract work, while `make quality-gate` reuses the same validation seam for the broader review-ready gate.

**Deferred to later Phase 8 work** (not enforced by the early gate): deploy-on-main automation, Lighthouse performance and accessibility budgets, broad package coverage policy enforcement, launch-content completeness enforcement, and broader route/performance instrumentation beyond the current narrow budget gate.

```bash
make setup               # install dependencies with Bun
make check               # typecheck and lint through the PR-visible root path
make test                # run the automated suite through the PR-visible root path
make build               # produce the static export through the PR-visible root path
make quality-gate        # supplemental early foundation gate
make budget              # verify the exported homepage/docs routes and the checked-in static JS budget
make component-coverage  # enforce the practical component-package coverage threshold
make validate-search-index  # verify the generated search contract directly
```

## Local development server

After `make setup`, start the local development server with:

```bash
bun run dev
```

The site scaffold lives under `src/`. Architecture and planning docs are in `docs/internal/`.

The checked-in budget gate intentionally stays narrow for this phase: it measures the exported homepage, the exported docs entry route, and total emitted JavaScript bytes under `out/_next/static`. Broader route coverage, richer bundle analysis, and search-index budgeting remain out of scope until a later expansion.
