/**
 * Factories-index Factory root schema embed for /docs/factories.
 *
 * Loads the live package Factory schema through W03/W04 helpers and renders
 * the root definition summary via the public W07 SchemaReference adapter.
 * Exhaustive field lookup stays on /docs/references/schema.
 */

import { SchemaReference } from "@/components/references/schema";
import { loadSchemaVerificationPackageModel } from "@/lib/references/load-schema-verification-models";
import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import type { SchemaAddress } from "@/lib/references/schema-model";

const PAGE_PATH = "/docs/factories";

export function FactoryRootSummaryEmbed() {
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

  return (
    <div
      className="min-w-0 space-y-3 overflow-x-auto"
      data-factories-index-schema-embed=""
    >
      <SchemaReference
        data-testid="factories-index-factory-root-schema"
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
