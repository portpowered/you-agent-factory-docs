# Canonical content model foundation — relevant files

## Reviewer notes

### Prerequisites

- **reconcile-bootstrap-foundation-baseline** (merged) provides the reconciled Next.js scaffold, shared shell components, and local/CI command parity this lane builds on.
- **bootstrap-static-export-foundation** and **shared-shell-behavior-foundation** establish static export, base-path routing, and docs-shell framing that canonical navigation now consumes.

### Ownership boundary

- **`CanonicalContentRecord`** (`src/lib/content/types.ts`) is the durable source of truth for canonical identity, content kind, route identity, locale metadata, publication status, tags, and navigation metadata.
- **`DocsShellNavigationInput`** (`src/lib/content/docs-navigation.ts`) is projected docs-shell UI state derived from canonical records. It includes section grouping and page labels/hrefs for the first docs navigation behavior only.
- Author metadata enters through starter fixtures or `ContentMetadataInput`, is validated by `validateContentMetadata()` / `validateStarterContent()`, and is projected into navigation by `projectDocsShellNavigation()` without editing hand-maintained shell nav constants.
- Later lanes can extend canonical records for localized search documents, breadcrumbs, previous-next links, and raw markdown access without renaming or overloading the projected navigation shape.

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
- `loadDocsShellNavigation()` calls `requireStarterContentRecords()` and throws `StarterContentValidationError` when any starter fixture is invalid.
- `projectSharedShellDocsNavigation()` maps generated navigation into `SharedShell` sidebar groups; `DocsShell` composes `SharedShell` with that projected config.
- Published doc pages are served from `src/app/docs/[slug]/page.tsx` via `loadDocPage()` and `generateStaticParams()`.

## Tests

- Content validation behavior is covered in `tests/unit/content-validation.test.ts`.
- Starter content loading and validation is covered in `tests/unit/starter-content.test.ts`; invalid fixtures live under `tests/fixtures/starter-content/`.
- Docs navigation projection is covered in `tests/unit/docs-navigation.test.ts`, including blocking generation on invalid fixtures.
- Cross-layer foundation verification (validation → navigation projection, locale readiness, ownership separation) is covered in `tests/unit/canonical-content-foundation.test.ts`.
- Docs shell rendering with generated navigation is covered in `tests/unit/docs-shell.test.tsx`.
- Served static export HTML includes generated docs navigation and follows generated doc links in `tests/unit/static-export.test.ts`.
- Prefer asserting observable validation results, projected record fields, generated navigation output, and served HTML—not file inventories, route registries, or internal helper existence.

## Quality checks

- `make check` / `bun run typecheck` + `bun run lint`
- `make test` / `bun test`
