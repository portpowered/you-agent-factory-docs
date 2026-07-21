import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MODEL_PRICING_ROOT } from "./model-pricing";
import { validateModelPricing } from "./validate-model-pricing";
import { validateRegistryContent } from "./validate-registry";

const fixtureRoots: string[] = [];

afterEach(() => {
  for (const root of fixtureRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function createModelsFixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "validate-model-pricing-"));
  fixtureRoots.push(root);
  return root;
}

const validRecord = {
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
} as const;

describe("validateModelPricing", () => {
  test("accepts committed seed model-pricing records with no errors", () => {
    const errors = validateModelPricing({ modelsRoot: MODEL_PRICING_ROOT });
    expect(errors).toEqual([]);
  });

  test("fails when inputPricePerMTok is negative", () => {
    const modelsRoot = createModelsFixtureRoot();
    writeFileSync(
      join(modelsRoot, "model.bad.input.json"),
      JSON.stringify({
        ...validRecord,
        id: "model.bad.input",
        inputPricePerMTok: -1,
      }),
    );

    const errors = validateModelPricing({ modelsRoot });
    expect(errors.some((error) => error.code === "invalid-model-pricing")).toBe(
      true,
    );
    expect(
      errors.some((error) => error.message.includes("inputPricePerMTok")),
    ).toBe(true);
  });

  test("fails when outputPricePerMTok is negative", () => {
    const modelsRoot = createModelsFixtureRoot();
    writeFileSync(
      join(modelsRoot, "model.bad.output.json"),
      JSON.stringify({
        ...validRecord,
        id: "model.bad.output",
        outputPricePerMTok: -0.5,
      }),
    );

    const errors = validateModelPricing({ modelsRoot });
    expect(errors.some((error) => error.code === "invalid-model-pricing")).toBe(
      true,
    );
    expect(
      errors.some((error) => error.message.includes("outputPricePerMTok")),
    ).toBe(true);
  });

  test("fails on malformed kind, currency, and missing required fields", () => {
    const modelsRoot = createModelsFixtureRoot();
    writeFileSync(
      join(modelsRoot, "model.bad.kind.json"),
      JSON.stringify({
        ...validRecord,
        id: "model.bad.kind",
        kind: "model",
      }),
    );
    writeFileSync(
      join(modelsRoot, "model.bad.currency.json"),
      JSON.stringify({
        ...validRecord,
        id: "model.bad.currency",
        currency: "EUR",
      }),
    );
    writeFileSync(
      join(modelsRoot, "model.bad.missing.json"),
      JSON.stringify({
        id: "model.bad.missing",
        kind: "model-pricing",
        providerId: "provider.openai",
        inputPricePerMTok: 1,
        outputPricePerMTok: 2,
        currency: "USD",
        asOf: "2026-07-01",
      }),
    );

    const errors = validateModelPricing({ modelsRoot });
    expect(errors).toHaveLength(3);
    expect(
      errors.every((error) => error.code === "invalid-model-pricing"),
    ).toBe(true);
    expect(errors.some((error) => error.message.includes("kind"))).toBe(true);
    expect(errors.some((error) => error.message.includes("currency"))).toBe(
      true,
    );
    expect(errors.some((error) => error.message.includes("displayName"))).toBe(
      true,
    );
  });

  test("skips optional provider metadata JSON", () => {
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

    expect(validateModelPricing({ modelsRoot })).toEqual([]);
  });

  test("fails on duplicate model pricing ids", () => {
    const modelsRoot = createModelsFixtureRoot();
    writeFileSync(
      join(modelsRoot, "model.openai.gpt-4o.json"),
      JSON.stringify(validRecord),
    );
    writeFileSync(
      join(modelsRoot, "dup-model.openai.gpt-4o.json"),
      JSON.stringify(validRecord),
    );

    const errors = validateModelPricing({ modelsRoot });
    expect(
      errors.some((error) => error.code === "duplicate-model-pricing-id"),
    ).toBe(true);
  });
});

describe("validateRegistryContent model-pricing hook", () => {
  test("surfaces negative model prices through validate-data path", async () => {
    const tempRoot = createModelsFixtureRoot();
    const registryRoot = join(tempRoot, "registry");
    const docsRoot = join(tempRoot, "docs");
    const blogRoot = join(tempRoot, "blog-missing");
    const modelsRoot = join(registryRoot, "models");
    mkdirSync(modelsRoot, { recursive: true });
    mkdirSync(docsRoot, { recursive: true });
    writeFileSync(
      join(modelsRoot, "model.bad.prices.json"),
      JSON.stringify({
        ...validRecord,
        id: "model.bad.prices",
        inputPricePerMTok: -2,
      }),
    );

    const errors = await validateRegistryContent({
      registryRoot,
      docsRoot,
      blogRoot,
      phase1PageDirectories: [],
    });

    expect(
      errors.some(
        (error) =>
          error.code === "invalid-model-pricing" &&
          error.message.includes("inputPricePerMTok") &&
          error.message.includes("model.bad.prices"),
      ),
    ).toBe(true);
  });

  test("reports no model-pricing errors for committed seeds", async () => {
    const tempRoot = createModelsFixtureRoot();
    const docsRoot = join(tempRoot, "docs");
    const blogRoot = join(tempRoot, "blog-missing");
    mkdirSync(docsRoot, { recursive: true });

    const errors = await validateRegistryContent({
      docsRoot,
      blogRoot,
      modelsRoot: MODEL_PRICING_ROOT,
      phase1PageDirectories: [],
    });

    expect(
      errors.filter((error) => error.code.startsWith("invalid-model-pricing")),
    ).toEqual([]);
    expect(
      errors.filter((error) => error.code === "duplicate-model-pricing-id"),
    ).toEqual([]);
  });
});
