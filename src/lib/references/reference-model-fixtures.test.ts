/**
 * Fixture-backed proofs for W04 normalized model / anchor / cross-link /
 * projection behaviors. Uses shared fixtures under `./fixtures/` rather than
 * inventing one-off catalogs. Does not build overlays, UI renderers, or pages.
 */

import { describe, expect, test } from "bun:test";
import {
  buildAllW04SchemaDefinitions,
  buildCompositionDefinitions,
  buildMapArrayEnumDefaultDefinitions,
  buildMissingDescriptionDefinition,
  buildRecursionCycleDefinitions,
  buildRepresentativeReferenceItems,
  W04_COLLIDING_ANCHOR_REGISTRATIONS,
  W04_FIXTURE_API_PAGE_ID,
  W04_FIXTURE_OPENAPI_ARTIFACT,
  W04_FIXTURE_SCHEMA_ARTIFACT,
  W04_FIXTURE_SCHEMA_PAGE_ID,
  W04_MALFORMED_REF_FIXTURES,
  W04_MISSING_REF_FIXTURE,
  w04FixtureAddress,
  w04FixtureSource,
} from "./fixtures/w04-normalized-model-fixtures";
import {
  createReferenceAnchorRegistry,
  ReferenceAnchorRegistryError,
} from "./reference-anchor-registry";
import { createReferenceCrossLinkResolver } from "./reference-cross-link-resolver";
import {
  projectReferenceItemToDisplay,
  projectSchemaDefinitionToDisplay,
  projectSchemaFieldToDisplay,
} from "./reference-display-projection";
import {
  createReferenceSearchDocumentBuilder,
  projectReferenceItemToSearchDocument,
} from "./reference-search-projection";

describe("W04 fixtures coverage", () => {
  test("fixtures cover recursion, composition, maps, arrays, enums, defaults, missing descriptions, and malformed refs", () => {
    const recursion = buildRecursionCycleDefinitions();
    expect(recursion.map((d) => d.address.pointer)).toEqual([
      "/components/schemas/NodeA",
      "/components/schemas/NodeB",
      "/components/schemas/Loop",
    ]);
    expect(recursion[0]?.refTarget?.pointer).toBe("/components/schemas/NodeB");
    expect(recursion[1]?.refTarget?.pointer).toBe("/components/schemas/NodeA");
    expect(recursion[2]?.refTarget?.pointer).toBe("/components/schemas/Loop");

    const composition = buildCompositionDefinitions();
    const contentPart = composition.find(
      (d) => d.address.pointer === "/components/schemas/WorkContentPart",
    );
    expect(contentPart?.composition?.oneOf).toHaveLength(2);
    expect(contentPart?.composition?.anyOf).toHaveLength(1);
    expect(contentPart?.composition?.allOf).toHaveLength(1);
    expect(contentPart?.composition?.discriminator?.propertyName).toBe("type");
    expect(contentPart?.composition?.discriminator?.mapping?.text).toEqual(
      w04FixtureAddress("/components/schemas/WorkTextContentPart"),
    );

    const [worker] = buildMapArrayEnumDefaultDefinitions();
    expect(worker?.properties?.labels?.additionalProperties).toEqual(
      w04FixtureAddress(
        "/components/schemas/StringValue",
        W04_FIXTURE_SCHEMA_ARTIFACT,
      ),
    );
    expect(worker?.properties?.tags?.itemSchema).toEqual(
      w04FixtureAddress("/$defs/WorkerTag", W04_FIXTURE_SCHEMA_ARTIFACT),
    );
    expect(worker?.properties?.role?.enum).toEqual([
      "planner",
      "executor",
      "reviewer",
    ]);
    expect(worker?.properties?.role?.default).toBe("executor");
    expect(worker?.properties?.nickname?.description).toBeUndefined();

    const anonymous = buildMissingDescriptionDefinition();
    expect(anonymous.title).toBeUndefined();
    expect(anonymous.description).toBeUndefined();
    expect(anonymous.properties?.id?.description).toBeUndefined();

    expect(W04_MALFORMED_REF_FIXTURES.length).toBeGreaterThanOrEqual(3);
    expect(W04_MISSING_REF_FIXTURE).toContain("DoesNotExist");

    expect(buildAllW04SchemaDefinitions().length).toBeGreaterThanOrEqual(8);
  });
});

describe("fixture-backed cycle-safe cross-link resolution", () => {
  test("resolves A→B→A cycles and self-refs without hanging; preserves source pointers", () => {
    const resolver = createReferenceCrossLinkResolver({
      definitions: buildRecursionCycleDefinitions(),
    });

    const cycle = resolver.resolveRefChain({
      source: w04FixtureSource("/components/schemas/Root"),
      ref: "#/components/schemas/NodeA",
    });
    expect(cycle.kind).toBe("cycle");
    if (cycle.kind !== "cycle") {
      return;
    }
    expect(cycle.source).toEqual(w04FixtureSource("/components/schemas/Root"));
    expect(cycle.path.map((entry) => entry.pointer)).toEqual([
      "/components/schemas/NodeA",
      "/components/schemas/NodeB",
      "/components/schemas/NodeA",
    ]);
    expect(cycle.cycleAt.pointer).toBe("/components/schemas/NodeA");

    const self = resolver.resolveRefChain({
      source: w04FixtureSource("/components/schemas/Caller"),
      ref: "#/components/schemas/Loop",
    });
    expect(self.kind).toBe("cycle");
    if (self.kind !== "cycle") {
      return;
    }
    expect(self.source.pointer).toBe("/components/schemas/Caller");
    expect(self.source.path).toBe("generated/openapi/openapi.yaml");
    expect(self.cycleAt.pointer).toBe("/components/schemas/Loop");
  });

  test("resolves composition discriminator mappings one-hop and reports missing/malformed refs", () => {
    const resolver = createReferenceCrossLinkResolver({
      definitions: buildCompositionDefinitions(),
    });

    const contentPart = buildCompositionDefinitions().find(
      (d) => d.address.pointer === "/components/schemas/WorkContentPart",
    );
    expect(contentPart?.composition?.discriminator).toBeDefined();
    if (contentPart?.composition?.discriminator === undefined) {
      return;
    }

    const disc = resolver.resolveDiscriminator({
      source: w04FixtureSource("/components/schemas/WorkContentPart"),
      discriminator: contentPart.composition.discriminator,
    });
    expect(disc.mappings.text?.kind).toBe("resolved");
    expect(disc.mappings.image?.kind).toBe("resolved");
    if (
      disc.mappings.text?.kind !== "resolved" ||
      disc.mappings.image?.kind !== "resolved"
    ) {
      return;
    }
    // One-hop: image stays on WorkImageContentPart, not WorkImagePayload.
    expect(disc.mappings.image.target.pointer).toBe(
      "/components/schemas/WorkImageContentPart",
    );
    expect(disc.mappings.text.source.pointer).toContain(
      "discriminator/mapping/text",
    );
    expect(disc.mappings.image.source.publicArtifactId).toBe(
      W04_FIXTURE_OPENAPI_ARTIFACT,
    );

    const missing = resolver.resolveRef({
      source: w04FixtureSource("/components/schemas/WorkContentPart"),
      ref: W04_MISSING_REF_FIXTURE,
    });
    expect(missing.kind).toBe("missing");
    if (missing.kind !== "missing") {
      return;
    }
    expect(missing.source.pointer).toBe("/components/schemas/WorkContentPart");
    expect(missing.target.pointer).toBe("/components/schemas/DoesNotExist");

    for (const fixture of W04_MALFORMED_REF_FIXTURES) {
      const malformed = resolver.resolveRef({
        source: w04FixtureSource("/components/schemas/WorkContentPart"),
        ref: fixture.rawRef,
      });
      expect(malformed.kind).toBe("malformed");
      if (malformed.kind !== "malformed") {
        continue;
      }
      expect(malformed.source.pointer).toBe(
        "/components/schemas/WorkContentPart",
      );
      expect(malformed.message.length).toBeGreaterThan(0);
    }
  });
});

describe("fixture-backed deterministic anchors and per-page collisions", () => {
  test("registers fixture identities to deterministic URL-safe anchors", () => {
    const registry = createReferenceAnchorRegistry();
    const workerPointer = "/$defs/Worker";
    const first = registry.register({
      owningPageId: W04_FIXTURE_SCHEMA_PAGE_ID,
      itemId: "schema.definition.Worker",
      kind: "schema-pointer",
      identity: workerPointer,
    });
    const second = registry.register({
      owningPageId: W04_FIXTURE_SCHEMA_PAGE_ID,
      itemId: "schema.definition.Worker",
      kind: "schema-pointer",
      identity: workerPointer,
    });

    expect(first).toBe("defs-Worker");
    expect(second).toBe(first);
    expect(first).toMatch(/^[A-Za-z0-9._~-]+$/);

    const apiOp = registry.register({
      owningPageId: W04_FIXTURE_API_PAGE_ID,
      itemId: "openapi.operation.submitWorkBySessionId",
      kind: "operation",
      identity: "submitWorkBySessionId",
    });
    expect(apiOp).toBe("submitWorkBySessionId");

    // Same fragment text on a different owning page is allowed.
    const otherPage = registry.register({
      owningPageId: W04_FIXTURE_API_PAGE_ID,
      itemId: "api.schema.Worker",
      kind: "schema-pointer",
      identity: workerPointer,
    });
    expect(otherPage).toBe("defs-Worker");
  });

  test("fails closed when two distinct fixture items collide on one owning page", () => {
    const registry = createReferenceAnchorRegistry();
    registry.register({ ...W04_COLLIDING_ANCHOR_REGISTRATIONS[0] });

    expect(() =>
      registry.register({ ...W04_COLLIDING_ANCHOR_REGISTRATIONS[1] }),
    ).toThrow(ReferenceAnchorRegistryError);

    try {
      registry.register({ ...W04_COLLIDING_ANCHOR_REGISTRATIONS[1] });
      throw new Error("expected collision");
    } catch (error) {
      expect(error).toBeInstanceOf(ReferenceAnchorRegistryError);
      if (!(error instanceof ReferenceAnchorRegistryError)) {
        return;
      }
      expect(error.code).toBe("anchor-collision");
      expect(error.anchor).toBe("defs-Worker");
      expect(error.owningPageId).toBe(W04_FIXTURE_SCHEMA_PAGE_ID);
      expect(error.itemId).toBe("schema.definition.WorkerAlt");
      expect(error.collidingItemId).toBe("schema.definition.Worker");
      expect(error.message).toMatch(/defs-Worker/);
      expect(error.message).toMatch(/schema\.definition\.Worker/);
      expect(error.message).toMatch(/schema\.definition\.WorkerAlt/);
      expect(error.message).toMatch(new RegExp(W04_FIXTURE_SCHEMA_PAGE_ID));
    }
  });
});

describe("fixture-backed display and search projections", () => {
  test("projects representative items without inventing missing descriptions", () => {
    const items = buildRepresentativeReferenceItems();
    const submit = items.find(
      (item) => item.id === "openapi.operation.submitWorkBySessionId",
    );
    const anonymous = items.find(
      (item) => item.id === "schema.definition.AnonymousPayload",
    );
    expect(submit).toBeDefined();
    expect(anonymous).toBeDefined();
    if (submit === undefined || anonymous === undefined) {
      return;
    }

    const display = projectReferenceItemToDisplay(submit, {
      typeSummary: "operation",
      links: [
        {
          label: "Worker",
          anchor: "defs-Worker",
          href: "/docs/references/schema#defs-Worker",
        },
      ],
    });
    expect(display.title).toBe("Submit work by session id");
    expect(display.description).toBe("Enqueue work for an existing session.");
    expect(display.source).toEqual(submit.source);
    expect(display.links[0]?.href).toBe("/docs/references/schema#defs-Worker");

    const anonymousDisplay = projectReferenceItemToDisplay(anonymous);
    expect(anonymousDisplay.description).toBeUndefined();
    expect(anonymousDisplay.aliases).toEqual([]);

    const worker = buildMapArrayEnumDefaultDefinitions()[0];
    expect(worker).toBeDefined();
    if (worker === undefined) {
      return;
    }
    const roleField = worker.properties?.role;
    const nicknameField = worker.properties?.nickname;
    expect(roleField).toBeDefined();
    expect(nicknameField).toBeDefined();
    if (roleField === undefined || nicknameField === undefined) {
      return;
    }
    const fieldDisplay = projectSchemaFieldToDisplay(roleField, {
      id: "schema.field.Worker.role",
      family: "schema",
      anchor: "defs-Worker-role",
      source: {
        publicArtifactId: W04_FIXTURE_SCHEMA_ARTIFACT,
        pointer: "/$defs/Worker/properties/role",
      },
      pagePath: "/docs/references/schema",
    });
    expect(fieldDisplay.enum).toEqual(["planner", "executor", "reviewer"]);
    expect(fieldDisplay.default).toBe("executor");
    expect(fieldDisplay.description).toBe("Primary worker role.");

    const nicknameDisplay = projectSchemaFieldToDisplay(nicknameField, {
      id: "schema.field.Worker.nickname",
      family: "schema",
      anchor: "defs-Worker-nickname",
      source: {
        publicArtifactId: W04_FIXTURE_SCHEMA_ARTIFACT,
        pointer: "/$defs/Worker/properties/nickname",
      },
    });
    expect(nicknameDisplay.description).toBeUndefined();

    const defDisplay = projectSchemaDefinitionToDisplay(worker, {
      id: "schema.definition.Worker",
      family: "schema",
      anchor: "defs-Worker",
      source: {
        publicArtifactId: W04_FIXTURE_SCHEMA_ARTIFACT,
        pointer: "/$defs/Worker",
      },
    });
    expect(defDisplay.title).toBe("Worker");
    expect(defDisplay.typeSummary).toBe("object");
  });

  test("builds search documents with owning-page anchor URLs from fixtures", () => {
    const items = buildRepresentativeReferenceItems();
    const builder = createReferenceSearchDocumentBuilder();
    const documents = builder.buildMany(items);

    expect(documents).toHaveLength(items.length);

    const submitDoc = documents.find(
      (doc) => doc.id === "openapi.operation.submitWorkBySessionId",
    );
    expect(submitDoc?.url).toBe("/docs/references/api#submitWorkBySessionId");
    expect(submitDoc?.kind).toBe("reference");
    expect(submitDoc?.family).toBe("api");
    expect(submitDoc?.description).toBe(
      "Enqueue work for an existing session.",
    );
    expect(submitDoc?.source.pointer).toContain("factory-sessions");

    const anonymousItem = items.find(
      (item) => item.id === "schema.definition.AnonymousPayload",
    );
    expect(anonymousItem).toBeDefined();
    if (anonymousItem === undefined) {
      return;
    }
    const anonymousDoc = projectReferenceItemToSearchDocument(anonymousItem);
    expect(anonymousDoc.url).toBe(
      "/docs/references/schema#components-schemas-AnonymousPayload",
    );
    expect(anonymousDoc.description).toBeUndefined();
    expect(anonymousDoc.bodyText).toBe("AnonymousPayload");
  });
});
