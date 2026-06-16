# Rich code presentation primitives foundation — relevant files

## Contributor command path

- Root `Makefile` is the shared entrypoint: `setup`, `check`, `test`, `build`.
- `make check` runs `bun run typecheck` then `bun run lint` (Biome).
- `make test` runs `bun test` with happy-dom preloaded from `bunfig.toml`.

## Primitive components

- Reusable docs primitives live under `src/components/docs/primitives/` and are re-exported from `src/components/docs/primitives/index.ts`.
- Shared reviewer labels, example fixture data, and the example route constant live in `src/lib/docs-primitives.ts`.
- The reviewer-visible example surface is `src/components/docs/code-presentation-example.tsx`, rendered from `src/app/docs/examples/code-presentation/page.tsx`.
- Docs chrome is shared through `src/components/docs/docs-shell-layout.tsx`; overview content remains in `src/components/docs/docs-shell.tsx`.
- Primitive styles extend `src/app/globals.css` using the existing landing/docs CSS variables.

## Verification

- Component behavior tests belong in `tests/unit/docs-shell.test.tsx` (example surface headings, accessible labels, tab switching).
- Static export route coverage for the example page belongs in `tests/unit/static-export.test.ts`.
- Manual browser verification follows `docs/internal/processes/manual-qa.md`; serve the export under `/you-agent-factory-docs` and open `/you-agent-factory-docs/docs/examples/code-presentation/`.
