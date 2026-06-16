# You Agent Factory Docs

You Agent Factory Docs is the public documentation and learning site for You Agent Factory, an open-source platform for turning recurring engineering work into reusable AI agent workflows.

## Contributor workflow

From the repository root, `make setup`, `make check`, `make test`, and `make build` are the authoritative commands for preparing the scaffold, running verification, executing tests, and proving the static export build. CI uses the same targets (see `.github/workflows/ci.yml`), so you do not need alternate `bun` commands to match automation.

Prerequisites: [Bun](https://bun.sh) 1.1 or newer.

Use each command when you need its observable outcome:

- **`make setup`** — install or refresh dependencies after cloning or when `package.json` changes. Runs `bun install` from the repository root.
- **`make check`** — surface typecheck and lint failures before commit or when reproducing CI verification failures. Runs `bun run typecheck` then `bun run lint`; the first failure stops the command.
- **`make test`** — run the automated test suite. Delegates to `bun test` from the repository root.
- **`make build`** — verify the static production build succeeds. Runs `bun run build` and fails if the export directory `out/` is missing afterward.

```bash
make setup
make check
make test
make build
```

## Local development server

After `make setup`, start the local development server with:

```bash
bun run dev
```

The site scaffold lives under `src/`. Architecture and planning docs are in `docs/internal/`.
