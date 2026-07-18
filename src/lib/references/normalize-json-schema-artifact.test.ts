import { describe, expect, test } from "bun:test";
import { resolveApiPackageArtifact } from "./api-package-artifact-resolver";
import {
  JsonSchemaNormalizeError,
  normalizeJsonSchemaArtifact,
  SCHEMA_VERIFICATION_PUBLIC_SUBPATHS,
} from "./normalize-json-schema-artifact";

describe("normalizeJsonSchemaArtifact", () => {
  test("rejects bare root pointer /", () => {
    expect(() =>
      normalizeJsonSchemaArtifact(
        { type: "object" },
        {
          publicArtifactId: "@you-agent-factory/api/schemas/factory",
          rootPointer: "/",
        },
      ),
    ).toThrow(JsonSchemaNormalizeError);
  });

  test("normalizes fixture-shaped schema with $defs, $ref, and oneOf", () => {
    const fixture = {
      title: "FixtureSchema",
      type: "object",
      required: ["content"],
      properties: {
        content: { $ref: "#/$defs/BundledFileContent" },
        name: { type: "string", description: "Display name" },
      },
      $defs: {
        BundledFileContent: {
          type: "string",
          description: "File body",
        },
        WorkContentPart: {
          oneOf: [
            { $ref: "#/$defs/WorkTextContentPart" },
            { $ref: "#/$defs/WorkImageContentPart" },
          ],
        },
        WorkTextContentPart: { type: "object", title: "Text" },
        WorkImageContentPart: { type: "object", title: "Image" },
      },
      examples: [{ name: "demo" }],
    };

    const { root, definitions } = normalizeJsonSchemaArtifact(fixture, {
      publicArtifactId: "@you-agent-factory/api/schemas/factory",
      rootPointer: "/schemas/factory",
    });

    expect(root.title).toBe("FixtureSchema");
    expect(root.address.pointer).toBe("/schemas/factory");
    expect(root.properties?.content?.refTarget?.pointer).toBe(
      "/$defs/BundledFileContent",
    );
    expect(root.properties?.name?.description).toBe("Display name");
    expect(root.examples).toEqual([{ name: "demo" }]);
    expect(definitions.length).toBe(4);

    const part = definitions.find((definition) =>
      definition.address.pointer.endsWith("/WorkContentPart"),
    );
    expect(part?.composition?.oneOf?.map((entry) => entry.pointer)).toEqual([
      "/$defs/WorkTextContentPart",
      "/$defs/WorkImageContentPart",
    ]);
  });

  test("consumes W03-resolved factory / you-config / mock-workers schemas", () => {
    for (const subpath of SCHEMA_VERIFICATION_PUBLIC_SUBPATHS) {
      const artifact = resolveApiPackageArtifact(subpath);
      const { root, definitions } = normalizeJsonSchemaArtifact(artifact.data, {
        publicArtifactId: artifact.specifier,
        rootPointer: `/schemas/${subpath.split("/").at(-1)}`,
      });

      expect(root.address.publicArtifactId).toBe(artifact.specifier);
      expect(root.type).toBe("object");
      expect(Object.keys(root.properties ?? {}).length).toBeGreaterThan(0);
      expect(definitions.length).toBeGreaterThan(0);
      expect(root.title).toBeTruthy();
    }
  });
});
