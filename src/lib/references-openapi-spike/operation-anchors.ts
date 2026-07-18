/**
 * Deterministic, collision-free operation anchors for the W01 OpenAPI spike.
 *
 * Fumadocs OpenAPI headings use `slug(summary || idToTitle(operationId))`.
 * The spike additionally exposes a stable deep-link id equal to `operationId`
 * (unique across the packaged document) so hash links survive summary edits.
 */

import { slug } from "github-slugger";

export type OpenApiOperationLike = {
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
};

export type SpikeOperationAnchor = {
  method: string;
  path: string;
  operationId: string;
  /** Reader-facing title (matches fumadocs Operation showTitle). */
  title: string;
  /** Fumadocs heading id (`slug(title)`). */
  fumadocsHeadingId: string;
  /** Spike deep-link id (`operationId`) used on `<section id>`. */
  deepLinkId: string;
};

/**
 * Mirror of fumadocs-openapi `idToTitle` (operationId → heading title).
 */
export function idToTitle(id: string): string {
  let result: string[] = [];
  for (const c of id) {
    if (result.length === 0) result.push(c.toLocaleUpperCase());
    else if (c === ".") result = [];
    else if (/^[A-Z]$/.test(c) && result.at(-1) !== " ") result.push(" ", c);
    else if (c === "-") result.push(" ");
    else result.push(c);
  }
  return result.join("");
}

export function operationDisplayTitle(op: OpenApiOperationLike): string {
  if (op.summary && op.summary.length > 0) return op.summary;
  if (op.operationId) return idToTitle(op.operationId);
  return op.path;
}

export function fumadocsHeadingAnchor(title: string): string {
  return slug(title);
}

export function spikeDeepLinkAnchor(operationId: string): string {
  if (!operationId) {
    throw new Error("spikeDeepLinkAnchor requires a non-empty operationId");
  }
  return operationId;
}

export function buildSpikeOperationAnchor(
  op: OpenApiOperationLike,
): SpikeOperationAnchor {
  if (!op.operationId) {
    throw new Error(
      `OpenAPI operation missing operationId: ${op.method.toUpperCase()} ${op.path}`,
    );
  }
  const title = operationDisplayTitle(op);
  return {
    method: op.method,
    path: op.path,
    operationId: op.operationId,
    title,
    fumadocsHeadingId: fumadocsHeadingAnchor(title),
    deepLinkId: spikeDeepLinkAnchor(op.operationId),
  };
}

export type AnchorCollisionReport = {
  ok: true;
  anchors: SpikeOperationAnchor[];
  deepLinkIds: string[];
  fumadocsHeadingIds: string[];
};

/**
 * Build anchors for every operation and fail if either deep-link ids or
 * fumadocs heading ids collide.
 */
export function collectCollisionFreeOperationAnchors(
  operations: OpenApiOperationLike[],
): AnchorCollisionReport {
  const anchors = operations.map(buildSpikeOperationAnchor);

  const deepLinkIds = anchors.map((a) => a.deepLinkId);
  const fumadocsHeadingIds = anchors.map((a) => a.fumadocsHeadingId);

  assertUniqueIds("deep-link (operationId)", deepLinkIds, anchors);
  assertUniqueIds("fumadocs heading", fumadocsHeadingIds, anchors);

  return {
    ok: true,
    anchors,
    deepLinkIds,
    fumadocsHeadingIds,
  };
}

function assertUniqueIds(
  label: string,
  ids: string[],
  anchors: SpikeOperationAnchor[],
): void {
  const seen = new Map<string, SpikeOperationAnchor>();
  const collisions: Array<{
    id: string;
    left: SpikeOperationAnchor;
    right: SpikeOperationAnchor;
  }> = [];

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const anchor = anchors[i];
    if (id === undefined || anchor === undefined) {
      throw new Error(`Missing anchor entry at index ${i}`);
    }
    const prior = seen.get(id);
    if (prior) {
      collisions.push({ id, left: prior, right: anchor });
    } else {
      seen.set(id, anchor);
    }
  }

  if (collisions.length > 0) {
    const detail = collisions
      .map(
        (c) =>
          `${c.id}: ${c.left.method.toUpperCase()} ${c.left.path} vs ${c.right.method.toUpperCase()} ${c.right.path}`,
      )
      .join("; ");
    throw new Error(
      `OpenAPI spike ${label} anchor collision(s) (${collisions.length}): ${detail}`,
    );
  }
}
