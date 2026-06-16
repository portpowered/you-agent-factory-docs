# Localization message foundation — relevant files

## Locale registry and canonical message path

- Shared localization config lives under `src/localization/config/`:
  - `default-locale.ts` — single default locale (`en`) for fallback and normalization.
  - `locales.ts` — validated `SUPPORTED_LOCALES` registry with display metadata.
- Locale input for the shared message path resolves through `src/localization/lib/resolve-locale.ts` (`resolveLocale`). Unsupported or empty inputs normalize to the default locale instead of ad hoc behavior.
- Canonical page identities for later content-variant localization are created with `src/localization/lib/canonical-page.ts` (`createCanonicalPageIdentity`). Routes must stay free of locale prefixes such as `/en/docs`.
- Public imports are re-exported from `src/localization/index.ts`.
- Unit coverage for the registry and resolution path lives in `tests/unit/locale-registry.test.ts`.
- Stable route constants remain in `src/lib/site.ts` (`DOCS_ENTRY_ROUTE`); localization does not introduce locale-prefixed route trees.

## Verification

- `make check` — typecheck and Biome lint.
- `make test` — includes locale registry tests via `bun test`.
- Shell message wiring and provider integration are follow-on stories; `src/lib/shell.ts` literals remain until story 002.
