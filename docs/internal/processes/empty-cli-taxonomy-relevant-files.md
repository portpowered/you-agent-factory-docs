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
