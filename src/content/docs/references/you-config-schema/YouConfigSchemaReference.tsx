/**
 * Page-local You-config schema mount for /docs/references/you-config-schema.
 *
 * Resolves the W03 `schemas/you-config` public subpath into a W04 model and
 * mounts the public W07 SchemaReference surface. Ownership stays page-local —
 * do not edit renderer internals under `src/components/references/schema/`.
 */

import { SchemaReference } from "@/components/references/schema";
import {
  loadSchemaVerificationPackageModel,
  type SchemaVerificationPackageModel,
} from "@/lib/references/load-schema-verification-models";
import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import type { SchemaAddress } from "@/lib/references/schema-model";

export const YOU_CONFIG_SCHEMA_PAGE_PATH = "/docs/references/you-config-schema";

export type YouConfigSchemaReferenceProps = {
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
 * Mounts the complete You-config schema reference, or an accessible invalid
 * status when acquisition/normalization fails.
 */
export function YouConfigSchemaReference({
  loadModel = () => loadSchemaVerificationPackageModel("schemas/you-config"),
}: YouConfigSchemaReferenceProps = {}) {
  try {
    const model = loadModel();
    return (
      <SchemaReference
        data-testid="you-config-schema-reference"
        definitions={model.definitions}
        pagePath={YOU_CONFIG_SCHEMA_PAGE_PATH}
        resolve={buildResolve(model)}
        root={model.root}
        showCatalog={false}
        showEmptyExamples
      />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "You-config schema could not be loaded.";

    return (
      <SchemaReference
        data-testid="you-config-schema-reference"
        pagePath={YOU_CONFIG_SCHEMA_PAGE_PATH}
        status="invalid"
        statusMessage={message}
        statusTitle="You-config schema unavailable"
      />
    );
  }
}
