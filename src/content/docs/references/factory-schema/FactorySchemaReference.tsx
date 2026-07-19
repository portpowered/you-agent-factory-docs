/**
 * Page-local Factory schema mount for /docs/references/factory-schema.
 *
 * Resolves the W03 `schemas/factory` public subpath into a W04 model and mounts
 * the public W07 SchemaReference surface. Ownership stays page-local — do not
 * edit renderer internals under `src/components/references/schema/`.
 *
 * Catalog splay is Factory-page opt-in (`showCatalog`): sibling you-config /
 * mock-workers mounts keep `showCatalog={false}`. The published Factory package
 * `$defs` set is the transitive `$ref` closure from the root, so enabling the
 * catalog recursively renders referenced definition objects on this page.
 */

import { SchemaReference } from "@/components/references/schema";
import { ReferenceHashNavigation } from "@/components/references/shared";
import {
  loadSchemaVerificationPackageModel,
  type SchemaVerificationPackageModel,
} from "@/lib/references/load-schema-verification-models";
import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import type { SchemaAddress } from "@/lib/references/schema-model";
import { collectFactorySchemaSplayDefinitions } from "./factory-schema-splay";

export const FACTORY_SCHEMA_PAGE_PATH = "/docs/references/factory-schema";

export type FactorySchemaReferenceProps = {
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
 * Mounts the complete Factory schema reference, or an accessible invalid status
 * when acquisition/normalization fails.
 */
export function FactorySchemaReference({
  loadModel = () => loadSchemaVerificationPackageModel("schemas/factory"),
}: FactorySchemaReferenceProps = {}) {
  try {
    const model = loadModel();
    const splayedDefinitions = collectFactorySchemaSplayDefinitions(
      model.root,
      model.definitions,
    );
    return (
      <>
        <ReferenceHashNavigation data-testid="factory-schema-hash-navigation" />
        <SchemaReference
          data-testid="factory-schema-reference"
          definitions={splayedDefinitions}
          pagePath={FACTORY_SCHEMA_PAGE_PATH}
          resolve={buildResolve(model)}
          root={model.root}
          showCatalog
          showEmptyExamples
        />
      </>
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Factory schema could not be loaded.";

    return (
      <SchemaReference
        data-testid="factory-schema-reference"
        pagePath={FACTORY_SCHEMA_PAGE_PATH}
        status="invalid"
        statusMessage={message}
        statusTitle="Factory schema unavailable"
      />
    );
  }
}
