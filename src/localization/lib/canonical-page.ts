import type { SupportedLocale } from "../config/locales";

const LOCALE_PREFIXED_ROUTE_PATTERN = /^\/[a-z]{2}(?:-[a-z]{2})?(?:\/|$)/i;

export type CanonicalPageIdentity = {
  /** Stable route without a locale prefix, e.g. `/` or `/docs/installation`. */
  route: string;
  /** Locales that may provide localized content variants for this page. */
  availableLocales: readonly SupportedLocale[];
};

export function assertCanonicalRoute(route: string): void {
  if (LOCALE_PREFIXED_ROUTE_PATTERN.test(route)) {
    throw new Error(
      `Canonical page routes must not include locale prefixes: ${route}`,
    );
  }
}

export function createCanonicalPageIdentity(
  route: string,
  availableLocales: readonly SupportedLocale[],
): CanonicalPageIdentity {
  assertCanonicalRoute(route);

  return {
    route,
    availableLocales,
  };
}
