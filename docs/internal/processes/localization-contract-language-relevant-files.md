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
| `src/lib/i18n/route-locale.ts` | Alternate/hreflang helpers (later W17 manifest story) |
| `src/components/references/shared/*` | Reference chrome surfaces that later stories wire to catalogs |
| `src/components/references/schema/schema-example-display.ts` | Example origin labels ("Generated example") — chrome-localizable; payloads stay English |

## Later W17 stories (do not jump ahead unless selected)

- **002** — ship/wire filter, status, badge, empty/error, a11y chrome catalogs
- **003** — collection/page chrome under fail-closed shipping
- **004** — apply `EnglishContractDescription` on rendered contract descriptions
- **005** — locale manifests + alternates for shipped reference routes only
- **006** — locale parity + untranslated-identifier behavioral suite
