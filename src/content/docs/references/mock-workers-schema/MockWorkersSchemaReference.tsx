/**
 * Page-local mock-workers schema mount for /docs/references/mock-workers-schema.
 *
 * Resolves the W03 `schemas/mock-workers` public subpath into a W04 model and
 * mounts the public W07 SchemaReference surface. Ownership stays page-local —
 * do not edit renderer internals under `src/components/references/schema/`.
 *
 * Recursive splay is page-local: expanded `fieldNodes` plus on-page `$defs`
 * catalog (`showCatalog`) so nested mockWorkers / unmatchedDispatchPolicy
 * detail and dependent defs are readable without opaque off-page `$ref` bounce.
 */

import { SchemaReference } from "@/components/references/schema";
import {
  loadSchemaVerificationPackageModel,
  type SchemaVerificationPackageModel,
} from "@/lib/references/load-schema-verification-models";
import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import type { SchemaAddress } from "@/lib/references/schema-model";
import { mockWorkersSchemaExampleInputs } from "./mock-workers-schema-examples";
import { splayMockWorkersSchemaFieldNodes } from "./mock-workers-schema-field-splay";

export const MOCK_WORKERS_SCHEMA_PAGE_PATH =
  "/docs/references/mock-workers-schema";

export type MockWorkersSchemaReferenceProps = {
  /**
   * Optional loader override for page-local error-path proofs. Production MDX
   * uses the default W03/W04 acquisition path.
   */
  loadModel?: () => SchemaVerificationPackageModel;
};

function buildResolve(model: SchemaVerificationPackageModel) {
  const resolver = createReferenceCrossLinkResolver({
    definitions: [model.root, ...model.definitions],
  });

  return (address: SchemaAddress) =>
    resolver.resolveRef({
      source: {
        publicArtifactId: address.publicArtifactId,
        pointer: address.pointer,
      },
      ref: address,
    });
}

/**
 * Mounts the complete mock-workers schema reference, or an accessible invalid
 * status when acquisition/normalization fails.
 */
export function MockWorkersSchemaReference({
  loadModel = () => loadSchemaVerificationPackageModel("schemas/mock-workers"),
}: MockWorkersSchemaReferenceProps = {}) {
  try {
    const model = loadModel();
    const fieldNodes = splayMockWorkersSchemaFieldNodes(
      model.root,
      model.definitions,
    );
    return (
      <SchemaReference
        data-testid="mock-workers-schema-reference"
        defaultExpanded
        definitions={model.definitions}
        exampleInputs={mockWorkersSchemaExampleInputs()}
        fieldNodes={fieldNodes}
        pagePath={MOCK_WORKERS_SCHEMA_PAGE_PATH}
        resolve={buildResolve(model)}
        root={model.root}
        showCatalog
        showEmptyExamples
      />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Mock-workers schema could not be loaded.";

    return (
      <SchemaReference
        data-testid="mock-workers-schema-reference"
        pagePath={MOCK_WORKERS_SCHEMA_PAGE_PATH}
        status="invalid"
        statusMessage={message}
        statusTitle="Mock-workers schema unavailable"
      />
    );
  }
}
