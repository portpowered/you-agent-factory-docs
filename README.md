# You Agent Factory Docs

You Agent Factory Docs is the public documentation and learning site for You Agent Factory, an open-source platform for turning recurring engineering work into reusable AI agent workflows.

## Local development

Prerequisites: [Bun](https://bun.sh) 1.1 or newer.

From the repository root:

```bash
make setup   # install dependencies with Bun
make check   # typecheck and lint
make test    # run tests through bun test
make build   # build the website scaffold
make budget  # verify the exported homepage/docs routes and the checked-in static JS budget
```

To start the local development server after setup:

```bash
bun run dev
```

The site scaffold lives under `src/`. Architecture and planning docs are in `docs/internal/`.

The checked-in budget gate intentionally stays narrow for this phase: it measures the exported homepage, the exported docs entry route, and total emitted JavaScript bytes under `out/_next/static`. Broader route coverage, richer bundle analysis, and search-index budgeting remain out of scope until a later expansion.
