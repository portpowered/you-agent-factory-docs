# You Agent Factory Docs

You Agent Factory Docs is the public documentation and learning site for You Agent Factory, an open-source platform for turning recurring engineering work into reusable AI agent workflows.

## Local development

Prerequisites: [Bun](https://bun.sh) 1.1 or newer.

From the repository root:

```bash
make setup   # install dependencies with Bun
make check   # content validation, typecheck, and lint
make test    # run tests through bun test
make build   # build the website scaffold
```

To start the local development server after setup:

```bash
bun run dev
```

The site scaffold lives under `src/`. Architecture and planning docs are in `docs/internal/`.
