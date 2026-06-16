# Canonical content model foundation — relevant files

## Canonical content module

- Canonical content types and validation live under `src/lib/content/`, separate from docs-shell UI copy in `src/lib/shell.ts`.
- Import the public API from `@/lib/content` (re-exported in `src/lib/content/index.ts`).
- `CanonicalContentRecord` is the durable source-of-truth shape; projected docs-shell navigation state is built in later stories.
- Author metadata enters through `ContentMetadataInput`; call `validateContentMetadata()` to accept or reject with structured `{ field, message }` errors.
- Canonical ids follow `{kind}/{slug}` (for example `doc/getting-started`) and must agree with `kind` and `slug`.
- Route paths are derived per kind (`/docs/...`, `/blog/...`, `/glossary/...`, `/comparisons/...`, `/references/...`).
- Locale tags use BCP 47-style `en` or `en-US`; `canonicalLocale` must appear in `availableLocales`.

## Tests

- Content validation behavior is covered in `tests/unit/content-validation.test.ts`.
- Prefer asserting observable validation results and projected record fields, not file inventories or internal helper existence.

## Quality checks

- `make check` / `bun run typecheck` + `bun run lint`
- `make test` / `bun test`
