import type { PublicContentKind } from "@/lib/content/types";

const ROUTE_PREFIX_BY_KIND: Record<PublicContentKind, string> = {
  doc: "/docs",
  blog: "/blog",
  glossary: "/glossary",
  comparison: "/comparisons",
  reference: "/references",
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function buildCanonicalId(
  kind: PublicContentKind,
  slug: string,
): string {
  return `${kind}/${slug}`;
}

export function buildRoutePath(kind: PublicContentKind, slug: string): string {
  const prefix = ROUTE_PREFIX_BY_KIND[kind];
  return `${prefix}/${slug}`;
}

export function parseCanonicalId(
  id: string,
): { kind: string; slug: string } | null {
  const separatorIndex = id.indexOf("/");
  if (separatorIndex <= 0 || separatorIndex === id.length - 1) {
    return null;
  }

  return {
    kind: id.slice(0, separatorIndex),
    slug: id.slice(separatorIndex + 1),
  };
}
