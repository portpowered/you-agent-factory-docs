# Canonical content model foundation — relevant files

## Canonical content module

- Canonical content types and validation live under `src/lib/content/`, separate from docs-shell UI copy in `src/lib/shell.ts`.
- Import the public API from `@/lib/content` (re-exported in `src/lib/content/index.ts`).
- `CanonicalContentRecord` is the durable source-of-truth shape; projected docs-shell navigation state is built in later stories.
- Author metadata enters through `ContentMetadataInput`; call `validateContentMetadata()` to accept or reject with structured `{ field, message }` errors.
- Canonical ids follow `{kind}/{slug}` (for example `doc/getting-started`) and must agree with `kind` and `slug`.
- Route paths are derived per kind (`/docs/...`, `/blog/...`, `/glossary/...`, `/comparisons/...`, `/references/...`).
- Locale tags use BCP 47-style `en` or `en-US`; `canonicalLocale` must appear in `availableLocales`.

## Starter content

- Starter fixtures live under `src/content/{docs,blog,glossary,comparisons,references}/{slug}/{locale}.mdx`.
- Directory names map to public content kinds via `STARTER_CONTENT_DIRECTORY_KINDS` in `src/lib/content/starter.ts`.
- Frontmatter is parsed by `parseContentFile()`; `buildMetadataFromStarterContent()` projects author metadata from directory context plus frontmatter.
- `validateStarterContent()` and `loadStarterContentRecords()` validate fixtures into canonical records without docs-shell constant edits.

## Docs shell navigation projection

- `DocsShellNavigationInput` in `src/lib/content/docs-navigation.ts` is the projected docs-shell navigation shape, separate from `CanonicalContentRecord`.
- `projectDocsShellNavigation()` derives section-grouped page labels and hrefs from published doc records.
- `loadDocsShellNavigation()` loads starter fixtures and projects navigation for the docs shell page.
- `DocsShell` in `src/components/docs/docs-shell.tsx` consumes generated navigation input via props; avoid hand-maintained nav entry lists in shell constants.

## Tests

- Content validation behavior is covered in `tests/unit/content-validation.test.ts`.
- Starter content loading and validation is covered in `tests/unit/starter-content.test.ts`.
- Docs navigation projection is covered in `tests/unit/docs-navigation.test.ts`.
- Docs shell rendering with generated navigation is covered in `tests/unit/docs-shell.test.tsx`.
- Served static export HTML includes generated docs navigation in `tests/unit/static-export.test.ts`.
- Prefer asserting observable validation results and projected record fields, not file inventories or internal helper existence.

## Quality checks

- `make check` / `bun run typecheck` + `bun run lint`
- `make test` / `bun test`
