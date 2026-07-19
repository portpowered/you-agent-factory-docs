/**
 * Pure proofs for Factory schema transitive `$ref` splay selection.
 */
import { describe, expect, test } from "bun:test";
import {
  createSchemaAddress,
  createSchemaDefinitionModel,
} from "@/lib/references/schema-model";
import {
  collectFactorySchemaSplayDefinitions,
  collectSchemaDefinitionOutboundAddresses,
} from "./factory-schema-splay";

const ARTIFACT = "@you-agent-factory/api/schemas/factory";

function addr(pointer: string) {
  return createSchemaAddress({ publicArtifactId: ARTIFACT, pointer });
}

describe("collectSchemaDefinitionOutboundAddresses", () => {
  test("collects refTarget, itemSchema, and composition members without inventing", () => {
    const definition = createSchemaDefinitionModel({
      address: addr("/schemas/factory"),
      properties: {
        workers: {
          path: "workers",
          required: true,
          itemSchema: addr("/$defs/Worker"),
        },
        name: {
          path: "name",
          required: false,
          refTarget: addr("/$defs/FactoryName"),
        },
      },
      composition: {
        oneOf: [addr("/$defs/A"), addr("/$defs/B")],
      },
    });

    const outbound = collectSchemaDefinitionOutboundAddresses(definition);
    const pointers = outbound.map((entry) => entry.pointer).sort();
    expect(pointers).toEqual([
      "/$defs/A",
      "/$defs/B",
      "/$defs/FactoryName",
      "/$defs/Worker",
    ]);
  });
});

describe("collectFactorySchemaSplayDefinitions", () => {
  test("recursively collects transitive $ref closure and skips missing targets", () => {
    const worker = createSchemaDefinitionModel({
      address: addr("/$defs/Worker"),
      title: "Worker",
      properties: {
        type: {
          path: "type",
          required: true,
          refTarget: addr("/$defs/WorkerType"),
        },
      },
    });
    const workerType = createSchemaDefinitionModel({
      address: addr("/$defs/WorkerType"),
      title: "WorkerType",
      enum: ["agent", "human"],
    });
    const unused = createSchemaDefinitionModel({
      address: addr("/$defs/Unused"),
      title: "Unused",
    });
    const root = createSchemaDefinitionModel({
      address: addr("/schemas/factory"),
      title: "Factory",
      properties: {
        workers: {
          path: "workers",
          required: true,
          itemSchema: addr("/$defs/Worker"),
        },
        missing: {
          path: "missing",
          required: false,
          refTarget: addr("/$defs/DoesNotExist"),
        },
      },
    });

    const splayed = collectFactorySchemaSplayDefinitions(root, [
      worker,
      workerType,
      unused,
    ]);

    expect(splayed.map((entry) => entry.address.pointer)).toEqual([
      "/$defs/Worker",
      "/$defs/WorkerType",
    ]);
    expect(
      splayed.some((entry) => entry.address.pointer === "/$defs/Unused"),
    ).toBe(false);
    expect(
      splayed.some((entry) => entry.address.pointer === "/$defs/DoesNotExist"),
    ).toBe(false);
  });

  test("is cycle-safe when definitions mutually reference each other", () => {
    const nodeA = createSchemaDefinitionModel({
      address: addr("/$defs/NodeA"),
      properties: {
        next: {
          path: "next",
          required: false,
          refTarget: addr("/$defs/NodeB"),
        },
      },
    });
    const nodeB = createSchemaDefinitionModel({
      address: addr("/$defs/NodeB"),
      properties: {
        next: {
          path: "next",
          required: false,
          refTarget: addr("/$defs/NodeA"),
        },
      },
    });
    const root = createSchemaDefinitionModel({
      address: addr("/schemas/factory"),
      properties: {
        start: {
          path: "start",
          required: true,
          refTarget: addr("/$defs/NodeA"),
        },
      },
    });

    const splayed = collectFactorySchemaSplayDefinitions(root, [nodeA, nodeB]);
    expect(splayed.map((entry) => entry.address.pointer).sort()).toEqual([
      "/$defs/NodeA",
      "/$defs/NodeB",
    ]);
  });
});
