# W17 Localization and Contract-Language Policy — Relevant Files

Use this file when implementing or reviewing Factory-reference localization and
contract-language policy (`refs-w17-localization-contract-language`).

## Ownership fence

W17 owns:

- contract-language policy helpers under `src/lib/i18n/`
- English language-boundary wrappers for canonical contract description prose
- reference chrome / collection message catalogs for `en` / `ja` / `zh-CN` / `vi`
  (later stories)
- shipped-locale route manifest + alternate/hreflang updates for reference
  routes (later stories)
- locale-parity and untranslated-identifier behavioral tests (later stories)

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

## Reference chrome catalogs (story 002)

| Path | Role |
| --- | --- |
| `src/lib/content/ui-messages.types.ts` → `ReferenceChromeMessages` | Typed chrome catalog shape (filter/status/badge/families/a11y/examples/inventory) |
| `src/content/messages/{en,ja,zh-CN,vi}/common.json` → `referenceChrome` | Shipped catalogs; API/CLI/MCP family tokens stay literal |
| `src/lib/i18n/reference-chrome-labels.ts` | `assertReferenceChromeMessages` / `resolveReferenceChromeMessages` fail-closed |
| `src/lib/i18n/reference-chrome-labels.test.ts` | Locale resolution, untranslated family tokens, fail-closed missing keys |
| `src/lib/i18n/reference-chrome-context.tsx` | Client provider for inventory/badge surfaces |
| `src/app/docs/docs-slug-renderer.tsx` | Passes resolved chrome into `DocsPageProviders` for local docs pages |
| `src/components/references/{cli,mcp,javascript}/*Inventory.tsx` | Resolve inventory empty/error/filter chrome from provider |

## Call-site rule (keep chrome and contract prose separated)

| Text role | Correct path |
| --- | --- |
| `contract-description` | `EnglishContractDescription` (`textRole`) / `resolveEnglishContractLanguageBoundary` |
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
| `src/lib/i18n/route-locale.ts` | Alternate/hreflang helpers (later W17 manifest story) |
| `src/components/references/shared/*` | Shared chrome surfaces that resolve catalogs via prop or provider |
| `src/components/references/schema/schema-example-display.ts` | Example origin labels ("Generated example") — chrome-localizable; payloads stay English |

## Later W17 stories (do not jump ahead unless selected)

- **003** — collection/page chrome under fail-closed shipping
- **004** — apply `EnglishContractDescription` on rendered contract descriptions
- **005** — locale manifests + alternates for shipped reference routes only
- **006** — locale parity + untranslated-identifier behavioral suite

## Collection / page chrome (story 003)

| Path | Role |
| --- | --- |
| `src/content/docs/references/family-index/messages/{en,ja,zh-CN,vi}.json` | Authored family-index page chrome (titles, discoverability cards, freshness copy) for all shipped locales |
| `src/content/docs/references/family-index/load-references-family-index.ts` | Fail-closed locale load — no silent English fallback when a locale message file is missing |
| `src/content/messages/{locale}/common.json` → `referencesIndex` + `browseIndex.referencesSection*` | Collection chrome for section empty states and browse discovery |
| `src/content/messages/{locale}/common.json` → `referenceChrome.badge.package` / `sourceCommit` | Freshness definition-list field labels shared with contract badges |
| `src/app/(site)/site-renderers.tsx` → `renderReferencesFamilyIndexPage` | Resolves reference chrome and injects it into the family index |

W15 collection/nav label keys: consume existing `referencesIndex` / browse `referencesSection*` keys when present; do not redesign primary-nav/sidebar topology.
