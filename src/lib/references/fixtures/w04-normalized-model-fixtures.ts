/**
 * Shared W04 fixtures for recursion, composition, maps, arrays, enums,
 * defaults, missing descriptions, and malformed refs.
 *
 * Pure data builders — no filesystem, package resolution, or UI. Tests and
 * later lanes import these shapes instead of inventing one-off catalogs.
 * When real package artifacts are needed, still acquire them through W03
 * `resolveApiPackageArtifact` (never package root / package-internal imports).
 */

import { createReferenceItem, type ReferenceItem } from "../reference-item";
import {
  createSchemaAddress,
  createSchemaDefinitionModel,
  createSchemaFieldModel,
  type SchemaAddress,
  type SchemaDefinitionModel,
  type SchemaFieldModel,
} from "../schema-model";

/** Public artifact identity used by schema/event fixtures in this catalog. */
export const W04_FIXTURE_OPENAPI_ARTIFACT =
  "@you-agent-factory/api/openapi" as const;

/** Public artifact identity used by configuration-schema fixtures. */
export const W04_FIXTURE_SCHEMA_ARTIFACT =
  "@you-agent-factory/api/schemas/factory" as const;

/** Owning page id for schema-family anchor/projection proofs. */
export const W04_FIXTURE_SCHEMA_PAGE_ID = "schema" as const;

/** Owning page id for API/OpenAPI-family proofs. */
export const W04_FIXTURE_API_PAGE_ID = "api" as const;

export function w04FixtureAddress(
  pointer: string,
  publicArtifactId: string = W04_FIXTURE_OPENAPI_ARTIFACT,
): SchemaAddress {
  return createSchemaAddress({ publicArtifactId, pointer });
}

export function w04FixtureSource(
  pointer: string,
  options: {
    publicArtifactId?: string;
    path?: string;
  } = {},
) {
  const source: {
    publicArtifactId: string;
    pointer: string;
    path?: string;
  } = {
    publicArtifactId: options.publicArtifactId ?? W04_FIXTURE_OPENAPI_ARTIFACT,
    pointer,
  };
  if (options.path !== undefined) {
    source.path = options.path;
  } else {
    source.path = "generated/openapi/openapi.yaml";
  }
  return source;
}

/**
 * Recursive / cyclic graph: NodeA ↔ NodeB via `refTarget`, plus a self-ref
 * `Loop` wrapper. Resolvers must return cycle sentinels without hanging.
 */
export function buildRecursionCycleDefinitions(): SchemaDefinitionModel[] {
  return [
    createSchemaDefinitionModel({
      address: w04FixtureAddress("/components/schemas/NodeA"),
      title: "NodeA",
      description: "First node in a cyclic pair.",
      type: "object",
      refTarget: w04FixtureAddress("/components/schemas/NodeB"),
    }),
    createSchemaDefinitionModel({
      address: w04FixtureAddress("/components/schemas/NodeB"),
      title: "NodeB",
      description: "Second node in a cyclic pair.",
      type: "object",
      refTarget: w04FixtureAddress("/components/schemas/NodeA"),
    }),
    createSchemaDefinitionModel({
      address: w04FixtureAddress("/components/schemas/Loop"),
      title: "Loop",
      type: "object",
      refTarget: w04FixtureAddress("/components/schemas/Loop"),
    }),
  ];
}

/**
 * Composition fixture: oneOf + discriminator, plus anyOf / allOf member
 * addresses. Discriminator mappings stay as addresses so resolution stays
 * one-hop.
 */
export function buildCompositionDefinitions(): SchemaDefinitionModel[] {
  const textPart = createSchemaDefinitionModel({
    address: w04FixtureAddress("/components/schemas/WorkTextContentPart"),
    title: "WorkTextContentPart",
    description: "Text content part.",
    type: "object",
    required: ["type", "text"],
    properties: {
      type: createSchemaFieldModel({
        path: "type",
        address: w04FixtureAddress(
          "/components/schemas/WorkTextContentPart/properties/type",
        ),
        typeSummary: "string",
        required: true,
        const: "text",
      }),
      text: createSchemaFieldModel({
        path: "text",
        address: w04FixtureAddress(
          "/components/schemas/WorkTextContentPart/properties/text",
        ),
        typeSummary: "string",
        required: true,
        description: "Plain text payload.",
      }),
    },
    additionalProperties: false,
  });

  const imagePart = createSchemaDefinitionModel({
    address: w04FixtureAddress("/components/schemas/WorkImageContentPart"),
    title: "WorkImageContentPart",
    description: "Image content part.",
    type: "object",
    // Nested ref must not be expanded by discriminator resolution.
    refTarget: w04FixtureAddress("/components/schemas/WorkImagePayload"),
    required: ["type"],
    properties: {
      type: createSchemaFieldModel({
        path: "type",
        address: w04FixtureAddress(
          "/components/schemas/WorkImageContentPart/properties/type",
        ),
        typeSummary: "string",
        required: true,
        const: "image",
      }),
    },
  });

  const imagePayload = createSchemaDefinitionModel({
    address: w04FixtureAddress("/components/schemas/WorkImagePayload"),
    title: "WorkImagePayload",
    type: "object",
    properties: {
      url: createSchemaFieldModel({
        path: "url",
        address: w04FixtureAddress(
          "/components/schemas/WorkImagePayload/properties/url",
        ),
        typeSummary: "string",
        required: true,
        format: "uri",
      }),
    },
  });

  const contentPart = createSchemaDefinitionModel({
    address: w04FixtureAddress("/components/schemas/WorkContentPart"),
    title: "WorkContentPart",
    description: "Discriminated content part union.",
    composition: {
      oneOf: [
        w04FixtureAddress("/components/schemas/WorkTextContentPart"),
        w04FixtureAddress("/components/schemas/WorkImageContentPart"),
      ],
      anyOf: [w04FixtureAddress("/components/schemas/WorkTextContentPart")],
      allOf: [w04FixtureAddress("/components/schemas/WorkImagePayload")],
      discriminator: {
        propertyName: "type",
        mapping: {
          text: w04FixtureAddress("/components/schemas/WorkTextContentPart"),
          image: w04FixtureAddress("/components/schemas/WorkImageContentPart"),
        },
      },
    },
  });

  return [contentPart, textPart, imagePart, imagePayload];
}

/**
 * Map / object with `additionalProperties` address, array field, enum field,
 * default value, and a sibling field with a missing description.
 */
export function buildMapArrayEnumDefaultDefinitions(): SchemaDefinitionModel[] {
  const stringValue = createSchemaDefinitionModel({
    address: w04FixtureAddress(
      "/components/schemas/StringValue",
      W04_FIXTURE_SCHEMA_ARTIFACT,
    ),
    title: "StringValue",
    type: "string",
  });

  const workerTag = createSchemaDefinitionModel({
    address: w04FixtureAddress("/$defs/WorkerTag", W04_FIXTURE_SCHEMA_ARTIFACT),
    title: "WorkerTag",
    type: "string",
    enum: ["planner", "executor", "reviewer"],
    default: "executor",
  });

  const labelsField: SchemaFieldModel = createSchemaFieldModel({
    path: "labels",
    address: w04FixtureAddress(
      "/$defs/Worker/properties/labels",
      W04_FIXTURE_SCHEMA_ARTIFACT,
    ),
    typeSummary: "map<string, string>",
    required: false,
    description: "Open string map of labels.",
    additionalProperties: w04FixtureAddress(
      "/components/schemas/StringValue",
      W04_FIXTURE_SCHEMA_ARTIFACT,
    ),
  });

  const tagsField: SchemaFieldModel = createSchemaFieldModel({
    path: "tags",
    address: w04FixtureAddress(
      "/$defs/Worker/properties/tags",
      W04_FIXTURE_SCHEMA_ARTIFACT,
    ),
    typeSummary: "string[]",
    required: true,
    description: "Ordered worker tags.",
    itemSchema: w04FixtureAddress(
      "/$defs/WorkerTag",
      W04_FIXTURE_SCHEMA_ARTIFACT,
    ),
    constraints: { minItems: 1, uniqueItems: true },
  });

  const roleField: SchemaFieldModel = createSchemaFieldModel({
    path: "role",
    address: w04FixtureAddress(
      "/$defs/Worker/properties/role",
      W04_FIXTURE_SCHEMA_ARTIFACT,
    ),
    typeSummary: "string",
    required: true,
    enum: ["planner", "executor", "reviewer"],
    default: "executor",
    description: "Primary worker role.",
  });

  // Description intentionally omitted — projectors must leave it absent.
  const nicknameField: SchemaFieldModel = createSchemaFieldModel({
    path: "nickname",
    address: w04FixtureAddress(
      "/$defs/Worker/properties/nickname",
      W04_FIXTURE_SCHEMA_ARTIFACT,
    ),
    typeSummary: "string",
    required: false,
  });

  const worker = createSchemaDefinitionModel({
    address: w04FixtureAddress("/$defs/Worker", W04_FIXTURE_SCHEMA_ARTIFACT),
    title: "Worker",
    description: "Worker configuration with maps, arrays, enums, and defaults.",
    type: "object",
    required: ["tags", "role"],
    properties: {
      labels: labelsField,
      tags: tagsField,
      role: roleField,
      nickname: nicknameField,
    },
    additionalProperties: false,
    definitions: {
      WorkerTag: workerTag,
    },
  });

  return [worker, workerTag, stringValue];
}

/**
 * Definition that omits title and description so projections leave those
 * fields absent rather than inventing copy.
 */
export function buildMissingDescriptionDefinition(): SchemaDefinitionModel {
  return createSchemaDefinitionModel({
    address: w04FixtureAddress("/components/schemas/AnonymousPayload"),
    type: "object",
    properties: {
      id: createSchemaFieldModel({
        path: "id",
        address: w04FixtureAddress(
          "/components/schemas/AnonymousPayload/properties/id",
        ),
        typeSummary: "string",
        required: true,
      }),
    },
  });
}

/**
 * Malformed `$ref` strings used by cross-link resolver proofs. None of these
 * should hang or invent definitions.
 */
export const W04_MALFORMED_REF_FIXTURES = [
  { rawRef: "", reason: "empty" },
  { rawRef: "#", reason: "hash-only" },
  { rawRef: "   ", reason: "whitespace" },
] as const;

/** Missing-target `$ref` that parses but is absent from the catalog. */
export const W04_MISSING_REF_FIXTURE = "#/components/schemas/DoesNotExist";

/**
 * Representative addressable reference items for display/search projection
 * proofs. Anchors are filled by the registry in fixture-backed tests.
 */
export function buildRepresentativeReferenceItems(): ReferenceItem[] {
  return [
    createReferenceItem({
      id: "openapi.operation.submitWorkBySessionId",
      family: "api",
      title: "Submit work by session id",
      description: "Enqueue work for an existing session.",
      lifecycle: { state: "active", since: "0.0.0" },
      source: w04FixtureSource(
        "/paths/~1factory-sessions~1{session_id}~1work/post",
      ),
      aliases: ["submitWorkBySessionId"],
      anchor: "submitWorkBySessionId",
    }),
    createReferenceItem({
      id: "schema.definition.Worker",
      family: "schema",
      title: "Worker",
      description:
        "Worker configuration with maps, arrays, enums, and defaults.",
      lifecycle: { state: "active" },
      source: {
        publicArtifactId: W04_FIXTURE_SCHEMA_ARTIFACT,
        pointer: "/$defs/Worker",
        path: "generated/schemas/factory.json",
      },
      aliases: ["Worker"],
      // Provisional; registry tests overwrite via registered fragment.
      anchor: "defs-Worker",
    }),
    createReferenceItem({
      id: "schema.definition.AnonymousPayload",
      family: "schema",
      title: "AnonymousPayload",
      // description intentionally absent
      lifecycle: { state: "active" },
      source: w04FixtureSource("/components/schemas/AnonymousPayload"),
      aliases: [],
      anchor: "components-schemas-AnonymousPayload",
    }),
  ];
}

/**
 * Anchor registration inputs that collide on the schema page when two
 * distinct item ids slugify to the same fragment.
 */
export const W04_COLLIDING_ANCHOR_REGISTRATIONS = [
  {
    owningPageId: W04_FIXTURE_SCHEMA_PAGE_ID,
    itemId: "schema.definition.Worker",
    kind: "schema-pointer" as const,
    identity: "/$defs/Worker",
  },
  {
    owningPageId: W04_FIXTURE_SCHEMA_PAGE_ID,
    itemId: "schema.definition.WorkerAlt",
    kind: "schema-pointer" as const,
    identity: "/$defs/Worker!!!",
  },
] as const;

/**
 * Full catalog of schema definitions used by fixture-backed integration tests.
 */
export function buildAllW04SchemaDefinitions(): SchemaDefinitionModel[] {
  return [
    ...buildRecursionCycleDefinitions(),
    ...buildCompositionDefinitions(),
    ...buildMapArrayEnumDefaultDefinitions(),
    buildMissingDescriptionDefinition(),
  ];
}
