/**
 * Stable operation anchors and hash-URL helpers for the W08 production API surface.
 *
 * Prefer W04 / operationId-based fragments already attached to nav items and
 * normalized summaries. Does not invent a second OpenAPI corpus.
 */

import {
  REFERENCE_FAMILY_PAGE_PATHS,
  referenceAnchorUrl,
} from "@/lib/references/reference-search-projection";

/** Default owning page path for production API deep links (W11 mounts here). */
export const API_REFERENCE_PAGE_PATH = REFERENCE_FAMILY_PAGE_PATHS.api;

/** Marker attribute on each focusable operation section host. */
export const API_OPERATION_SECTION_ATTR = "data-api-operation-section" as const;

/** Marker attribute recording the stable anchor fragment on a section. */
export const API_OPERATION_ANCHOR_ATTR = "data-api-operation-anchor" as const;

/** Marker set on the section currently focused via hash navigation. */
export const API_HASH_FOCUSED_ATTR = "data-api-hash-focused" as const;

/** Marker attribute on the hash controller host. */
export const API_HASH_CONTROLLER_ATTR =
  "data-api-reference-hash-controller" as const;

/** Marker attribute on the copy-link control. */
export const API_OPERATION_COPY_LINK_ATTR =
  "data-api-operation-copy-link" as const;

export const API_OPERATION_COPY_LINK_LABEL = "Copy operation link" as const;
export const API_OPERATION_COPY_LINK_COPIED_LABEL =
  "Copied operation link" as const;

export type ApiOperationAnchorLike = {
  /** Stable fragment without `#` (prefer published operationId). */
  anchor: string;
  method?: string;
  path?: string;
  operationId?: string;
  id?: string;
};

export type ApiOperationAnchorCollision = {
  anchor: string;
  left: ApiOperationAnchorLike;
  right: ApiOperationAnchorLike;
};

export type ApiOperationAnchorInventory = {
  ok: true;
  anchors: readonly string[];
  /** Distinct operation anchors (deduped). */
  uniqueCount: number;
};

/**
 * Normalize a fragment to a bare anchor id (no leading `#`, trimmed).
 */
export function normalizeApiOperationAnchor(raw: string): string {
  return raw.trim().replace(/^#/, "");
}

/**
 * Prefer an explicit operationId when present; otherwise keep the published
 * W04 / provisional anchor. Empty values are rejected.
 */
export function resolveApiOperationAnchor(
  operation: ApiOperationAnchorLike,
): string {
  const fromOperationId =
    typeof operation.operationId === "string"
      ? normalizeApiOperationAnchor(operation.operationId)
      : "";
  if (fromOperationId.length > 0) {
    return fromOperationId;
  }

  const fromAnchor = normalizeApiOperationAnchor(operation.anchor);
  if (fromAnchor.length > 0) {
    return fromAnchor;
  }

  throw new Error(
    `Cannot resolve a stable API operation anchor${
      operation.method && operation.path
        ? ` for ${operation.method.toUpperCase()} ${operation.path}`
        : ""
    }.`,
  );
}

/**
 * Build an owning-page deep-link URL for an operation anchor.
 * Defaults to `/docs/references/api#<anchor>`.
 */
export function apiOperationAnchorUrl(
  anchor: string,
  pagePath: string = API_REFERENCE_PAGE_PATH,
): string {
  return referenceAnchorUrl(pagePath, normalizeApiOperationAnchor(anchor));
}

/**
 * Build the clipboard value for a copy-link control.
 * Prefers an explicit href; otherwise builds from pagePath + anchor.
 */
export function apiOperationCopyLinkValue(options: {
  anchor: string;
  href?: string;
  pagePath?: string;
}): string {
  if (options.href !== undefined && options.href.trim().length > 0) {
    return options.href.trim();
  }
  return apiOperationAnchorUrl(
    options.anchor,
    options.pagePath ?? API_REFERENCE_PAGE_PATH,
  );
}

/**
 * Collect collision-free operation anchors. Fails closed when two distinct
 * operations claim the same fragment.
 */
export function collectCollisionFreeApiOperationAnchors(
  operations: readonly ApiOperationAnchorLike[],
): ApiOperationAnchorInventory {
  const seen = new Map<string, ApiOperationAnchorLike>();
  const collisions: ApiOperationAnchorCollision[] = [];
  const anchors: string[] = [];

  for (const operation of operations) {
    const anchor = resolveApiOperationAnchor(operation);
    const prior = seen.get(anchor);
    if (prior) {
      const priorKey = prior.id ?? prior.operationId ?? prior.anchor;
      const nextKey = operation.id ?? operation.operationId ?? operation.anchor;
      // Same logical operation may appear under multiple tags — not a collision.
      if (priorKey === nextKey) {
        continue;
      }
      collisions.push({ anchor, left: prior, right: operation });
      continue;
    }
    seen.set(anchor, operation);
    anchors.push(anchor);
  }

  if (collisions.length > 0) {
    const detail = collisions
      .map((c) => {
        const left = `${c.left.method?.toUpperCase() ?? "?"} ${c.left.path ?? c.left.id ?? "?"}`;
        const right = `${c.right.method?.toUpperCase() ?? "?"} ${c.right.path ?? c.right.id ?? "?"}`;
        return `${c.anchor}: ${left} vs ${right}`;
      })
      .join("; ");
    throw new Error(
      `API operation anchor collision(s) (${collisions.length}): ${detail}`,
    );
  }

  return {
    ok: true,
    anchors,
    uniqueCount: anchors.length,
  };
}

/**
 * Read the current location hash as a bare operation anchor (or empty).
 */
export function readLocationHashAnchor(hash: string): string {
  return normalizeApiOperationAnchor(hash);
}
