import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import claudeSonnetSeed from "@/content/registry/models/model.anthropic.claude-sonnet.json";
import gpt4oSeed from "@/content/registry/models/model.openai.gpt-4o.json";
import {
  getModelPricing,
  listModelPricing,
  type ModelPricingRecord,
  modelPricingRecordSchema,
} from "./model-pricing";

const fixtureRoots: string[] = [];

afterEach(() => {
  while (fixtureRoots.length > 0) {
    const root = fixtureRoots.pop();
    if (root) {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

function createModelsFixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "model-pricing-"));
  fixtureRoots.push(root);
  return root;
}

const validRecord: ModelPricingRecord = {
  id: "model.openai.gpt-4o",
  kind: "model-pricing",
  providerId: "provider.openai",
  displayName: "GPT-4o",
  inputPricePerMTok: 2.5,
  outputPricePerMTok: 10,
  currency: "USD",
  asOf: "2026-07-01",
  defaultSummaryKey: "description",
  tags: ["openai", "chat"],
};

describe("modelPricingRecordSchema", () => {
  test("accepts a valid model-pricing record", () => {
    const result = modelPricingRecordSchema.safeParse(validRecord);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validRecord);
    }
  });

  test("accepts a minimal valid record without optional fields", () => {
    const {
      defaultSummaryKey: _summary,
      tags: _tags,
      ...minimal
    } = validRecord;
    const result = modelPricingRecordSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  test("accepts zero prices", () => {
    const result = modelPricingRecordSchema.safeParse({
      ...validRecord,
      inputPricePerMTok: 0,
      outputPricePerMTok: 0,
    });
    expect(result.success).toBe(true);
  });

  test("rejects negative inputPricePerMTok", () => {
    const result = modelPricingRecordSchema.safeParse({
      ...validRecord,
      inputPricePerMTok: -1,
    });
    expect(result.success).toBe(false);
  });

  test("rejects negative outputPricePerMTok", () => {
    const result = modelPricingRecordSchema.safeParse({
      ...validRecord,
      outputPricePerMTok: -0.01,
    });
    expect(result.success).toBe(false);
  });

  test("rejects retired Atlas kind model", () => {
    const result = modelPricingRecordSchema.safeParse({
      ...validRecord,
      kind: "model",
    });
    expect(result.success).toBe(false);
  });

  test("rejects wrong currency", () => {
    const result = modelPricingRecordSchema.safeParse({
      ...validRecord,
      currency: "EUR",
    });
    expect(result.success).toBe(false);
  });

  test("rejects invalid asOf calendar date", () => {
    const result = modelPricingRecordSchema.safeParse({
      ...validRecord,
      asOf: "2026-13-01",
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing required fields", () => {
    const { displayName: _displayName, ...withoutDisplayName } = validRecord;
    const result = modelPricingRecordSchema.safeParse(withoutDisplayName);
    expect(result.success).toBe(false);
  });
});

describe("committed model pricing seed JSON", () => {
  test("parses model.openai.gpt-4o seed", () => {
    const result = modelPricingRecordSchema.safeParse(gpt4oSeed);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("model.openai.gpt-4o");
      expect(result.data.kind).toBe("model-pricing");
      expect(result.data.currency).toBe("USD");
      expect(result.data.inputPricePerMTok).toBeGreaterThanOrEqual(0);
      expect(result.data.outputPricePerMTok).toBeGreaterThanOrEqual(0);
    }
  });

  test("parses model.anthropic.claude-sonnet seed", () => {
    const result = modelPricingRecordSchema.safeParse(claudeSonnetSeed);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("model.anthropic.claude-sonnet");
      expect(result.data.kind).toBe("model-pricing");
      expect(result.data.currency).toBe("USD");
      expect(result.data.inputPricePerMTok).toBeGreaterThanOrEqual(0);
      expect(result.data.outputPricePerMTok).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("listModelPricing / getModelPricing", () => {
  test("lists seeded model-pricing ids from the committed registry", () => {
    const records = listModelPricing();
    const ids = records.map((record) => record.id);

    expect(ids).toContain("model.openai.gpt-4o");
    expect(ids).toContain("model.anthropic.claude-sonnet");
    expect(records.every((record) => record.kind === "model-pricing")).toBe(
      true,
    );
  });

  test("resolves a known seeded id via getModelPricing", () => {
    const record = getModelPricing("model.openai.gpt-4o");
    expect(record).toBeDefined();
    expect(record?.id).toBe("model.openai.gpt-4o");
    expect(record?.displayName).toBe("GPT-4o");
    expect(record?.currency).toBe("USD");
  });

  test("returns undefined for a missing id", () => {
    expect(getModelPricing("model.missing.does-not-exist")).toBeUndefined();
  });

  test("skips non-model-pricing JSON such as optional provider metadata", () => {
    const modelsRoot = createModelsFixtureRoot();
    writeFileSync(
      join(modelsRoot, "provider.openai.json"),
      JSON.stringify({
        id: "provider.openai",
        kind: "provider",
        displayName: "OpenAI",
      }),
    );
    writeFileSync(
      join(modelsRoot, "model.openai.gpt-4o.json"),
      JSON.stringify(validRecord),
    );

    const records = listModelPricing({ modelsRoot });
    expect(records).toHaveLength(1);
    expect(records[0]?.id).toBe("model.openai.gpt-4o");
    expect(getModelPricing("provider.openai", { modelsRoot })).toBeUndefined();
  });

  test("loads nested model-pricing JSON under models/**", () => {
    const modelsRoot = createModelsFixtureRoot();
    const nestedDir = join(modelsRoot, "nested");
    mkdirSync(nestedDir);
    writeFileSync(
      join(nestedDir, "model.openai.gpt-4o.json"),
      JSON.stringify(validRecord),
    );

    const records = listModelPricing({ modelsRoot });
    expect(records).toHaveLength(1);
    expect(getModelPricing("model.openai.gpt-4o", { modelsRoot })?.id).toBe(
      "model.openai.gpt-4o",
    );
  });

  test("throws when a model-pricing record fails schema validation", () => {
    const modelsRoot = createModelsFixtureRoot();
    writeFileSync(
      join(modelsRoot, "model.bad.prices.json"),
      JSON.stringify({
        ...validRecord,
        id: "model.bad.prices",
        inputPricePerMTok: -1,
      }),
    );

    expect(() => listModelPricing({ modelsRoot })).toThrow(
      /Model pricing schema validation failed/,
    );
  });
});
