import type { ReactElement } from "react";
import { SchemaReference } from "@/features/references/schema";
import { loadSchemaVerificationPackageModel } from "@/lib/references/load-schema-verification-models";
import type { SchemaVerificationPublicSubpath } from "@/lib/references/normalize-json-schema-artifact";
import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import type { SchemaAddress } from "@/lib/references/schema-model";

/**
 * Renders one addressed definition from a live schema artifact.
 *
 * Several docs pages each carried their own copy of this component — three of
 * them under the same file name — differing only in the page path, the JSON
 * pointer, and the slug substituted into `data-*` attributes. The model load,
 * cross-link resolver wiring, and `SchemaReference` flags were identical, so
 * they live here once.
 */
export type AddressedSchemaEmbedProps = {
  /** Attribute stem, e.g. `factories-packaged-factory-name`. */
  id: string;
  /** Canonical route for the page hosting this embed. */
  pagePath: string;
  /** JSON pointer of the definition to render, e.g. `/$defs/FactoryName`. */
  pointer: string;
  /** Schema artifact to load. Defaults to the Factory schema. */
  artifactId?: SchemaVerificationPublicSubpath;
};

export function AddressedSchemaEmbed({
  id,
  pagePath,
  pointer,
  artifactId = "schemas/factory",
}: AddressedSchemaEmbedProps) {
  const model = loadSchemaVerificationPackageModel(artifactId);
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
    pointer,
  };
  const definition = model.definitions.find(
    (entry) => entry.address.pointer === pointer,
  );

  return (
    <div
      className="min-w-0 space-y-3 overflow-x-auto"
      {...{ [`data-${id}-embed`]: "" }}
    >
      <SchemaReference
        address={address}
        data-testid={`${id}-schema`}
        definition={definition}
        definitions={model.definitions}
        pagePath={pagePath}
        resolve={resolve}
        root={model.root}
        showCatalog={false}
        showEmptyExamples={false}
        showFilter={false}
      />
    </div>
  );
}

/**
 * Builds one page's schema embed so the page module stays a short declaration
 * instead of a copied component.
 */
export function createAddressedSchemaEmbed(
  options: AddressedSchemaEmbedProps,
): () => ReactElement {
  return function Embed() {
    return <AddressedSchemaEmbed {...options} />;
  };
}
