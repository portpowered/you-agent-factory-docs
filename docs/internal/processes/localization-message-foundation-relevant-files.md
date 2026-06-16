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

## Shared shell message provider wiring

- Default-locale shared shell messages live in `src/localization/messages/en.ts` with typed keys in `src/types/localization.ts`.
- Message lookup for shell surfaces uses `src/localization/lib/resolve-message.ts` (`resolveMessage`).
- Provider wiring lives in `src/localization/context/localization-context.tsx` (`LocalizationProvider`); the root layout wraps app children with it.
- Shell components consume messages through `useMessages()` from `src/localization/hooks/use-messages.ts` instead of `src/lib/shell.ts` literals.
- `src/lib/shell.ts` retains non-localized external link constants such as `GITHUB_REPO_URL`.
- Component tests wrap shells with `tests/helpers/render-with-localization.tsx`.

## Verification

- `make check` — typecheck and Biome lint.
- `make test` — includes locale registry and shared shell message tests via `bun test`.
- Browser verification: build static export and confirm homepage and `/docs` render shared shell text from the message catalog.
