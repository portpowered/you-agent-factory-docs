/**
 * Coverage for the Factory schema page's information architecture.
 *
 * The load-bearing property is that grouping is *total*: every published
 * definition lands in exactly one section. A definition that fell through would
 * silently vanish from a page whose whole job is to be the complete schema.
 */

import { describe, expect, test } from "bun:test";
import { loadSchemaVerificationPackageModel } from "@/lib/references/load-schema-verification-models";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";
import {
  factorySchemaDefinitionName,
  factorySchemaGroupAnchor,
  groupFactorySchemaDefinitions,
} from "./factory-schema-groups";
import { collectFactorySchemaSplayDefinitions } from "./factory-schema-splay";

function publishedDefinitions(): readonly SchemaDefinitionModel[] {
  const model = loadSchemaVerificationPackageModel("schemas/factory");
  return collectFactorySchemaSplayDefinitions(model.root, model.definitions);
}

function stubDefinition(name: string): SchemaDefinitionModel {
  return {
    address: {
      publicArtifactId: "schemas/factory",
      pointer: `/$defs/${name}`,
    },
  } as SchemaDefinitionModel;
}

describe("groupFactorySchemaDefinitions", () => {
  test("places every published definition in exactly one section", () => {
    const definitions = publishedDefinitions();
    expect(definitions.length).toBeGreaterThan(0);

    const groups = groupFactorySchemaDefinitions(definitions);
    const grouped = groups.flatMap((group) => group.definitions);

    expect(grouped.length).toBe(definitions.length);
    expect(new Set(grouped.map((entry) => entry.address.pointer)).size).toBe(
      definitions.length,
    );
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  test("orders sections core-adjacent first and shared types last", () => {
    const groups = groupFactorySchemaDefinitions(publishedDefinitions());

    expect(groups.map((group) => group.id).slice(0, 3)).toEqual([
      "workers",
      "workstations",
      "work",
    ]);
    expect(groups.at(-1)?.id).toBe("shared");
  });

  test("leads each subject section with the object it is named for", () => {
    const groups = groupFactorySchemaDefinitions(publishedDefinitions());
    const leadOf = (id: string) => {
      const group = groups.find((entry) => entry.id === id);
      if (group === undefined) {
        throw new Error(`missing group: ${id}`);
      }
      return factorySchemaDefinitionName(group.definitions[0] as never);
    };

    expect(leadOf("workers")).toBe("Worker");
    expect(leadOf("workstations")).toBe("Workstation");
    expect(leadOf("work")).toBe("WorkType");
    expect(leadOf("resources")).toBe("Resource");
  });

  test("claims Workstation variants before the broader Work sweep", () => {
    const groups = groupFactorySchemaDefinitions([
      stubDefinition("Workstation"),
      stubDefinition("WorkstationCron"),
      stubDefinition("WorkType"),
      stubDefinition("WorkContentPart"),
      stubDefinition("Worker"),
      stubDefinition("WorkerProvider"),
      stubDefinition("WorkPropagation"),
    ]);

    const namesIn = (id: string) =>
      (groups.find((group) => group.id === id)?.definitions ?? []).map(
        factorySchemaDefinitionName,
      );

    expect(namesIn("workers")).toEqual(["Worker", "WorkerProvider"]);
    expect(namesIn("workstations")).toEqual([
      "Workstation",
      "WorkPropagation",
      "WorkstationCron",
    ]);
    expect(namesIn("work")).toEqual(["WorkType", "WorkContentPart"]);
  });

  test("routes an unrecognized definition to shared types rather than dropping it", () => {
    const groups = groupFactorySchemaDefinitions([
      stubDefinition("SomethingNewlyPublished"),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe("shared");
    expect(groups[0]?.definitions.map(factorySchemaDefinitionName)).toEqual([
      "SomethingNewlyPublished",
    ]);
  });

  test("omits sections that claim nothing", () => {
    const groups = groupFactorySchemaDefinitions([stubDefinition("Worker")]);

    expect(groups.map((group) => group.id)).toEqual(["workers"]);
  });

  test("derives a stable url-safe anchor per section", () => {
    const groups = groupFactorySchemaDefinitions(publishedDefinitions());

    for (const group of groups) {
      expect(group.anchor).toBe(factorySchemaGroupAnchor(group.id));
      expect(group.anchor).toMatch(/^schema-group-[a-z0-9-]+$/);
    }
    expect(new Set(groups.map((group) => group.anchor)).size).toBe(
      groups.length,
    );
  });
});
