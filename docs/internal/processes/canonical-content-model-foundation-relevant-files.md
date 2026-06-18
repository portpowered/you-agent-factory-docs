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

- Starter fixtures live under `src/content/{docs,blog,glossary,comparisons,references}/{slug}/{locale}.md` or `{locale}.mdx`.
- `resolveLocaleFileName()` in `src/lib/content/locale-files.ts` is the shared locale-file resolver; `loadDocPage()` prefers `.mdx` over `.md` when both exist for the same locale.
- `loadPublicContentPage()` in `src/lib/content/load-public-content-page.ts` is the shared runtime loader for public starter-content pages outside the docs route tree; it keeps glossary, comparison, and reference pages on the same validated canonical records and locale-projection path as docs pages.
- Directory names map to public content kinds via `STARTER_CONTENT_DIRECTORY_KINDS` in `src/lib/content/starter.ts`.
- Frontmatter is parsed by `parseContentFile()`; `buildMetadataFromStarterContent()` projects author metadata from directory context plus frontmatter.
- `validateStarterContent()` and `loadStarterContentRecords()` validate fixtures into canonical records without docs-shell constant edits.
- Use `loadPublicSearchArtifact()` or `loadLocalizedSearchDocuments()` for pre-route proof when a non-doc content kind has no public page yet. Once a route exists, prefer served static-export or browser-visible assertions for the actual page URL and keep artifact-level tests as supporting coverage.
- To add a new canonical docs page to the shell, create one localized file under `src/content/docs/{slug}/{locale}.mdx` with valid canonical frontmatter (`id`, `title`, `canonicalLocale`, `availableLocales`, `section`, `order`, and publication metadata); the page will flow into route loading and generated navigation without manual sidebar wiring.
- When canonical docs copy changes, regenerate `public/search/public-search-index.json` so the checked-in search artifact stays aligned with the page body and headings that search exposes.
- For one-page launch-content stories that need focused pipeline proof, prefer one page-specific test that asserts the generated nav page, `loadDocPage()` result, localized search document, and checked-in public search entry agree on canonical id, route, locale metadata, and key reader-visible claims.

## Docs shell navigation projection

- `DocsShellNavigationInput` in `src/lib/content/docs-navigation.ts` is the projected docs-shell navigation shape, separate from `CanonicalContentRecord`.
- `projectDocsShellNavigation()` derives section-grouped page labels and hrefs from published doc records.
- `loadDocsShellNavigation()` calls `requireStarterContentRecords()` and throws `StarterContentValidationError` when any starter fixture is invalid.
- `projectSharedShellDocsNavigation()` maps generated navigation into `SharedShell` sidebar groups; `DocsShell` composes `SharedShell` with that projected config.
- `DocsShell` uses `createSharedShellConfigFromMessages(t, { docsNavigationGroups })` so localized shell labels come from the message catalog while docs sidebar items stay projected from canonical records.
- Published doc pages are served from `src/app/docs/[slug]/page.tsx` via `loadDocPage()` and `generateStaticParams()`.
- Published glossary, comparison, and reference pages are served from `src/app/glossary/[slug]/page.tsx`, `src/app/comparisons/[slug]/page.tsx`, and `src/app/references/[slug]/page.tsx`, each with `generateStaticParams()` from `listPublishedContentSlugs()`.

## Tests

- Content validation behavior is covered in `tests/unit/content-validation.test.ts`.
- Starter content loading and validation is covered in `tests/unit/starter-content.test.ts`; invalid fixtures live under `tests/fixtures/starter-content/`.
- Docs navigation projection is covered in `tests/unit/docs-navigation.test.ts`, including blocking generation on invalid fixtures.
- Cross-layer foundation verification (validation → navigation projection, locale readiness, ownership separation) is covered in `tests/unit/canonical-content-foundation.test.ts`.
- Docs shell rendering with generated navigation is covered in `tests/unit/docs-shell.test.tsx`.
- Served static export HTML includes generated docs navigation and follows generated doc links in `tests/unit/static-export.test.ts`.
- Served static export and browser-export tests should be the primary proof for public knowledge routes such as `/glossary/...`, `/comparisons/...`, and `/references/...`, because they verify the same GitHub Pages URLs reviewers open manually.
- `loadDocPage()` locale-file resolution for accepted `.md` and `.mdx` fixtures is covered in `tests/unit/load-doc-page.test.ts`.
- When canonical docs copy changes add or revise reader-visible claims, update both `tests/unit/load-doc-page.test.ts` and `tests/unit/public-search-artifact.test.ts` so route loading and the checked-in search contract prove the same content.
- When a page needs explicit route-render proof in addition to content-pipeline assertions, add one static-export test that derives the page href from `loadDocsShellNavigation()` before fetching the rendered route, rather than asserting against a hand-maintained route inventory.
- Static-export and browser-export tests read ports from `STATIC_EXPORT_TEST_PORT` / `RECONCILED_EXPORT_BROWSER_TEST_PORT` via `tests/helpers/test-port.ts` so nested `make test` invocations from `root-command-path.test.ts` do not collide with the outer suite.
- Prefer asserting observable validation results, projected record fields, generated navigation output, and served HTML—not file inventories, route registries, or internal helper existence.

## Quality checks

- `make check` / `bun run typecheck` + `bun run lint`
- `make test` / `bun test`
