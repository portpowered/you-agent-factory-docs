# W17 Localization and Contract-Language Policy — Relevant Files

Use this file when implementing or reviewing Factory-reference localization and
contract-language policy (`refs-w17-localization-contract-language`).

## Ownership fence

W17 owns:

- contract-language policy helpers under `src/lib/i18n/`
- English language-boundary wrappers for canonical contract description prose
- reference chrome / collection message catalogs for `en` / `ja` / `zh-CN` / `vi`
- shipped-locale route manifest + alternate/hreflang updates for reference
  routes (`references` family index + `references/*` children)
- locale-parity and untranslated-identifier behavioral tests

Do **not**:

- redesign primary-nav / sidebar / breadcrumb topology (W15)
- implement Orama item-document projection or search ranking (W16)
- implement `/docs/documentation/*` compatibility migration or migration ledger
  (W18)
- reopen W00–W14 renderer/page ownership or hybrid SSE placement
- patch `node_modules`

## Contract-language policy (story 001)

| Path | Role |
| --- | --- |
| `src/lib/i18n/contract-language-policy.ts` | Code-enforced policy: untranslated identifier kinds, generated-example locale-neutral rule, language-boundary attribute resolver, fail-closed misuse for chrome |
| `src/lib/i18n/contract-language-policy.test.ts` | Observable policy proofs (identifier preservation, boundary attrs, fail-closed chrome misuse, generated-example rules) |
| `src/lib/i18n/contract-language-boundary.tsx` | `EnglishContractDescription` React helper — emits `lang="en"` on non-default locales |
| `src/lib/i18n/contract-language-boundary.test.tsx` | Render proofs for language boundary + fail-closed chrome misuse |
| `src/lib/i18n/contract-description-prose.tsx` | Locale-aware client wrapper — resolves UI locale from prop / `PageMessagesProvider` / default, then applies `EnglishContractDescription` |
| `src/lib/i18n/contract-description-prose.test.tsx` | Locale resolution + boundary proofs with page context |

## Applying language boundaries (story 004)

Wrap package-sourced contract description / summary fields with
`ContractDescriptionProse` (not chrome empty/error copy, not overlay hints).
Representative call sites:

| Surface | Path |
| --- | --- |
| API operation summary/description/params/body/responses | `src/features/references/api/api-operation-section.tsx` |
| API local-server OpenAPI server description | `src/features/references/api/api-local-server-base-url.tsx` |
| CLI short/long description | `src/features/references/cli/CliCommandReference.tsx` |
| MCP tool description | `src/features/references/mcp/McpToolReference.tsx` |
| JS symbol / shared-schema description | `src/features/references/javascript/JavaScript*Reference.tsx` |
| Schema definition + field description | `src/features/references/schema/schema-definition.tsx`, `schema-field-row.tsx`, `shared/SchemaDefinitionEmbed.tsx` |
| Events reconnect / handshake / JSON probe contract fields | `src/features/references/events/event-*.tsx` |

Do **not** wrap schema variant overlay hints (`data-schema-variant-hint`) — those
are display-only and are not contract description prose.

## Reference chrome catalogs (story 002)

| Path | Role |
| --- | --- |
| `src/lib/content/ui-messages.types.ts` → `ReferenceChromeMessages` | Typed chrome catalog shape (filter/status/badge/families/a11y/examples/inventory) |
| `src/content/messages/{en,ja,zh-CN,vi}/common.json` → `referenceChrome` | Shipped catalogs; API/CLI/MCP family tokens stay literal |
| `src/lib/i18n/reference-chrome-labels.ts` | `assertReferenceChromeMessages` / `resolveReferenceChromeMessages` fail-closed |
| `src/lib/i18n/reference-chrome-labels.test.ts` | Locale resolution, untranslated family tokens, fail-closed missing keys |
| `src/lib/i18n/reference-chrome-context.tsx` | Client provider for inventory/badge surfaces |
| `src/app/docs/docs-slug-renderer.tsx` | Passes resolved chrome into `DocsPageProviders` for local docs pages |
| `src/features/references/{cli,mcp,javascript}/*Inventory.tsx` | Resolve inventory empty/error/filter chrome from provider |

## Call-site rule (keep chrome and contract prose separated)

| Text role | Correct path |
| --- | --- |
| `contract-description` | `ContractDescriptionProse` (preferred at reference call sites) / `EnglishContractDescription` (`textRole`) / `resolveEnglishContractLanguageBoundary` |
| `contract-identifier` | `preserveUntranslatedContractIdentifier` (never translate; never chrome catalogs) |
| `generated-example-payload` | Locale-neutral literals/identifiers; do not translate payload bodies |
| `chrome` | Message catalogs only; language-boundary helpers fail closed if misused |

## Existing patterns to extend (do not fork)

| Path | Role |
| --- | --- |
| `src/lib/i18n/locale-routing.ts` | Supported locales (`en`, `ja`, `zh-CN`, `vi`) + `defaultLocale` |
| `src/lib/i18n/explorer-labels.ts` | Fail-closed missing chrome catalog pattern (no silent English fallback) |
| `src/lib/i18n/reference-chrome-labels.ts` | Fail-closed reference chrome catalog assert/resolve + template helper |
| `src/lib/i18n/reference-chrome-context.tsx` | `ReferenceChromeProvider` / optional hook for client inventory surfaces |
| `src/content/messages/{locale}/common.json` → `referenceChrome` | en/ja/zh-CN/vi filter, status, badge, a11y, inventory chrome catalogs |
| `src/features/docs/components/DocsPageProviders.tsx` | Wires `referenceChrome` into local docs pages via provider |
| `src/lib/i18n/route-locale.ts` | `localizedRouteAlternates` (all locales) + `localizedShippedDocsPageAlternates` (fail-closed shipped filter) |
| `src/lib/content/shipped-localized-docs.server.ts` | Derive shipped-locale manifest; includes `references` family-index slug when published + locale messages exist |
| `src/lib/content/generated/shipped-localized-docs.generated.ts` | Client-safe generated artifact for language switcher / gating |
| `src/features/references/shared/*` | Shared chrome surfaces that resolve catalogs via prop or provider |
| `src/features/references/schema/schema-example-display.ts` | Example origin labels ("Generated example") — chrome-localizable; payloads stay English |
| `src/features/references/schema/schema-example-panel.tsx` | Optional `chrome` prop localizes origin/index labels; payload `code` stays locale-neutral |

## Locale parity + untranslated identifiers (story 006)

| Path | Role |
| --- | --- |
| `src/lib/i18n/w17-locale-parity-and-untranslated-identifiers.test.tsx` | Behavioral suite: full chrome leaf parity across en/ja/zh-CN/vi, rendered untranslated identifiers (API/CLI/MCP/JS/schema), language-boundary DOM proofs, generated-example locale-neutral payloads with localized chrome |

Assert observable render/runtime outcomes only — do not scan source trees or enforce nav/search/compat registration inventories.

## Later W17 stories (do not jump ahead unless selected)

_(none — W17 stories 001–006 complete)_

## Locale manifests and alternates (story 005)

| Path | Role |
| --- | --- |
| `src/lib/content/shipped-localized-docs.server.ts` | Derives `references` (family index) + `references/*` child slugs from colocated locale messages |
| `src/lib/i18n/route-locale.ts` → `localizedShippedDocsPageAlternates` | Shared fail-closed hreflang filter for docs/reference routes |
| `src/app/docs/docs-slug-renderer.tsx` | Docs child pages use shipped alternates helper |
| `src/app/(site)/docs/references/page.tsx` + `[locale]` twin | Family index metadata uses shipped alternates (not all-locale advertising) |
| `src/features/layout/language-switcher.tsx` | Unavailable for unshipped `references/*` child locales via generated manifest |

Regenerate with `bun run generate:shipped-localized-docs` after changing family-index or reference page locale messages.

## Collection / page chrome (story 003)

| Path | Role |
| --- | --- |
| `src/content/docs/references/family-index/messages/{en,ja,zh-CN,vi}.json` | Authored family-index page chrome (titles, discoverability cards, freshness copy) for all shipped locales |
| `src/content/docs/references/family-index/load-references-family-index.ts` | Fail-closed locale load — no silent English fallback when a locale message file is missing |
| `src/content/messages/{locale}/common.json` → `referencesIndex` + `browseIndex.referencesSection*` | Collection chrome for section empty states and browse discovery |
| `src/content/messages/{locale}/common.json` → `referenceChrome.badge.package` / `sourceCommit` | Freshness definition-list field labels shared with contract badges |
| `src/app/(site)/site-renderers.tsx` → `renderReferencesFamilyIndexPage` | Resolves reference chrome and injects it into the family index |

W15 collection/nav label keys: consume existing `referencesIndex` / browse `referencesSection*` keys when present; do not redesign primary-nav/sidebar topology.
