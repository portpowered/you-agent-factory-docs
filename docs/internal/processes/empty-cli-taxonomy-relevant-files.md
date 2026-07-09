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

Browse hub order (`DOCS_BROWSE_COLLECTION_IDS`) and sidebar section order
(`DOCS_SIDEBAR_SECTION_ORDER`) stay Atlas-shaped until a later browse/sidebar
wiring batch; empty CLI collections are inventory-first so consumers can look
them up without featuring placeholder pages.

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

## Pattern

New CLI page kinds that are 1:1 with registry kinds need all of: Zod page kind,
Zod registry kind, record schema in the discriminated unions, empty registry
collection directory name, UI `pageKind` labels, and linkable/runtime wiring.
Preserve existing `concept` rather than inventing a parallel concept kind.

Empty CLI collection definitions need: collection id + matching route slug,
aligned frontmatter/registry kinds, empty `starterSlugs`, resolvable
browse/index message keys, and inventory verification that permits empty
starters for those four ids only. Do not force empty CLI collections into
browse/sidebar section order until a dedicated wiring story owns that surface.

Docs source slug acceptance must recognize the four CLI route prefixes via
collection `routeSlug` matching. Keep `source.ts` and
`routable-docs-page.ts` on `isAcceptedDocsSourceSection` so new collection
route slugs do not require a third hardcoded allowlist.
