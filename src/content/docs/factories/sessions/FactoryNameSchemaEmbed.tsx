/**
 * Page-local Factory name schema embed for /docs/factories/sessions.
 *
 * Renders the addressed FactoryName definition from the live Factory schema so
 * the Factory a session loads stays schema-backed. Exhaustive FactorySession /
 * API / events lookup stays on the full reference pages (session contracts live
 * in OpenAPI, not the W07 JSON Schema package models).
 */

import { SchemaReference } from "@/components/references/schema";
import { loadSchemaVerificationPackageModel } from "@/lib/references/load-schema-verification-models";
import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import type { SchemaAddress } from "@/lib/references/schema-model";

const PAGE_PATH = "/docs/factories/sessions";
const FACTORY_NAME_POINTER = "/$defs/FactoryName";

export function FactoryNameSchemaEmbed() {
  const model = loadSchemaVerificationPackageModel("schemas/factory");
  const resolver = createReferenceCrossLinkResolver({
    definitions: [model.root, ...model.definitions],
  });
  const resolve = (address: SchemaAddress) =>
    resolver.resolveRef({
      source: {
        publicArtifactId: address.publicArtifactId,
        pointer: address.pointer,
      },
      ref: address,
    });
  const address: SchemaAddress = {
    publicArtifactId: model.root.address.publicArtifactId,
    pointer: FACTORY_NAME_POINTER,
  };
  const definition = model.definitions.find(
    (entry) => entry.address.pointer === FACTORY_NAME_POINTER,
  );

  return (
    <div
      className="min-w-0 space-y-3 overflow-x-auto"
      data-factories-sessions-factory-name-embed=""
    >
      <SchemaReference
        address={address}
        data-testid="factories-sessions-factory-name-schema"
        definition={definition}
        definitions={model.definitions}
        pagePath={PAGE_PATH}
        resolve={resolve}
        root={model.root}
        showCatalog={false}
        showEmptyExamples={false}
        showFilter={false}
      />
    </div>
  );
}
