/**
 * Page-local Factory schema mount for /docs/references/factory-schema.
 *
 * Resolves the W03 `schemas/factory` public subpath into a W04 model and mounts
 * the public W07 SchemaReference surface. Ownership stays page-local — do not
 * edit renderer internals under `src/features/references/schema/`.
 *
 * Catalog splay is Factory-page opt-in (`showCatalog`): sibling you-config /
 * mock-workers mounts keep `showCatalog={false}`. The published Factory package
 * `$defs` set is the transitive `$ref` closure from the root, so enabling the
 * catalog recursively renders referenced definition objects on this page.
 *
 * Full configuration example is a page-local authored `exampleInputs` override
 * aligned with the factories/configuration hermetic minimal sample — not a
 * sibling-schema default and not a live Factory host fetch.
 */

import type { SchemaCatalogSection } from "@/features/references/schema";
import { SchemaReference } from "@/features/references/schema";
import { ReferenceHashNavigation } from "@/features/references/shared";
import {
  loadSchemaVerificationPackageModel,
  type SchemaVerificationPackageModel,
} from "@/lib/references/load-schema-verification-models";
import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import type { SchemaAddress } from "@/lib/references/schema-model";
import { FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_INPUTS } from "./factory-schema-full-config-example";
import {
  factorySchemaGroupAnchor,
  groupFactorySchemaDefinitions,
} from "./factory-schema-groups";
import { collectFactorySchemaSplayDefinitions } from "./factory-schema-splay";

export const FACTORY_SCHEMA_PAGE_PATH = "/docs/references/factory-schema";

/**
 * The root object a `factory.json` file is. Rendered first, above the variant
 * sections, so the page opens on the thing a reader is actually authoring.
 */
export const FACTORY_SCHEMA_CORE_SECTION: SchemaCatalogSection = {
  id: "core",
  title: "Core configuration",
  description:
    "The root object of a factory configuration file. Every field below is declared directly on it; the sections that follow describe the objects it references.",
  anchor: factorySchemaGroupAnchor("core"),
};

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
          catalogGroups={groupFactorySchemaDefinitions(splayedDefinitions)}
          data-testid="factory-schema-reference"
          definitions={splayedDefinitions}
          exampleInputs={FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_INPUTS}
          pagePath={FACTORY_SCHEMA_PAGE_PATH}
          primarySection={FACTORY_SCHEMA_CORE_SECTION}
          resolve={buildResolve(model)}
          root={model.root}
          showCatalog
          // The whole catalog is rendered below, grouped, and listed again in
          // the right rail. Standing a third flat copy of it above the content
          // is the dump this page was rebuilt to remove — so the filter list
          // appears only once a reader actually types a query.
          showDefinitionListWhenEmpty={false}
          showEmptyExamples
          typeScale="page"
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
