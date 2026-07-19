/**
 * Page-local System-config schema mount for /docs/references/system-config-schema.
 *
 * Resolves the W03 `schemas/you-config` public subpath into a W04 model and
 * mounts the public W07 SchemaReference surface. Ownership stays page-local —
 * do not edit renderer internals under `src/components/references/schema/`.
 * Upstream package acquisition remains `schemas/you-config`.
 */

import {
  SchemaReference,
  schemaPointerAnchor,
} from "@/components/references/schema";
import {
  loadSchemaVerificationPackageModel,
  type SchemaVerificationPackageModel,
} from "@/lib/references/load-schema-verification-models";
import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import {
  projectSchemaDefinitionToDisplay,
  type ReferenceDisplayProjection,
} from "@/lib/references/reference-display-projection";
import type {
  SchemaAddress,
  SchemaDefinitionModel,
} from "@/lib/references/schema-model";

export const SYSTEM_CONFIG_SCHEMA_PAGE_PATH =
  "/docs/references/system-config-schema";

/** Reader-facing root header; overrides upstream package title on this page only. */
export const SYSTEM_CONFIG_SCHEMA_ROOT_TITLE = "System configuration";

export type SystemConfigSchemaReferenceProps = {
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
 * Page-local display projection so the root heading reads as a clear System
 * configuration title without changing the upstream `schemas/you-config` model.
 */
function buildRootDisplayProjection(
  root: SchemaDefinitionModel,
): ReferenceDisplayProjection {
  return {
    ...projectSchemaDefinitionToDisplay(root, {
      id: "system-config-schema.root",
      family: "schema",
      anchor: schemaPointerAnchor(root.address.pointer),
      source: {
        publicArtifactId: root.address.publicArtifactId,
        pointer: root.address.pointer,
      },
      pagePath: SYSTEM_CONFIG_SCHEMA_PAGE_PATH,
    }),
    title: SYSTEM_CONFIG_SCHEMA_ROOT_TITLE,
  };
}

/**
 * Mounts the complete System-config schema reference, or an accessible invalid
 * status when acquisition/normalization fails.
 */
export function SystemConfigSchemaReference({
  loadModel = () => loadSchemaVerificationPackageModel("schemas/you-config"),
}: SystemConfigSchemaReferenceProps = {}) {
  try {
    const model = loadModel();
    return (
      <SchemaReference
        data-testid="system-config-schema-reference"
        definitions={model.definitions}
        pagePath={SYSTEM_CONFIG_SCHEMA_PAGE_PATH}
        projection={buildRootDisplayProjection(model.root)}
        resolve={buildResolve(model)}
        root={model.root}
        showCatalog={false}
        showEmptyExamples
        showFilter={false}
      />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "System configuration schema could not be loaded.";

    return (
      <SchemaReference
        data-testid="system-config-schema-reference"
        pagePath={SYSTEM_CONFIG_SCHEMA_PAGE_PATH}
        status="invalid"
        statusMessage={message}
        statusTitle="System configuration schema unavailable"
      />
    );
  }
}
