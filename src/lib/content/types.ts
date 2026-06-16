/** Supported public content kinds for canonical records (excludes landing). */
export const PUBLIC_CONTENT_KINDS = [
  "doc",
  "blog",
  "glossary",
  "comparison",
  "reference",
] as const;

export type PublicContentKind = (typeof PUBLIC_CONTENT_KINDS)[number];

export const CONTENT_PUBLICATION_STATUSES = [
  "published",
  "draft",
  "internal",
  "hidden",
] as const;

export type ContentPublicationStatus =
  (typeof CONTENT_PUBLICATION_STATUSES)[number];

/** Author-facing metadata before validation and canonical record projection. */
export type ContentMetadataInput = {
  id: string;
  kind: string;
  slug: string;
  canonicalLocale: string;
  availableLocales: string[];
  status: string;
  tags: string[];
  navigationTitle: string;
  section?: string;
  order?: number;
  search?: {
    include?: boolean;
    priority?: number;
  };
};

/**
 * Canonical content record shared across locales.
 * Named and typed separately from projected docs-shell navigation UI state.
 */
export type CanonicalContentRecord = {
  id: string;
  kind: PublicContentKind;
  slug: string;
  routePath: string;
  section: string;
  tags: string[];
  status: ContentPublicationStatus;
  order?: number;
  canonicalLocale: string;
  availableLocales: string[];
  searchInclude: boolean;
  searchPriority?: number;
  navigationTitle: string;
};

export type ContentValidationError = {
  field: string;
  message: string;
};

export type ContentValidationSuccess = {
  ok: true;
  record: CanonicalContentRecord;
};

export type ContentValidationFailure = {
  ok: false;
  errors: ContentValidationError[];
};

export type ContentValidationResult =
  | ContentValidationSuccess
  | ContentValidationFailure;
