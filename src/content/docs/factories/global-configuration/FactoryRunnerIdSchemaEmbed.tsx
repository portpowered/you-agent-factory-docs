/**
 * Page-local Factory RunnerID schema embed for
 * /docs/factories/global-configuration.
 *
 * Shows the live factory-level runner identifier contract so operators can
 * distinguish topology-owned runner from operator model defaults in you-config.
 */

import { SchemaReference } from "@/components/references/schema";
import { loadSchemaVerificationPackageModel } from "@/lib/references/load-schema-verification-models";
import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import type { SchemaAddress } from "@/lib/references/schema-model";

const PAGE_PATH = "/docs/factories/global-configuration";
const RUNNER_ID_POINTER = "/$defs/RunnerID";

export function FactoryRunnerIdSchemaEmbed() {
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
    pointer: RUNNER_ID_POINTER,
  };
  const definition = model.definitions.find(
    (entry) => entry.address.pointer === RUNNER_ID_POINTER,
  );

  return (
    <div
      className="min-w-0 space-y-3 overflow-x-auto"
      data-factories-global-configuration-runner-id-embed=""
    >
      <SchemaReference
        address={address}
        data-testid="factories-global-configuration-runner-id-schema"
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
