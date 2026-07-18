/**
 * Page-local JavaScript orchestrator config embed for /docs/factories/dynamic-workflows.
 *
 * Renders addressed FactoryOrchestratorJavaScriptConfig from the live Factory
 * schema so dynamic-workflow source identity, argsSchema, and policy knobs stay
 * schema-backed. Exhaustive lookup stays on the full schema / API references.
 */

import { SchemaReference } from "@/components/references/schema";
import { loadSchemaVerificationPackageModel } from "@/lib/references/load-schema-verification-models";
import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import type { SchemaAddress } from "@/lib/references/schema-model";

const PAGE_PATH = "/docs/factories/dynamic-workflows";
const JS_CONFIG_POINTER = "/$defs/FactoryOrchestratorJavaScriptConfig";

export function FactoryOrchestratorJavaScriptConfigSchemaEmbed() {
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
    pointer: JS_CONFIG_POINTER,
  };
  const definition = model.definitions.find(
    (entry) => entry.address.pointer === JS_CONFIG_POINTER,
  );

  return (
    <div
      className="min-w-0 space-y-3 overflow-x-auto"
      data-factories-dynamic-workflows-js-config-embed=""
    >
      <SchemaReference
        address={address}
        data-testid="factories-dynamic-workflows-js-config-schema"
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
