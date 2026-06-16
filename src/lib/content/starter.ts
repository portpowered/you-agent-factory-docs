import { parseContentFile } from "@/lib/content/frontmatter";
import { buildCanonicalId } from "@/lib/content/routes";
import type {
  CanonicalContentRecord,
  ContentMetadataInput,
  ContentValidationError,
  ContentValidationResult,
  PublicContentKind,
} from "@/lib/content/types";
import { validateContentMetadata } from "@/lib/content/validation";

/** Maps starter content directory names to canonical public content kinds. */
export const STARTER_CONTENT_DIRECTORY_KINDS = {
  docs: "doc",
  blog: "blog",
  glossary: "glossary",
  comparisons: "comparison",
  references: "reference",
} as const satisfies Record<string, PublicContentKind>;

export type StarterContentDirectory =
  keyof typeof STARTER_CONTENT_DIRECTORY_KINDS;

export type StarterContentDescriptor = {
  contentDirectory: StarterContentDirectory;
  slug: string;
  locale: string;
  source: string;
};

export type StarterContentValidationSuccess = {
  ok: true;
  record: CanonicalContentRecord;
  descriptor: StarterContentDescriptor;
};

export type StarterContentValidationFailure = {
  ok: false;
  errors: ContentValidationError[];
  descriptor: StarterContentDescriptor;
};

export type StarterContentValidationResult =
  | StarterContentValidationSuccess
  | StarterContentValidationFailure;

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  if (
    value.some((item) => typeof item !== "string" || item.trim().length === 0)
  ) {
    return undefined;
  }

  return value.map((item) => item.trim());
}

function asSearchMetadata(
  value: unknown,
): ContentMetadataInput["search"] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value as ContentMetadataInput["search"];
  }

  const search = value as Record<string, unknown>;
  return {
    include: typeof search.include === "boolean" ? search.include : undefined,
    priority: typeof search.priority === "number" ? search.priority : undefined,
  };
}

function resolveKind(
  contentDirectory: StarterContentDirectory,
  frontmatter: Record<string, unknown>,
): string {
  return (
    asString(frontmatter.kind) ??
    STARTER_CONTENT_DIRECTORY_KINDS[contentDirectory]
  );
}

function resolveNavigationTitle(frontmatter: Record<string, unknown>): string {
  return (
    asString(frontmatter.navigationTitle) ?? asString(frontmatter.title) ?? ""
  );
}

/**
 * Projects starter content frontmatter and directory context into author metadata.
 * Slug and locale come from the starter content path; kind defaults to the directory mapping.
 */
export function buildMetadataFromStarterContent(
  descriptor: StarterContentDescriptor,
): ContentMetadataInput {
  const { frontmatter } = parseContentFile(descriptor.source);
  const kind = resolveKind(descriptor.contentDirectory, frontmatter);
  const slug = asString(frontmatter.slug) ?? descriptor.slug;
  const canonicalLocale =
    asString(frontmatter.canonicalLocale) ?? descriptor.locale;
  const availableLocales = asStringArray(frontmatter.availableLocales) ?? [
    descriptor.locale,
  ];

  return {
    id:
      asString(frontmatter.id) ??
      buildCanonicalId(kind as PublicContentKind, slug),
    kind,
    slug,
    canonicalLocale,
    availableLocales,
    status: asString(frontmatter.status) ?? "draft",
    tags: asStringArray(frontmatter.tags) ?? [],
    navigationTitle: resolveNavigationTitle(frontmatter),
    section: asString(frontmatter.section),
    order:
      typeof frontmatter.order === "number" ? frontmatter.order : undefined,
    search: asSearchMetadata(frontmatter.search),
  };
}

/** Validates starter content and returns a canonical record or structured content errors. */
export function validateStarterContent(
  descriptor: StarterContentDescriptor,
): StarterContentValidationResult {
  const metadata = buildMetadataFromStarterContent(descriptor);
  const validation = validateContentMetadata(metadata);

  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
      descriptor,
    };
  }

  return {
    ok: true,
    record: validation.record,
    descriptor,
  };
}

export function validateStarterContentSource(
  contentDirectory: StarterContentDirectory,
  slug: string,
  locale: string,
  source: string,
): StarterContentValidationResult {
  return validateStarterContent({
    contentDirectory,
    slug,
    locale,
    source,
  });
}
