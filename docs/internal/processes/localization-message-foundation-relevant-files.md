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
- `createSharedShellConfigFromMessages()` in `src/localization/lib/create-shared-shell-config.ts` maps message lookup into `SharedShellConfig` for `LandingShell` and `DocsShell`.
- `src/lib/shell.ts` retains non-localized external link constants such as `GITHUB_REPO_URL`.
- Component tests wrap shells with `tests/helpers/render-with-localization.tsx`.
- Pass `{ locale: "fr" }` to `renderWithLocalization` to exercise non-default locale fallback in component tests.

## Message fallback lookup

- Secondary locale catalogs may be partial; missing keys resolve through `resolveMessageWithFallback()` in `src/localization/lib/resolve-message.ts`.
- `LocalizationProvider` exposes both the active locale catalog and `fallbackMessages` (default locale catalog) to `useMessages()`.
- Partial French catalog for fallback coverage lives in `src/localization/messages/fr.ts`; unregistered secondary locales receive an empty overlay and fall back entirely to the default catalog.
- Fallback unit coverage: `tests/unit/message-fallback.test.ts`; shell integration: `tests/unit/shell-fallback.test.tsx`.

## Shared shell message validation

- Validation logic lives in `src/localization/lib/validate-messages.ts`.
- `validateDefaultLocaleMessages()` ensures the default locale catalog defines every required shared shell key with non-empty strings.
- `validatePartialLocaleMessages()` checks secondary locale catalogs against the shared contract shape; missing keys are allowed, but incompatible shapes and unknown keys fail fast.
- `validateRegisteredMessageCatalogs()` and `assertValidRegisteredMessageCatalogs()` validate every locale catalog returned by `getMessageCatalog()`.
- `validateUnsupportedLocaleResolution()` proves unsupported locale inputs normalize before fallback catalog lookup stays valid.
- Automated coverage: `tests/unit/message-validation.test.ts`.

## Locale-aware formatting groundwork

- Shared shell date and number formatting resolves through `src/localization/lib/create-formatters.ts` (`createLocaleFormatters`) and `src/localization/lib/locale-intl-tag.ts` (`getIntlLocaleTag`).
- Shell components consume formatters through `useFormatters()` from `src/localization/hooks/use-formatters.ts`, aligned with the active locale from `LocalizationProvider`.
- Formatting helpers stay separate from message lookup and localized content bodies; use them only for shared shell UI values such as dates and numbers.
- Automated coverage: `tests/unit/locale-formatting.test.ts`, `tests/unit/use-formatters.test.tsx`.

## Verification

- `make check` — typecheck and Biome lint.
- `make test` — includes locale registry, shared shell message, fallback, validation, and formatting tests via `bun test`.
- Browser verification: build static export and confirm homepage and `/docs` render shared shell text from the message catalog.
