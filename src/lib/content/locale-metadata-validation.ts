import type { StarterContentDescriptor } from "@/lib/content/starter";
import type { ContentMetadataInput } from "@/lib/content/types";
import type { ContentValidationError } from "@/lib/content/types";
import { isSupportedLocale } from "@/localization/config/locales";

function pushError(
  errors: ContentValidationError[],
  field: string,
  message: string,
): void {
  errors.push({ field, message });
}

function hasExplicitString(
  frontmatter: Record<string, unknown>,
  field: string,
): boolean {
  return (
    typeof frontmatter[field] === "string" &&
    frontmatter[field].trim().length > 0
  );
}

function hasExplicitStringArray(
  frontmatter: Record<string, unknown>,
  field: string,
): boolean {
  if (!Array.isArray(frontmatter[field]) || frontmatter[field].length === 0) {
    return false;
  }

  return frontmatter[field].every(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
}

/**
 * Requires explicit locale metadata in starter content frontmatter instead of
 * inferring relationships from the on-disk locale filename.
 */
export function validateExplicitStarterLocaleMetadata(
  frontmatter: Record<string, unknown>,
  descriptor: StarterContentDescriptor,
): ContentValidationError[] {
  const errors: ContentValidationError[] = [];
  const contentPath = `${descriptor.contentDirectory}/${descriptor.slug}/${descriptor.locale}`;

  if (!hasExplicitString(frontmatter, "canonicalLocale")) {
    pushError(
      errors,
      "canonicalLocale",
      `canonicalLocale must be declared explicitly in frontmatter for "${contentPath}"`,
    );
  }

  if (!hasExplicitStringArray(frontmatter, "availableLocales")) {
    pushError(
      errors,
      "availableLocales",
      `availableLocales must be declared explicitly in frontmatter for "${contentPath}"`,
    );
  }

  if (!hasExplicitString(frontmatter, "id")) {
    pushError(
      errors,
      "id",
      `id must be declared explicitly in frontmatter for "${contentPath}" so localized variants attach to one canonical page identity`,
    );
  }

  return errors;
}

/**
 * Validates locale metadata against the supported locale registry and canonical
 * content alignment rules at build time.
 */
export function validateLocaleRegistryMetadata(
  metadata: Pick<ContentMetadataInput, "canonicalLocale" | "availableLocales">,
): ContentValidationError[] {
  const errors: ContentValidationError[] = [];

  if (!isSupportedLocale(metadata.canonicalLocale)) {
    pushError(
      errors,
      "canonicalLocale",
      `canonicalLocale "${metadata.canonicalLocale}" is not a supported locale in the locale registry`,
    );
  }

  for (const locale of metadata.availableLocales) {
    if (!isSupportedLocale(locale)) {
      pushError(
        errors,
        "availableLocales",
        `availableLocales contains unsupported locale "${locale}"`,
      );
    }
  }

  return errors;
}
