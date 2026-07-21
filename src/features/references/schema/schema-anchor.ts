/**
 * Pure helpers for W04-derived schema anchors and breadcrumb path segments.
 *
 * Anchors come from `anchorForIdentity("schema-pointer", …)` — the UI must not
 * invent unstable fragment IDs.
 */

import { anchorForIdentity } from "@/lib/references/reference-anchor-registry";
import type { SchemaAddress } from "@/lib/references/schema-model";

export type SchemaDeepLink = {
  /** URL fragment without `#`. */
  anchor: string;
  /** Full path+fragment when a page path was supplied. */
  href?: string;
  /** Clipboard value: `href` when present, otherwise `#${anchor}`. */
  copyValue: string;
};

/** Deterministic W04 schema-pointer anchor for a JSON Pointer identity. */
export function schemaPointerAnchor(pointer: string): string {
  return anchorForIdentity("schema-pointer", pointer);
}

/**
 * Build a deep-link fragment (and optional full href) from a schema address.
 * Never invents anchors — always derives from the address pointer via W04.
 */
export function schemaAddressDeepLink(
  address: SchemaAddress,
  pagePath?: string,
): SchemaDeepLink {
  const anchor = schemaPointerAnchor(address.pointer);
  const href =
    pagePath !== undefined && pagePath.trim().length > 0
      ? `${pagePath.replace(/\/$/, "")}#${anchor}`
      : undefined;
  return {
    anchor,
    ...(href !== undefined ? { href } : {}),
    copyValue: href ?? `#${anchor}`,
  };
}

/**
 * Breadcrumb segments from a JSON Pointer (empty segments dropped).
 * Example: `/components/schemas/Worker` → `["components", "schemas", "Worker"]`.
 */
export function schemaPointerBreadcrumbSegments(
  pointer: string,
): readonly string[] {
  return pointer.split("/").filter((segment) => segment.length > 0);
}

/**
 * Breadcrumb segments from a field path (dot / `[]` segments).
 * Example: `workers[].name` → `["workers[]", "name"]`.
 */
export function schemaFieldPathBreadcrumbSegments(
  path: string,
): readonly string[] {
  return path.split(".").filter((segment) => segment.length > 0);
}
