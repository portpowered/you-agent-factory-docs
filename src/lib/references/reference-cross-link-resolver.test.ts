import { describe, expect, test } from "bun:test";
import {
  createReferenceCrossLinkResolver,
  normalizeJsonPointer,
  parseRefToSchemaAddress,
  ReferenceCrossLinkResolverError,
} from "./reference-cross-link-resolver";
import type { ReferenceSourcePointer } from "./reference-item";
import {
  createSchemaAddress,
  createSchemaDefinitionModel,
  type SchemaDefinitionModel,
} from "./schema-model";

const ARTIFACT = "@you-agent-factory/api/openapi";

function source(
  pointer = "/components/schemas/FactoryEvent",
): ReferenceSourcePointer {
  return {
    publicArtifactId: ARTIFACT,
    pointer,
    path: "generated/openapi/openapi.yaml",
  };
}

function address(pointer: string) {
  return createSchemaAddress({ publicArtifactId: ARTIFACT, pointer });
}

function definition(
  pointer: string,
  overrides: Partial<SchemaDefinitionModel> = {},
): SchemaDefinitionModel {
  return createSchemaDefinitionModel({
    address: address(pointer),
    title: pointer.split("/").at(-1),
    type: "object",
    ...overrides,
  });
}

describe("normalizeJsonPointer / parseRefToSchemaAddress", () => {
  test("normalizes #/…, /…, and bare pointer forms", () => {
    expect(normalizeJsonPointer("#/components/schemas/Foo")).toBe(
      "/components/schemas/Foo",
    );
    expect(normalizeJsonPointer("/components/schemas/Foo")).toBe(
      "/components/schemas/Foo",
    );
    expect(normalizeJsonPointer("components/schemas/Foo")).toBe(
      "/components/schemas/Foo",
    );
  });

  test("parses local refs against the source artifact id", () => {
    expect(
      parseRefToSchemaAddress("#/components/schemas/Worker", ARTIFACT),
    ).toEqual(address("/components/schemas/Worker"));
    expect(
      parseRefToSchemaAddress("/components/schemas/Worker", ARTIFACT),
    ).toEqual(address("/components/schemas/Worker"));
  });

  test("parses absolute artifactId#pointer refs", () => {
    expect(
      parseRefToSchemaAddress(
        `${ARTIFACT}#/components/schemas/Worker`,
        "ignored",
      ),
    ).toEqual(address("/components/schemas/Worker"));
  });

  test("rejects empty and malformed refs", () => {
    expect(() => parseRefToSchemaAddress("", ARTIFACT)).toThrow(
      ReferenceCrossLinkResolverError,
    );
    expect(() => parseRefToSchemaAddress("#", ARTIFACT)).toThrow(
      ReferenceCrossLinkResolverError,
    );
    expect(() =>
      parseRefToSchemaAddress("#/components/schemas/Foo", ""),
    ).toThrow(ReferenceCrossLinkResolverError);
  });
});

describe("ReferenceCrossLinkResolver.resolveRef", () => {
  test("resolves internal $ref targets to normalized addresses and anchors", () => {
    const resolver = createReferenceCrossLinkResolver({
      definitions: [definition("/components/schemas/Worker")],
    });

    const outcome = resolver.resolveRef({
      source: source("/components/schemas/Factory/properties/worker"),
      ref: "#/components/schemas/Worker",
    });

    expect(outcome.kind).toBe("resolved");
    if (outcome.kind !== "resolved") {
      return;
    }
    expect(outcome.target).toEqual(address("/components/schemas/Worker"));
    expect(outcome.anchor).toBe("components-schemas-Worker");
    expect(outcome.depth).toBe(0);
    // Source pointer preserved from the originating node.
    expect(outcome.source).toEqual(
      source("/components/schemas/Factory/properties/worker"),
    );
    expect(outcome.source.path).toBe("generated/openapi/openapi.yaml");
  });

  test("returns missing for unknown targets without inventing definitions", () => {
    const resolver = createReferenceCrossLinkResolver();
    const outcome = resolver.resolveRef({
      source: source(),
      ref: "#/components/schemas/DoesNotExist",
    });

    expect(outcome).toEqual({
      kind: "missing",
      source: source(),
      target: address("/components/schemas/DoesNotExist"),
    });
    expect(
      resolver.getDefinition(address("/components/schemas/DoesNotExist")),
    ).toBeUndefined();
  });

  test("returns malformed for unparsable refs with actionable message", () => {
    const resolver = createReferenceCrossLinkResolver();
    const outcome = resolver.resolveRef({
      source: source(),
      ref: "",
    });

    expect(outcome.kind).toBe("malformed");
    if (outcome.kind !== "malformed") {
      return;
    }
    expect(outcome.rawRef).toBe("");
    expect(outcome.message).toMatch(/empty|Malformed/i);
    expect(outcome.source).toEqual(source());
  });

  test("detects cycles when the target is already on the visited path", () => {
    const resolver = createReferenceCrossLinkResolver({
      definitions: [definition("/components/schemas/Node")],
    });

    const outcome = resolver.resolveRef({
      source: source("/components/schemas/Node/properties/next"),
      ref: "#/components/schemas/Node",
      visited: [address("/components/schemas/Node")],
    });

    expect(outcome.kind).toBe("cycle");
    if (outcome.kind !== "cycle") {
      return;
    }
    expect(outcome.cycleAt).toEqual(address("/components/schemas/Node"));
    expect(outcome.target).toEqual(address("/components/schemas/Node"));
    expect(outcome.source.pointer).toBe(
      "/components/schemas/Node/properties/next",
    );
    expect(outcome.path.map((entry) => entry.pointer)).toEqual([
      "/components/schemas/Node",
      "/components/schemas/Node",
    ]);
  });
});

describe("ReferenceCrossLinkResolver.resolveRefChain", () => {
  test("follows refTarget wrappers to a terminal definition", () => {
    const resolver = createReferenceCrossLinkResolver({
      definitions: [
        definition("/components/schemas/Alias", {
          refTarget: address("/components/schemas/Worker"),
        }),
        definition("/components/schemas/Worker"),
      ],
    });

    const outcome = resolver.resolveRefChain({
      source: source("/paths/~1work/post/requestBody"),
      ref: "#/components/schemas/Alias",
    });

    expect(outcome.kind).toBe("resolved");
    if (outcome.kind !== "resolved") {
      return;
    }
    expect(outcome.target.pointer).toBe("/components/schemas/Worker");
    expect(outcome.anchor).toBe("components-schemas-Worker");
    expect(outcome.depth).toBe(1);
    expect(outcome.source.pointer).toBe("/paths/~1work/post/requestBody");
  });

  test("returns cycle sentinel on A→B→A without hanging", () => {
    const resolver = createReferenceCrossLinkResolver({
      definitions: [
        definition("/components/schemas/A", {
          refTarget: address("/components/schemas/B"),
        }),
        definition("/components/schemas/B", {
          refTarget: address("/components/schemas/A"),
        }),
      ],
    });

    const outcome = resolver.resolveRefChain({
      source: source("/components/schemas/Root"),
      ref: "#/components/schemas/A",
    });

    expect(outcome.kind).toBe("cycle");
    if (outcome.kind !== "cycle") {
      return;
    }
    expect(outcome.source.pointer).toBe("/components/schemas/Root");
    expect(outcome.path.map((entry) => entry.pointer)).toEqual([
      "/components/schemas/A",
      "/components/schemas/B",
      "/components/schemas/A",
    ]);
    expect(outcome.cycleAt.pointer).toBe("/components/schemas/A");
  });

  test("self-ref wrapper reports cycle", () => {
    const resolver = createReferenceCrossLinkResolver({
      definitions: [
        definition("/components/schemas/Loop", {
          refTarget: address("/components/schemas/Loop"),
        }),
      ],
    });

    const outcome = resolver.resolveRefChain({
      source: source(),
      ref: "#/components/schemas/Loop",
    });

    expect(outcome.kind).toBe("cycle");
    if (outcome.kind !== "cycle") {
      return;
    }
    expect(outcome.cycleAt.pointer).toBe("/components/schemas/Loop");
  });
});

describe("ReferenceCrossLinkResolver.resolveDiscriminator", () => {
  test("resolves mapping values to declared targets without unbounded expansion", () => {
    const text = definition("/components/schemas/WorkTextContentPart");
    const image = definition("/components/schemas/WorkImageContentPart", {
      // Nested ref on the mapped target must not be expanded by discriminator.
      refTarget: address("/components/schemas/WorkImagePayload"),
    });
    const resolver = createReferenceCrossLinkResolver({
      definitions: [text, image],
    });

    const result = resolver.resolveDiscriminator({
      source: source("/components/schemas/WorkContentPart"),
      discriminator: {
        propertyName: "type",
        mapping: {
          text: address("/components/schemas/WorkTextContentPart"),
          image: address("/components/schemas/WorkImageContentPart"),
        },
      },
    });

    expect(result.propertyName).toBe("type");
    expect(result.mappings.text?.kind).toBe("resolved");
    expect(result.mappings.image?.kind).toBe("resolved");
    if (
      result.mappings.text?.kind !== "resolved" ||
      result.mappings.image?.kind !== "resolved"
    ) {
      return;
    }
    // One-hop only: image maps to WorkImageContentPart, not WorkImagePayload.
    expect(result.mappings.text.target.pointer).toBe(
      "/components/schemas/WorkTextContentPart",
    );
    expect(result.mappings.image.target.pointer).toBe(
      "/components/schemas/WorkImageContentPart",
    );
    expect(result.mappings.image.depth).toBe(0);
    expect(result.mappings.text.source.pointer).toBe(
      "/components/schemas/WorkContentPart/discriminator/mapping/text",
    );
    expect(result.mappings.image.source.path).toBe(
      "generated/openapi/openapi.yaml",
    );
  });

  test("reports missing and malformed discriminator mapping targets", () => {
    const resolver = createReferenceCrossLinkResolver({
      definitions: [definition("/components/schemas/Known")],
    });

    const result = resolver.resolveDiscriminator({
      source: source("/components/schemas/Envelope"),
      discriminator: {
        propertyName: "type",
        mapping: {
          known: address("/components/schemas/Known"),
          gone: address("/components/schemas/Missing"),
        },
      },
    });

    expect(result.mappings.known?.kind).toBe("resolved");
    expect(result.mappings.gone?.kind).toBe("missing");
    if (result.mappings.gone?.kind !== "missing") {
      return;
    }
    expect(result.mappings.gone.target.pointer).toBe(
      "/components/schemas/Missing",
    );
    expect(result.mappings.gone.source.pointer).toContain(
      "discriminator/mapping/gone",
    );
  });
});

describe("ReferenceCrossLinkResolver catalog", () => {
  test("indexes nested full definitions from registerDefinition", () => {
    const resolver = createReferenceCrossLinkResolver();
    resolver.registerDefinition(
      definition("/components/schemas/Parent", {
        definitions: {
          Child: definition("/components/schemas/Parent/$defs/Child"),
          Deferred: address("/components/schemas/Elsewhere"),
        },
      }),
    );

    expect(resolver.hasDefinition(address("/components/schemas/Parent"))).toBe(
      true,
    );
    expect(
      resolver.hasDefinition(address("/components/schemas/Parent/$defs/Child")),
    ).toBe(true);
    expect(
      resolver.hasDefinition(address("/components/schemas/Elsewhere")),
    ).toBe(false);
  });
});
