import { describe, expect, test } from "bun:test";
import {
  type ModelPricingRecord,
  modelPricingRecordSchema,
} from "./model-pricing";

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
