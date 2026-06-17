# You Agent Factory Docs

You Agent Factory Docs is the public documentation and learning site for You Agent Factory, an open-source platform for turning recurring engineering work into reusable AI agent workflows.

## Contributor workflow

From the repository root, `make setup` and `make quality-gate` are the authoritative commands for preparing the scaffold and running the early foundation quality gate. CI uses the same path (see `.github/workflows/ci.yml`), so you do not need alternate `bun` commands to match automation.
For the Phase 8 public-site budget lane, `make budget` is the checked-in review and CI command for the exported homepage/docs route budgets plus the static JavaScript payload budget.

Prerequisites: [Bun](https://bun.sh) 1.1 or newer.

- **`make setup`** — install or refresh dependencies after cloning or when `package.json` changes. Runs `bun install` from the repository root.
- **`make quality-gate`** — run the enforced early foundation gate. Executes typecheck, lint, localization validation, content validation, focused accessibility checks, static export correctness, search-index contract validation, and the remaining foundation unit tests. Fails fast on the first failing check.
- **`make budget`** — build the export, serve `out/` under the GitHub Pages base path on an available localhost port, then enforce the checked-in homepage/docs route budgets plus the `_next/static` JavaScript payload budget.
- **`make validate-search-index`** — run the dedicated generated-search-data contract check. Compares the checked-in `public/search/public-search-index.json` artifact against a fresh projection from normalized localized search documents and fails with regeneration guidance when they drift.

`make check`, `make test`, `make build`, `make budget`, and `make validate-search-index` remain narrower helper targets for partial verification. `make validate-search-index` is the smallest direct maintainer path for search-contract work, while `make quality-gate` reuses the same validation seam for the broader review-ready gate.

**Deferred to later Phase 8 work** (not enforced by the early gate): deploy-on-main automation, Lighthouse performance and accessibility budgets, broad package coverage policy enforcement, launch-content completeness enforcement, and broader route/performance instrumentation beyond the current narrow budget gate.

```bash
make setup         # install dependencies with Bun
make quality-gate  # early foundation gate
make budget        # verify the exported homepage/docs routes and the checked-in static JS budget
make validate-search-index  # verify the generated search contract directly
```

## Local development server

After `make setup`, start the local development server with:

```bash
bun run dev
```

The site scaffold lives under `src/`. Architecture and planning docs are in `docs/internal/`.

The checked-in budget gate intentionally stays narrow for this phase: it measures the exported homepage, the exported docs entry route, and total emitted JavaScript bytes under `out/_next/static`. Broader route coverage, richer bundle analysis, and search-index budgeting remain out of scope until a later expansion.
