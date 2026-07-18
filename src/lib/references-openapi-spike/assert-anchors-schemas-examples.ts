/**
 * Child-process assertion for W01 anchors, schema presence, and examples.
 *
 * Run with plain `bun` (not `bun test`) so happy-dom is not registered.
 */

import { loadSpikeAnchorInventory } from "./spike-anchor-inventory";

const inventory = await loadSpikeAnchorInventory();

if (inventory.anchors.length !== inventory.projectionOperationCount) {
  throw new Error(
    `Anchor count ${inventory.anchors.length} != projection ${inventory.projectionOperationCount}`,
  );
}

// Most operations expose JSON response schemas. A small number (for example
// DELETE close-session) are intentionally no-content and have no body schema.
if (inventory.operationsWithResponseSchema < inventory.anchors.length - 1) {
  throw new Error(
    `Expected nearly every operation to expose a response schema link surface; got ${inventory.operationsWithResponseSchema}/${inventory.anchors.length}`,
  );
}

const noContentOps = inventory.packagedOperations.filter(
  (op) => !op.hasResponseSchema,
);
if (
  noContentOps.length !== 1 ||
  noContentOps[0]?.operationId !== "closeFactorySession"
) {
  throw new Error(
    `Unexpected no-content response ops: ${JSON.stringify(noContentOps)}`,
  );
}

// Fumadocs generates request examples (authored or sampled) for every
// operation; authored media examples are optional but must remain visible
// when present.
if (inventory.operationsWithAuthoredMediaExamples < 1) {
  throw new Error(
    "Expected at least one authored media example in the packaged OpenAPI document",
  );
}

const deepLinkIds = new Set(inventory.anchors.map((a) => a.deepLinkId));
const headingIds = new Set(inventory.anchors.map((a) => a.fumadocsHeadingId));
if (deepLinkIds.size !== inventory.anchors.length) {
  throw new Error("Deep-link id set size mismatch after inventory load");
}
if (headingIds.size !== inventory.anchors.length) {
  throw new Error("Fumadocs heading id set size mismatch after inventory load");
}

process.stdout.write(
  `${JSON.stringify({
    ok: true,
    operationCount: inventory.anchors.length,
    deepLinkSample: inventory.anchors.slice(0, 3).map((a) => ({
      operationId: a.operationId,
      deepLinkId: a.deepLinkId,
      fumadocsHeadingId: a.fumadocsHeadingId,
    })),
    operationsWithRequestBodySchema: inventory.operationsWithRequestBodySchema,
    operationsWithResponseSchema: inventory.operationsWithResponseSchema,
    operationsWithAuthoredMediaExamples:
      inventory.operationsWithAuthoredMediaExamples,
  })}\n`,
);
