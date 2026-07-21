/**
 * Child-process assertion: tag-nav model aligns with per:"file" projection.
 *
 * Run with plain `bun` (not `bun test`) so happy-dom is not registered.
 */

import { buildApiOperationNavigationFromArtifact } from "./load-operation-navigation";
import { loadApiOpenApiSinglePageProjection } from "./openapi-server";

const nav = buildApiOperationNavigationFromArtifact();
const projection = await loadApiOpenApiSinglePageProjection();

if (nav.model.operationCount !== projection.normalizedOperations.length) {
  throw new Error(
    `Nav ops ${nav.model.operationCount} != projection ${projection.normalizedOperations.length}`,
  );
}
if (nav.model.operationCount !== projection.operations.length) {
  throw new Error(
    `Nav ops ${nav.model.operationCount} != fumadocs ops ${projection.operations.length}`,
  );
}

const projectionAnchors = new Set(
  projection.normalizedOperations.map((op) => op.anchor),
);
for (const group of nav.model.groups) {
  for (const item of group.items) {
    if (!projectionAnchors.has(item.anchor)) {
      throw new Error(
        `Nav anchor #${item.anchor} missing from projection inventory`,
      );
    }
  }
}

if (nav.model.groups.length === 0) {
  throw new Error("Expected at least one tag group");
}
if (nav.documentTagOrder.length === 0) {
  throw new Error("Expected document tag order from packaged OpenAPI");
}

process.stdout.write(
  `${JSON.stringify({
    ok: true,
    operationCount: nav.model.operationCount,
    linkCount: nav.model.linkCount,
    tagGroups: nav.model.groups.map((g) => g.tag),
    documentTagOrder: nav.documentTagOrder,
    projectionOperationCount: projection.operations.length,
    pageCount: projection.pageCount,
  })}\n`,
);
