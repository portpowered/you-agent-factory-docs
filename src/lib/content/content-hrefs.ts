import {
  buildLocalizedRoute,
  defaultLocale,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";

/** Canonical docs URL for a glossary entry slug. */
export function glossaryPageHref(
  slug: string,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute(
    { surface: "docs-page", slug: `glossary/${slug}` },
    locale,
  );
}

/** Canonical docs URL for a concept entry slug under `docs/concepts`. */
export function conceptPageHref(
  slug: string,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute(
    { surface: "docs-page", slug: `concepts/${slug}` },
    locale,
  );
}

/** Canonical docs URL for a module entry slug. */
export function modulePageHref(
  slug: string,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute(
    { surface: "docs-page", slug: `modules/${slug}` },
    locale,
  );
}

/** Canonical docs URL for a model entry slug. */
export function modelPageHref(
  slug: string,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute(
    { surface: "docs-page", slug: `models/${slug}` },
    locale,
  );
}

/** Canonical docs URL for a paper entry slug. */
export function paperPageHref(
  slug: string,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute(
    { surface: "docs-page", slug: `papers/${slug}` },
    locale,
  );
}

/** Canonical docs URL for a training-regime entry slug. */
export function trainingPageHref(
  slug: string,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute(
    { surface: "docs-page", slug: `training/${slug}` },
    locale,
  );
}

/** Canonical docs URL for a system entry slug. */
export function systemPageHref(
  slug: string,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute(
    { surface: "docs-page", slug: `systems/${slug}` },
    locale,
  );
}

/** Canonical docs URL for a guide entry slug under `docs/guides`. */
export function guidePageHref(
  slug: string,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute(
    { surface: "docs-page", slug: `guides/${slug}` },
    locale,
  );
}

/** Canonical docs URL for a technique entry slug under `docs/techniques`. */
export function techniquePageHref(
  slug: string,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute(
    { surface: "docs-page", slug: `techniques/${slug}` },
    locale,
  );
}

/** Canonical docs URL for a documentation entry slug under `docs/documentation`. */
export function documentationPageHref(
  slug: string,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute(
    { surface: "docs-page", slug: `documentation/${slug}` },
    locale,
  );
}

/**
 * Canonical docs URL for a reference entry slug under `docs/references`.
 * `slug` may be nested (`openapi/paths`).
 */
export function referencePageHref(
  slug: string,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute(
    { surface: "docs-page", slug: `references/${slug}` },
    locale,
  );
}

/**
 * Canonical docs URL for a workers entry slug under `docs/workers`.
 *
 * `slug` may be a single segment (`agent`) or a nested path
 * (`agent/variant`) so route-family child pages resolve correctly.
 */
export function workersPageHref(
  slug: string,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute(
    { surface: "docs-page", slug: `workers/${slug}` },
    locale,
  );
}

/** Canonical tag landing URL for a registry tag slug. */
export function tagPageHref(
  slug: string,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute({ surface: "tag-page", slug }, locale);
}
