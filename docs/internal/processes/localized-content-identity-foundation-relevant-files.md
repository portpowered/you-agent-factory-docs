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
- The loader returns `localizedVariantGroups` alongside canonical records so reviewers can inspect shared canonical page id, canonical locale, and available locales for parallel locale variants.
- Identity failures are attached to every affected starter descriptor and those records are excluded from the returned `records` array.
- `requireStarterContentRecords()` and `loadDocsShellNavigation()` continue to throw `StarterContentValidationError` when identity validation fails.
- Parallel locale variants for one doc slug share one route path; `listPublishedDocSlugs()` deduplicates slugs and `projectDocsShellNavigation()` deduplicates by canonical id.

## Locale registry alignment

- Variant locales and `availableLocales` declarations must match `SUPPORTED_LOCALES` from `src/localization/config/locales.ts` (`en`, `fr`, `ja`, `es`).
- BCP 47 tags such as `en-US` may still pass single-record metadata validation, but localized variant identity validation blocks unsupported registry declarations at the group layer.
- `validateLocaleRegistryMetadata()` in `src/lib/content/locale-metadata-validation.ts` enforces registry membership during starter content validation before canonical record projection.

## Build-time locale metadata validation

- `validateExplicitStarterLocaleMetadata()` requires explicit `canonicalLocale`, `availableLocales`, and `id` frontmatter on every starter locale file; `buildMetadataFromStarterContent()` no longer infers locale metadata from the on-disk filename.
- `validateStarterContent()` runs explicit metadata checks, registry validation, per-record validation, and `loadStarterContentRecords()` still runs group-level `validateLocalizedVariantBindings()`.
- Group validation fails when the canonical-locale variant file is missing or when `availableLocales` lists locales without matching on-disk variant files.
- Invalid fixtures for metadata drift proofs live under `tests/fixtures/starter-content/`; focused tests live in `tests/unit/locale-metadata-validation.test.ts`.

## Canonical-locale fallback resolution

- `resolveLocalizedContentVariant()` and `selectLocalizedVariantBinding()` in `src/lib/content/localized-content-resolution.ts` resolve locale-aware doc content and fall back to the canonical-locale variant when the requested locale is unsupported or missing a variant file.
- `loadDocPage(slug, contentRoot, { locale })` returns `resolution` metadata (`requestedLocale`, `resolvedLocale`, `fellBackToCanonicalLocale`) alongside the served record and body.
- Unsupported locales and supported locales without an on-disk variant resolve to the canonical-locale content for the same canonical page id and stable `routePath`.
- Navigation projection reuses `selectLocalizedVariantBinding()` so docs-shell labels follow the same fallback rules as doc page loading.

## Tests

- Focused identity contract and validation behavior: `tests/unit/localized-variant-identity.test.ts`.
- Build-time locale metadata validation: `tests/unit/locale-metadata-validation.test.ts`.
- Parallel localized starter content proof: `tests/unit/localized-starter-content.test.ts`.
- Canonical-locale fallback resolution: `tests/unit/localized-content-resolution.test.ts` and locale-aware cases in `tests/unit/load-doc-page.test.ts`.
- Starter loading integration remains covered in `tests/unit/starter-content.test.ts`; add identity failure fixtures under `tests/fixtures/starter-content/` when proving group-level errors through the loader.

## Quality checks

- `make check` / `bun run typecheck` + `bun run lint`
- `make test` / `bun test`
