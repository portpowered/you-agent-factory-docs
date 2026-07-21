/**
 * Page-local You-config schema embed for /docs/factories/global-configuration.
 *
 * Loads the live package you-config schema through W03/W04 helpers and renders
 * root properties via the public W07 SchemaReference adapter. Do not paste
 * field contracts into messages or ship page-local schema JSON copies.
 */

import { SchemaReference } from "@/features/references/schema";
import { loadSchemaVerificationPackageModel } from "@/lib/references/load-schema-verification-models";
import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import type { SchemaAddress } from "@/lib/references/schema-model";

const PAGE_PATH = "/docs/factories/global-configuration";

export function YouConfigSchemaEmbed() {
  const model = loadSchemaVerificationPackageModel("schemas/you-config");
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
      data-factories-global-configuration-you-config-embed=""
    >
      <SchemaReference
        data-testid="factories-global-configuration-you-config-schema"
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
