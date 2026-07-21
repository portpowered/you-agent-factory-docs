import { describe, expect, test } from "bun:test";
import { isModelCostPlaygroundHarnessEnabled } from "./model-cost-playground-harness-gate";

describe("isModelCostPlaygroundHarnessEnabled", () => {
  test("allows non-production without the enable flag", () => {
    expect(
      isModelCostPlaygroundHarnessEnabled({ NODE_ENV: "development" }),
    ).toBe(true);
    expect(isModelCostPlaygroundHarnessEnabled({ NODE_ENV: "test" })).toBe(
      true,
    );
  });

  test("blocks production unless ENABLE_COMPONENT_EXAMPLES=1", () => {
    expect(
      isModelCostPlaygroundHarnessEnabled({ NODE_ENV: "production" }),
    ).toBe(false);
    expect(
      isModelCostPlaygroundHarnessEnabled({
        NODE_ENV: "production",
        ENABLE_COMPONENT_EXAMPLES: "0",
      }),
    ).toBe(false);
    expect(
      isModelCostPlaygroundHarnessEnabled({
        NODE_ENV: "production",
        ENABLE_COMPONENT_EXAMPLES: "1",
      }),
    ).toBe(true);
  });
});
