# Empty CLI Taxonomy Relevant Files

Use these files when adding or extending Zod page/registry kinds for the
rewrite-era CLI collections (`guides`, `concepts`, `techniques`, `documentation`).

## Kind contract (story 001)

| Path | Role |
| --- | --- |
| `src/lib/content/registry-core.ts` | `registryKindSchema` and `ontologyParticipantKindSchema` accept `guide`, `technique`, `documentation` (plus existing `concept`) |
| `src/lib/content/schemas.ts` | `pageKindSchema` accepts `guide`, `concept`, `technique`, `documentation`; 1:1 record schemas `guideRecordSchema`, `techniqueRecordSchema`, `documentationRecordSchema` |
| `src/lib/content/schemas.test.ts` | Parses valid CLI kinds and rejects unknown page/registry kinds |
| `src/content/messages/{en,ja,vi}/common.json` | `pageKind` labels so `formatPageKind` does not fall back to the raw kind string |
| `src/tests/content/ui-messages.test.ts` | Asserts localized labels for the new page kinds |

## Collection definitions (story 002)

| Path | Role |
| --- | --- |
| `src/lib/docs/collection-definition-contract.ts` | `DocsCollectionId` / kind extracts include `guides`, `concepts`, `techniques`, `documentation` |
| `src/lib/docs/docs-collection-definitions.ts` | Empty CLI definitions with matching `routeSlug` and empty `starterSlugs` |
| `src/lib/docs/docs-collection-definition-inventory-verification.ts` | Allows empty starters for the four CLI collections; asserts kind/route alignment |
| `src/lib/docs/section-collection-index.ts` | Section frontmatter kind → collection id map includes CLI kinds |
| `src/lib/navigation/ai-docs-sidebar-adapter.ts` | Sidebar folder labels for CLI collection ids |
| `src/content/messages/{en,ja,vi}/common.json` | `browseIndex.*` + `*Index` copy for guides/techniques/documentation |
| `src/lib/content/ui-messages.types.ts` | Typed browse/index message keys for the new collections |

Browse hub order (`DOCS_BROWSE_COLLECTION_IDS`) is the four CLI collections.
Live section index routes for guides/concepts/techniques/documentation live
under `src/app/(site)/docs/{id}/page.tsx` and
`src/app/[locale]/docs/{id}/page.tsx`, each calling
`renderSectionCollectionIndexPage` with matching `*Index` message keys.
CLI `*Index.emptyTitle` / `emptyDescription` / `emptyHomeLink` copy must stay
free of Model Atlas / “Browse the Atlas” / “the atlas” product phrasing (and
locale equivalents such as アトラス, Duyệt Atlas, 浏览图谱). Assert those
message fields directly — `DocsIndexEmptyState` still mounts `SearchTrigger`,
which may retain residual Atlas search chrome outside this lane.
`browseIndex.title` / `description` and CLI section
`*SectionTitle` / `*SectionDescription` / `*SectionLinkLabel` keys must follow
the same no-Model-Atlas rule across en/ja/vi/zh-CN.
Sidebar section order may still include residual Atlas folders until a later
sidebar wiring batch; empty CLI collections remain inventory-first so consumers
can look them up without featuring placeholder pages.

## Source slug acceptance (story 003)

| Path | Role |
| --- | --- |
| `src/lib/docs/docs-collection-slug-acceptance.ts` | Route-slug prefix → collection id; `isAcceptedDocsSourceSection` for source allowlists |
| `src/lib/docs/docs-collection-slug-acceptance.test.ts` | CLI prefix acceptance + non-CLI rejection behavior |
| `src/lib/source.ts` | `pageBundleSlug` accepts registered collection route prefixes (including CLI) |
| `src/lib/content/routable-docs-page.ts` | Local page-bundle path check uses the same accepted-section set |
| `src/lib/content/content-paths.ts` | `DOCS_SECTIONS` includes `guides`, `techniques`, `documentation` for derived page dirs |

Slug acceptance keys off `routeSlug` prefixes (`guides/…`, etc.), independent of
frontmatter kind. Do not invent a second hardcoded section allowlist in
`source.ts` / `routable-docs-page.ts`; derive acceptance from collection
definitions via `isAcceptedDocsSourceSection`.

## Page templates (story 004)

| Path | Role |
| --- | --- |
| `docs/templates/guide.{mdx,messages.en.json,assets.json,content.md}` | Production-shaped guide template + sidecars (`kind: guide`, `guide.*` registry ids) |
| `docs/templates/technique.{mdx,messages.en.json,assets.json,content.md}` | Production-shaped technique template + sidecars (`kind: technique`, `technique.*` registry ids) |
| `docs/templates/documentation.{mdx,messages.en.json,assets.json,content.md}` | Production-shaped documentation template + sidecars (`kind: documentation`, `documentation.*` registry ids) |
| `docs/templates/concept.*` | Existing CLI-ready concept template path (preserve; do not invent a parallel concept kind) |
| `src/lib/content/cli-page-templates.test.ts` | Sidecar presence, Zod frontmatter kind validation, isolation-first section order |
| `src/lib/content/page-template-convergence.test.tsx` | Writing-standards convergence for CLI templates (no reader shortcuts / legacy summary keys) |
| `docs/documentation-template.md` | Lists CLI template kinds in the shared template contract |

CLI templates keep structure in MDX, prose keys in messages, and authoring
instructions only in `.content.md`. Baseline guide/technique/documentation
templates ship empty `assets.json` until a later authored page needs media.
Do not author customer page bundles under content roots in this lane.

## Empty content roots (story 005)

| Path | Role |
| --- | --- |
| `src/content/docs/guides/.gitkeep` | Present only while guides docs content root has no authored `page.mdx` bundles; remove when the first page ships |
| `src/content/docs/techniques/` | CLI techniques content root; may contain authored technique page bundles once a first-techniques-section lane ships (remove `.gitkeep` with the first page) |
| `src/content/docs/documentation/` | CLI documentation content root; may contain authored topic page bundles |
| `src/content/registry/guides/.gitkeep` | Present only while guides registry dir has no authored topic records; remove when the first record ships |
| `src/content/registry/techniques/` | CLI techniques registry dir; may contain authored technique records once first pages ship |
| `src/content/registry/documentation/` | CLI documentation registry dir; may contain authored topic records |
| `src/lib/docs/cli-empty-content-roots.ts` | Designates the four CLI collection ids as content-root targets; `EMPTY_CLI_REGISTRY_COLLECTION_DIRS` historically listed guides/techniques while those roots stayed empty — update or retire those empty-root assertions when the first authored guide/technique pages ship (required `make test` excludes `src/lib/docs/`) |
| `src/lib/docs/cli-empty-content-roots.test.ts` | Behavioral checks for empty vs authored CLI roots; keep aligned when first pages land, but do not treat excluded `src/lib/docs/` suites as required CI for page-only lanes — first authored techniques pages update allowlisted `section-indexes.test.tsx` instead |
| `src/lib/content/published-docs-registry-contract.ts` | Includes `documentation` / `guides` / `techniques` in `PUBLISHED_DOCS_SECTIONS` with matching `*PageHref` routing |
| `src/lib/content/content-hrefs.ts` | `documentationPageHref` / `guidePageHref` / `techniquePageHref` for `/docs/<section>/<slug>` |
| `src/lib/content/local-docs-page.ts` | `LOCAL_DOCS_SECTIONS` plus section loaders so `ModulePageProviders` wraps colocated MDX |
| `src/lib/content/technique-page.ts` / `technique-page-load.ts` | First-techniques-collection local MDX loader path (mirror guide loaders) |
| `src/lib/factory/canonical-page-surface-audit.ts` | `registryDirectoryByKind` includes `documentation` (and guide/technique) for routine page-surface audits |

`concepts` remains a designated CLI collection target (empty `starterSlugs`)
for inventory/browse wiring. Authored concept topic pages and
`src/content/registry/concepts/*.json` records are allowed once a B05 (or later)
concept lane ships them—same posture as `documentation` after its first pages.
Do not delete Atlas models/modules/papers/training/systems in empty-taxonomy
lanes; Atlas concept deletion stays owned by `rewrite-delete-atlas-domain`.
Required `make test` already excludes the older empty-concepts SSR proofs under
`src/lib/docs/`, so the first published concept page does not need those suites
rewritten in the page-only lane.

## Wiring that must stay aligned when adding a registry kind

| Path | Role |
| --- | --- |
| `src/lib/content/content-paths.ts` | `REGISTRY_COLLECTIONS` directory names (`guides`, `techniques`, `documentation`) |
| `src/lib/content/registry.ts` | Load directories + schemas for empty collections |
| `src/lib/content/registry-index.ts` | `RegistryRecord` union members |
| `src/lib/content/registry-linking.ts` | `LinkableRegistryRecord` + href/published-page helpers |
| `src/lib/content/registry-runtime-generation.ts` | Runtime generation directory/schema imports |
| `src/lib/content/validate-registry.ts` | `registryKindDirectories` map |
| `src/lib/content/validate-canonical-mdx-prose.ts` | `canonicalDocsPageKinds` for prose isolation |
| `src/lib/content/published-docs-registry-contract.ts` | `PUBLISHED_DOCS_SECTIONS` + `publishedDocsHrefFromEntry` must include CLI route sections (`guides`, `techniques`, `documentation`) once authored pages publish under those prefixes |
| `src/lib/content/content-hrefs.ts` | `guidePageHref` / `techniquePageHref` / `documentationPageHref` for published-docs href resolution |

## Pattern

New CLI page kinds that are 1:1 with registry kinds need all of: Zod page kind,
Zod registry kind, record schema in the discriminated unions, empty registry
collection directory name, UI `pageKind` labels, and linkable/runtime wiring.
Preserve existing `concept` rather than inventing a parallel concept kind.

Empty CLI collection definitions need: collection id + matching route slug,
aligned frontmatter/registry kinds, empty `starterSlugs`, resolvable
browse/index message keys, and inventory verification that permits empty
starters for those four ids only. Default browse hub order is owned by
`rewrite-browse-indexes` via `DOCS_BROWSE_COLLECTION_IDS` /
`DOCS_BROWSE_SECTION_ORDER` (guides, concepts, techniques, documentation).
Keep Atlas collections registered until sibling delete/retarget lanes remove
them, but do not reintroduce them as default browse sections.

Docs source slug acceptance must recognize the four CLI route prefixes via
collection `routeSlug` matching. Keep `source.ts` and
`routable-docs-page.ts` on `isAcceptedDocsSourceSection` so new collection
route slugs do not require a third hardcoded allowlist.

CLI page templates need: `docs/templates/<kind>.mdx` with matching Zod
`kind`, namespaced placeholder `registryId`, empty or optional assets sidecar,
starter messages without reader-shortcut/legacy summary keys, and a
`.content.md` authoring guide that is never pasted into production MDX.
Preserve the existing `concept` template as the CLI concept path.

Empty CLI content roots need: present `src/content/docs/<collection>/` and
matching empty registry dirs for `guides`/`techniques`/`documentation`, empty
`starterSlugs` so indexes/browse do not require featured pages, and no authored
customer page bundles or CLI topic registry JSON in this lane. Designate
`concepts` as a CLI target without deleting Atlas concept content owned by the
sibling delete lane.

## Empty CLI browse + section index end-to-end proof

| Path | Role |
| --- | --- |
| `src/lib/docs/empty-cli-browse-indexes-verification.test.tsx` | Consolidated SSR proof: default browse order, empty starters/content roots, browse hub CLI headings (no Atlas `*-heading` ids), four section-index empty states, Atlas-free browse/empty message fields across en/ja/vi/zh-CN |

Run directly with
`bun test src/lib/docs/empty-cli-browse-indexes-verification.test.tsx`.
`src/lib/docs/` is excluded from required `bun run test` after Atlas deletion.
Assert Atlas-free copy on message fields (`browseIndex.*`, `*Index.empty*`),
not full HTML — `SearchTrigger` may still carry residual Atlas search chrome.
Browser smoke: SSR via `renderBrowseIndexPage` /
`renderSectionCollectionIndexPage`, or `PORT=<unique> bun run start` + curl
`/browse` and `/docs/{guides,concepts,techniques,documentation}` after a build.
