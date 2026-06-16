import { describe, expect, test } from "bun:test";
import { dryRunMake } from "../helpers/make";
import {
  extractQualityGateStepNames,
  runQualityGateScript,
} from "../helpers/validation";

describe("early gate automation parity", () => {
  test("make quality-gate delegates to the bun quality-gate script", () => {
    expect(dryRunMake("quality-gate")).toContain("bun run quality-gate");
  });

  test("quality-gate script emits ordered foundation steps through subprocess output", () => {
    const result = runQualityGateScript();

    expect(result.status).toBe(0);
    expect(extractQualityGateStepNames(result.stdout)).toEqual([
      "typecheck",
      "lint",
      "localization validation",
      "content validation",
      "focused accessibility validation",
      "static export correctness",
      "foundation unit tests",
    ]);
  }, 180_000);
});
