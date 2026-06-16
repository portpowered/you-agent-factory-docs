import {
  hasDuplicateLocales,
  isValidLocaleTag,
  normalizeLocaleList,
} from "@/lib/content/locales";
import {
  buildCanonicalId,
  buildRoutePath,
  isValidSlug,
  parseCanonicalId,
} from "@/lib/content/routes";
import {
  CONTENT_PUBLICATION_STATUSES,
  type CanonicalContentRecord,
  type ContentMetadataInput,
  type ContentValidationError,
  type ContentValidationResult,
  PUBLIC_CONTENT_KINDS,
  type PublicContentKind,
} from "@/lib/content/types";

function pushError(
  errors: ContentValidationError[],
  field: string,
  message: string,
): void {
  errors.push({ field, message });
}

function isPublicContentKind(kind: string): kind is PublicContentKind {
  return (PUBLIC_CONTENT_KINDS as readonly string[]).includes(kind);
}

function isPublicationStatus(
  status: string,
): status is CanonicalContentRecord["status"] {
  return (CONTENT_PUBLICATION_STATUSES as readonly string[]).includes(status);
}

function validateRequiredString(
  errors: ContentValidationError[],
  field: string,
  value: unknown,
): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    pushError(errors, field, `${field} is required`);
    return false;
  }

  return true;
}

function validateTags(
  errors: ContentValidationError[],
  tags: unknown,
): tags is string[] {
  if (!Array.isArray(tags)) {
    pushError(errors, "tags", "tags must be an array of strings");
    return false;
  }

  if (tags.some((tag) => typeof tag !== "string" || tag.trim().length === 0)) {
    pushError(errors, "tags", "tags must contain only non-empty strings");
    return false;
  }

  return true;
}

function validateAvailableLocales(
  errors: ContentValidationError[],
  availableLocales: unknown,
): availableLocales is string[] {
  if (!Array.isArray(availableLocales) || availableLocales.length === 0) {
    pushError(
      errors,
      "availableLocales",
      "availableLocales must be a non-empty array of locale tags",
    );
    return false;
  }

  const normalizedLocales = normalizeLocaleList(availableLocales);
  if (normalizedLocales.length === 0) {
    pushError(
      errors,
      "availableLocales",
      "availableLocales must include at least one locale tag",
    );
    return false;
  }

  if (hasDuplicateLocales(normalizedLocales)) {
    pushError(
      errors,
      "availableLocales",
      "availableLocales must not contain duplicate locale tags",
    );
    return false;
  }

  for (const locale of normalizedLocales) {
    if (!isValidLocaleTag(locale)) {
      pushError(
        errors,
        "availableLocales",
        `availableLocales contains invalid locale tag "${locale}"`,
      );
    }
  }

  return normalizedLocales.every(isValidLocaleTag);
}

function validateSearchMetadata(
  errors: ContentValidationError[],
  search: ContentMetadataInput["search"],
): void {
  if (search === undefined) {
    return;
  }

  if (typeof search !== "object" || search === null || Array.isArray(search)) {
    pushError(errors, "search", "search must be an object when provided");
    return;
  }

  if (search.include !== undefined && typeof search.include !== "boolean") {
    pushError(errors, "search.include", "search.include must be a boolean");
  }

  if (search.priority !== undefined) {
    if (
      typeof search.priority !== "number" ||
      !Number.isFinite(search.priority) ||
      search.priority < 0
    ) {
      pushError(
        errors,
        "search.priority",
        "search.priority must be a non-negative number",
      );
    }
  }
}

function validateCanonicalIdentity(
  errors: ContentValidationError[],
  metadata: ContentMetadataInput,
  kind: PublicContentKind,
  slug: string,
  id: string,
): void {
  if (!isValidSlug(slug)) {
    pushError(
      errors,
      "slug",
      'slug must use lowercase letters, numbers, and single hyphens (e.g. "getting-started")',
    );
  }

  const parsedId = parseCanonicalId(id);
  if (!parsedId) {
    pushError(
      errors,
      "id",
      'id must follow the canonical identity format "{kind}/{slug}"',
    );
    return;
  }

  if (parsedId.kind !== kind) {
    pushError(
      errors,
      "id",
      `id kind segment "${parsedId.kind}" does not match kind "${kind}"`,
    );
  }

  if (parsedId.slug !== slug) {
    pushError(
      errors,
      "id",
      `id slug segment "${parsedId.slug}" does not match slug "${slug}"`,
    );
  }

  const expectedId = buildCanonicalId(kind, slug);
  if (id !== expectedId) {
    pushError(
      errors,
      "id",
      `id must equal the canonical identity "${expectedId}"`,
    );
  }
}

function validateLocaleAlignment(
  errors: ContentValidationError[],
  canonicalLocale: string,
  availableLocales: string[],
): void {
  if (!isValidLocaleTag(canonicalLocale)) {
    pushError(
      errors,
      "canonicalLocale",
      `canonicalLocale "${canonicalLocale}" is not a valid locale tag`,
    );
    return;
  }

  if (!availableLocales.includes(canonicalLocale)) {
    pushError(
      errors,
      "canonicalLocale",
      "canonicalLocale must be included in availableLocales",
    );
  }
}

function validateOrder(
  errors: ContentValidationError[],
  order: ContentMetadataInput["order"],
): void {
  if (order === undefined) {
    return;
  }

  if (!Number.isInteger(order)) {
    pushError(errors, "order", "order must be an integer when provided");
  }
}

function buildRecord(
  metadata: ContentMetadataInput,
  kind: PublicContentKind,
  slug: string,
  availableLocales: string[],
): CanonicalContentRecord {
  const searchInclude = metadata.search?.include ?? true;

  return {
    id: metadata.id.trim(),
    kind,
    slug,
    routePath: buildRoutePath(kind, slug),
    section: metadata.section?.trim() || kind,
    tags: metadata.tags.map((tag) => tag.trim()),
    status: metadata.status as CanonicalContentRecord["status"],
    order: metadata.order,
    canonicalLocale: metadata.canonicalLocale.trim(),
    availableLocales: normalizeLocaleList(availableLocales),
    searchInclude,
    searchPriority: metadata.search?.priority,
    navigationTitle: metadata.navigationTitle.trim(),
  };
}

/**
 * Validates author metadata and projects a canonical content record on success.
 * Returns structured, reviewer-verifiable errors instead of throwing.
 */
export function validateContentMetadata(
  metadata: ContentMetadataInput,
): ContentValidationResult {
  const errors: ContentValidationError[] = [];

  const hasId = validateRequiredString(errors, "id", metadata.id);
  const hasSlug = validateRequiredString(errors, "slug", metadata.slug);
  const hasCanonicalLocale = validateRequiredString(
    errors,
    "canonicalLocale",
    metadata.canonicalLocale,
  );
  const hasNavigationTitle = validateRequiredString(
    errors,
    "navigationTitle",
    metadata.navigationTitle,
  );
  validateRequiredString(errors, "kind", metadata.kind);
  validateRequiredString(errors, "status", metadata.status);
  const hasTags = validateTags(errors, metadata.tags);
  validateAvailableLocales(errors, metadata.availableLocales);
  validateSearchMetadata(errors, metadata.search);
  validateOrder(errors, metadata.order);

  if (!isPublicContentKind(metadata.kind)) {
    pushError(
      errors,
      "kind",
      `kind must be one of: ${PUBLIC_CONTENT_KINDS.join(", ")}`,
    );
  }

  if (!isPublicationStatus(metadata.status)) {
    pushError(
      errors,
      "status",
      `status must be one of: ${CONTENT_PUBLICATION_STATUSES.join(", ")}`,
    );
  }

  const kind = metadata.kind;
  const slug = metadata.slug;
  const id = metadata.id;

  if (isPublicContentKind(kind) && hasId && hasSlug) {
    validateCanonicalIdentity(errors, metadata, kind, slug.trim(), id.trim());
  }

  if (hasCanonicalLocale) {
    const normalizedLocales = Array.isArray(metadata.availableLocales)
      ? normalizeLocaleList(metadata.availableLocales)
      : [];

    validateLocaleAlignment(
      errors,
      metadata.canonicalLocale.trim(),
      normalizedLocales,
    );
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  if (!isPublicContentKind(kind) || !isPublicationStatus(metadata.status)) {
    return {
      ok: false,
      errors: [{ field: "metadata", message: "metadata failed validation" }],
    };
  }

  if (!hasTags || !hasNavigationTitle) {
    return {
      ok: false,
      errors: [{ field: "metadata", message: "metadata failed validation" }],
    };
  }

  return {
    ok: true,
    record: buildRecord(metadata, kind, slug.trim(), metadata.availableLocales),
  };
}
