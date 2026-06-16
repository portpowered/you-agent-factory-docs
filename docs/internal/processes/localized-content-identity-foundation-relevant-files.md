# Localized content identity foundation — relevant files

## Ownership boundary

- **`CanonicalContentRecord`** (`src/lib/content/types.ts`) remains the core canonical record model. Localized variant identity is projected separately so later lanes do not overload the base record shape.
- **`LocalizedContentVariantIdentity`** and **`LocalizedVariantGroup`** (`src/lib/content/localized-variant-identity.ts`) define the reviewer-verifiable localized-content identity contract: `canonicalPageId`, `canonicalLocale`, `variantLocale`, and `availableLocales`.
- **`validateLocalizedVariantBindings()`** groups parallel locale files by `buildStarterContentPathKey()` and fails on conflicting canonical page ids, duplicate variant locales, or unsupported locale declarations from the locale registry.

## Localized variant identity module

- Types and validation live in `src/lib/content/localized-variant-identity.ts`; import from `@/lib/content`.
- `projectLocalizedVariantIdentity(record, variantLocale)` projects one variant's identity fields from a canonical record plus the on-disk locale file tag.
- `projectLocalizedVariantGroups(bindings)` groups validated bindings into `LocalizedVariantGroup` output for reviewers and later projection lanes.
- `validateLocalizedVariantBindings(bindings)` is the group validator; errors use content-path prefixes such as `doc/getting-started.canonicalPageId` or `doc/getting-started.variants.fr.variantLocale`.
- `buildStarterContentPathKey(descriptor)` in `src/lib/content/starter.ts` derives the stable grouping key from starter directory layout (`{kind}/{slug}`).

## Starter content integration

- `loadStarterContentRecords()` validates individual fixtures first, then runs localized variant identity validation across successful bindings.
- Identity failures are attached to every affected starter descriptor and those records are excluded from the returned `records` array.
- `requireStarterContentRecords()` and `loadDocsShellNavigation()` continue to throw `StarterContentValidationError` when identity validation fails.

## Locale registry alignment

- Variant locales and `availableLocales` declarations must match `SUPPORTED_LOCALES` from `src/localization/config/locales.ts` (`en`, `fr`, `ja`, `es`).
- BCP 47 tags such as `en-US` may still pass single-record metadata validation, but localized variant identity validation blocks unsupported registry declarations at the group layer.

## Tests

- Focused identity contract and validation behavior: `tests/unit/localized-variant-identity.test.ts`.
- Starter loading integration remains covered in `tests/unit/starter-content.test.ts`; add identity failure fixtures under `tests/fixtures/starter-content/` when proving group-level errors through the loader.

## Quality checks

- `make check` / `bun run typecheck` + `bun run lint`
- `make test` / `bun test`
