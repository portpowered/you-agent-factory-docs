import type { CanonicalContentRecord } from "@/lib/content/types";
import type { ContentValidationError } from "@/lib/content/types";
import { isSupportedLocale } from "@/localization/config/locales";

/**
 * Reviewer-verifiable identity for one localized content variant tied to a
 * canonical page. Projected separately from `CanonicalContentRecord` so the core
 * record model stays unchanged while localized variants share one page id.
 */
export type LocalizedContentVariantIdentity = {
  canonicalPageId: string;
  canonicalLocale: string;
  variantLocale: string;
  availableLocales: string[];
};

/** Parallel locale variants grouped under one canonical page identity. */
export type LocalizedVariantGroup = {
  canonicalPageId: string;
  canonicalLocale: string;
  availableLocales: string[];
  variants: LocalizedContentVariantIdentity[];
};

/** One starter-content variant bound to its canonical record for group validation. */
export type LocalizedContentVariantBinding = {
  /** Stable content path key from starter layout, e.g. `doc/getting-started`. */
  contentPathKey: string;
  /** Locale of the on-disk variant file. */
  variantLocale: string;
  record: CanonicalContentRecord;
};

export type LocalizedVariantValidationSuccess = {
  ok: true;
  groups: LocalizedVariantGroup[];
};

export type LocalizedVariantValidationFailure = {
  ok: false;
  errors: ContentValidationError[];
};

export type LocalizedVariantValidationResult =
  | LocalizedVariantValidationSuccess
  | LocalizedVariantValidationFailure;

function pushError(
  errors: ContentValidationError[],
  field: string,
  message: string,
): void {
  errors.push({ field, message });
}

function localesMatch(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const normalizedLeft = [...left].sort();
  const normalizedRight = [...right].sort();
  return normalizedLeft.every(
    (locale, index) => locale === normalizedRight[index],
  );
}

export function projectLocalizedVariantIdentity(
  record: CanonicalContentRecord,
  variantLocale: string,
): LocalizedContentVariantIdentity {
  return {
    canonicalPageId: record.id,
    canonicalLocale: record.canonicalLocale,
    variantLocale,
    availableLocales: record.availableLocales,
  };
}

export function projectLocalizedVariantGroups(
  bindings: readonly LocalizedContentVariantBinding[],
): LocalizedVariantGroup[] {
  const groups = new Map<string, LocalizedVariantGroup>();

  for (const binding of bindings) {
    const identity = projectLocalizedVariantIdentity(
      binding.record,
      binding.variantLocale,
    );
    const existing = groups.get(binding.contentPathKey);

    if (!existing) {
      groups.set(binding.contentPathKey, {
        canonicalPageId: identity.canonicalPageId,
        canonicalLocale: identity.canonicalLocale,
        availableLocales: identity.availableLocales,
        variants: [identity],
      });
      continue;
    }

    existing.variants.push(identity);
  }

  return [...groups.values()].map((group) => ({
    ...group,
    variants: [...group.variants].sort((left, right) =>
      left.variantLocale.localeCompare(right.variantLocale),
    ),
  }));
}

/**
 * Validates localized variant identity across parallel locale files for one
 * canonical page. Fails on unsupported locales, conflicting canonical page ids,
 * or duplicate variant locales instead of inferring relationships from paths.
 */
export function validateLocalizedVariantBindings(
  bindings: readonly LocalizedContentVariantBinding[],
): LocalizedVariantValidationResult {
  const errors: ContentValidationError[] = [];
  const bindingsByPath = new Map<string, LocalizedContentVariantBinding[]>();

  for (const binding of bindings) {
    const group = bindingsByPath.get(binding.contentPathKey) ?? [];
    group.push(binding);
    bindingsByPath.set(binding.contentPathKey, group);
  }

  for (const [contentPathKey, groupBindings] of bindingsByPath) {
    const canonicalPageIds = new Set(
      groupBindings.map((binding) => binding.record.id),
    );
    if (canonicalPageIds.size > 1) {
      pushError(
        errors,
        `${contentPathKey}.canonicalPageId`,
        `conflicting canonical page ids across variants: ${[...canonicalPageIds].sort().join(", ")}`,
      );
    }

    const canonicalLocales = new Set(
      groupBindings.map((binding) => binding.record.canonicalLocale),
    );
    if (canonicalLocales.size > 1) {
      pushError(
        errors,
        `${contentPathKey}.canonicalLocale`,
        `conflicting canonical locale declarations across variants: ${[...canonicalLocales].sort().join(", ")}`,
      );
    }

    const availableLocaleSets = groupBindings.map(
      (binding) => binding.record.availableLocales,
    );
    const referenceLocales = availableLocaleSets[0] ?? [];
    if (
      availableLocaleSets.some(
        (locales) => !localesMatch(locales, referenceLocales),
      )
    ) {
      pushError(
        errors,
        `${contentPathKey}.availableLocales`,
        "conflicting availableLocales declarations across localized variants",
      );
    }

    const seenVariantLocales = new Set<string>();
    for (const binding of groupBindings) {
      const { variantLocale, record } = binding;
      const fieldPrefix = `${contentPathKey}.variants.${variantLocale}`;

      if (!isSupportedLocale(variantLocale)) {
        pushError(
          errors,
          `${fieldPrefix}.variantLocale`,
          `unsupported variant locale "${variantLocale}"`,
        );
      }

      if (seenVariantLocales.has(variantLocale)) {
        pushError(
          errors,
          `${fieldPrefix}.variantLocale`,
          `duplicate variant locale "${variantLocale}" for canonical page "${contentPathKey}"`,
        );
      }
      seenVariantLocales.add(variantLocale);

      for (const locale of record.availableLocales) {
        if (!isSupportedLocale(locale)) {
          pushError(
            errors,
            `${contentPathKey}.availableLocales`,
            `unsupported locale declaration "${locale}"`,
          );
        }
      }

      if (
        isSupportedLocale(variantLocale) &&
        !record.availableLocales.includes(variantLocale)
      ) {
        pushError(
          errors,
          `${fieldPrefix}.variantLocale`,
          `variant locale "${variantLocale}" must be included in availableLocales`,
        );
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    groups: projectLocalizedVariantGroups(bindings),
  };
}
