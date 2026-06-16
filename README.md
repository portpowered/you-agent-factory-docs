# You Agent Factory Docs

You Agent Factory Docs is the public documentation and learning site for You Agent Factory, an open-source platform for turning recurring engineering work into reusable AI agent workflows.

## Contributor workflow

From the repository root, `make setup` and `make quality-gate` are the authoritative commands for preparing the scaffold and running the early foundation quality gate. CI uses the same path (see `.github/workflows/ci.yml`), so you do not need alternate `bun` commands to match automation.

Prerequisites: [Bun](https://bun.sh) 1.1 or newer.

- **`make setup`** — install or refresh dependencies after cloning or when `package.json` changes. Runs `bun install` from the repository root.
- **`make quality-gate`** — run the enforced early foundation gate. Executes typecheck, lint, localization validation, content validation, focused accessibility checks, static export correctness, and the remaining foundation unit tests. Fails fast on the first failing check.

`make check`, `make test`, and `make build` remain narrower helper targets for partial verification. They are not substitutes for `make quality-gate`.

**Deferred to later Phase 8 work** (not enforced by the early gate): deploy-on-main automation, Lighthouse performance and accessibility budgets, broad package coverage policy enforcement, full search-index validation, launch-content completeness enforcement.

```bash
make setup
make quality-gate
```

## Local development server

After `make setup`, start the local development server with:

```bash
bun run dev
```

The site scaffold lives under `src/`. Architecture and planning docs are in `docs/internal/`.
