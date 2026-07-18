import { describe, expect, test } from "bun:test";
import {
  createFactoryVariantDiscriminator,
  createFactoryVariantOverlay,
  createSchemaAddress,
  deserializeFactoryVariantOverlay,
  FactoryVariantOverlayParseError,
  type FactoryVariantOverlaySchema,
  FORBIDDEN_OVERLAY_FIELD_PROSE_KEYS,
  parseFactoryVariantOverlay,
  serializeFactoryVariantOverlay,
} from "./factory-variant-overlay-schema";

const FACTORY_ARTIFACT = "@you-agent-factory/api/schemas/factory";

function sampleOverlay(
  overrides: Partial<FactoryVariantOverlaySchema> = {},
): FactoryVariantOverlaySchema {
  return {
    id: "worker:AGENT_WORKER",
    baseDefinition: createSchemaAddress({
      publicArtifactId: FACTORY_ARTIFACT,
      pointer: "/$defs/Worker",
    }),
    discriminator: {
      field: "type",
      value: "AGENT_WORKER",
    },
    fields: {
      shared: ["name"],
      selected: ["toolPolicy"],
      excluded: ["hostedRuntime"],
      conditional: [
        {
          path: "loopBudget",
          conditionId: "companion:workstation:AGENT_RUN",
        },
      ],
    },
    companions: {
      compatible: ["workstation:AGENT_RUN", "behavior:STANDARD"],
      required: ["workstation:AGENT_RUN"],
    },
    examples: [{ exampleId: "agent-worker-basic" }],
    ...overrides,
  };
}

describe("FactoryVariantOverlaySchema", () => {
  test("includes overlay id, base definition, discriminator, field slots, companions, examples, and optional upstream", () => {
    const overlay = createFactoryVariantOverlay(
      sampleOverlay({
        upstreamDefinition: createSchemaAddress({
          publicArtifactId: FACTORY_ARTIFACT,
          pointer: "/$defs/AgentWorker",
        }),
      }),
    );

    expect(overlay.id).toBe("worker:AGENT_WORKER");
    expect(overlay.baseDefinition).toEqual({
      publicArtifactId: FACTORY_ARTIFACT,
      pointer: "/$defs/Worker",
    });
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "AGENT_WORKER",
    });
    expect(overlay.fields.shared).toEqual(["name"]);
    expect(overlay.fields.selected).toEqual(["toolPolicy"]);
    expect(overlay.fields.excluded).toEqual(["hostedRuntime"]);
    expect(overlay.fields.conditional).toEqual([
      {
        path: "loopBudget",
        conditionId: "companion:workstation:AGENT_RUN",
      },
    ]);
    expect(overlay.companions.compatible).toEqual([
      "workstation:AGENT_RUN",
      "behavior:STANDARD",
    ]);
    expect(overlay.companions.required).toEqual(["workstation:AGENT_RUN"]);
    expect(overlay.examples).toEqual([{ exampleId: "agent-worker-basic" }]);
    expect(overlay.upstreamDefinition).toEqual({
      publicArtifactId: FACTORY_ARTIFACT,
      pointer: "/$defs/AgentWorker",
    });
    expect(Object.getPrototypeOf(overlay)).toBe(Object.prototype);
  });

  test("models authored example references separately from schema field slots", () => {
    const overlay = createFactoryVariantOverlay(sampleOverlay());

    expect(overlay.examples).toEqual([{ exampleId: "agent-worker-basic" }]);
    expect("examples" in overlay.fields).toBe(false);
    expect(Object.keys(overlay.fields).sort()).toEqual([
      "conditional",
      "excluded",
      "selected",
      "shared",
    ]);

    expect(() =>
      parseFactoryVariantOverlay({
        ...sampleOverlay(),
        fields: {
          ...sampleOverlay().fields,
          examples: [{ exampleId: "should-not-live-here" }],
        },
      }),
    ).toThrow(/must not live under "fields"/);
  });

  test("field slots are path identities only and reject copied schema prose keys", () => {
    const overlay = createFactoryVariantOverlay(sampleOverlay());

    for (const path of [
      ...overlay.fields.shared,
      ...overlay.fields.selected,
      ...overlay.fields.excluded,
      ...overlay.fields.conditional.map((entry) => entry.path),
    ]) {
      expect(typeof path).toBe("string");
      expect(path.length).toBeGreaterThan(0);
    }

    for (const key of FORBIDDEN_OVERLAY_FIELD_PROSE_KEYS) {
      expect(key in overlay.fields).toBe(false);
    }

    expect(() =>
      parseFactoryVariantOverlay({
        ...sampleOverlay(),
        fields: {
          ...sampleOverlay().fields,
          description: "copied Worker.type prose — forbidden",
        },
      }),
    ).toThrow(FactoryVariantOverlayParseError);

    expect(() =>
      parseFactoryVariantOverlay({
        ...sampleOverlay(),
        fields: {
          ...sampleOverlay().fields,
          conditional: [
            {
              path: "toolPolicy",
              conditionId: "companion:workstation:AGENT_RUN",
              typeSummary: "object",
              enum: ["a"],
            },
          ],
        },
      }),
    ).toThrow(/must not copy schema prose key/);
  });

  test("consumes W04 SchemaAddress shapes without redefining them", () => {
    const base = createSchemaAddress({
      publicArtifactId: FACTORY_ARTIFACT,
      pointer: "/$defs/Workstation",
    });
    const upstream = createSchemaAddress({
      publicArtifactId: FACTORY_ARTIFACT,
      pointer: "/$defs/ClassifierWorkstation",
    });

    const overlay = createFactoryVariantOverlay(
      sampleOverlay({
        id: "workstation:CLASSIFIER_WORKSTATION",
        baseDefinition: base,
        discriminator: createFactoryVariantDiscriminator({
          field: "type",
          value: "CLASSIFIER_WORKSTATION",
        }),
        upstreamDefinition: upstream,
      }),
    );

    expect(overlay.baseDefinition).toEqual(base);
    expect(overlay.upstreamDefinition).toEqual(upstream);
    // Address shape stays the W04 pair — no overlay-local address vocabulary.
    expect(Object.keys(overlay.baseDefinition).sort()).toEqual([
      "pointer",
      "publicArtifactId",
    ]);
  });

  test("round-trips through JSON serialize/deserialize as plain data", () => {
    const overlay = createFactoryVariantOverlay(
      sampleOverlay({
        upstreamDefinition: createSchemaAddress({
          publicArtifactId: FACTORY_ARTIFACT,
          pointer: "/$defs/AgentWorker",
        }),
      }),
    );

    const json = serializeFactoryVariantOverlay(overlay);
    const restored = deserializeFactoryVariantOverlay(json);

    expect(restored).toEqual(overlay);
    expect(JSON.parse(json)).toEqual(overlay);
  });

  test("rejects malformed required slots", () => {
    expect(() => parseFactoryVariantOverlay({})).toThrow(/id/);
    expect(() =>
      parseFactoryVariantOverlay({
        ...sampleOverlay(),
        discriminator: { field: "type" },
      }),
    ).toThrow(/discriminator.value/);
    expect(() =>
      parseFactoryVariantOverlay({
        ...sampleOverlay(),
        examples: ["not-an-object"],
      }),
    ).toThrow(/examples\[0\]/);
    expect(() =>
      parseFactoryVariantOverlay({
        ...sampleOverlay(),
        baseDefinition: { publicArtifactId: FACTORY_ARTIFACT },
      }),
    ).toThrow(/baseDefinition/);
  });
});
