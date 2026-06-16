import { describe, expect, test } from "bun:test";
import { dryRunMake, runMake } from "../helpers/make";
import {
  extractQualityGateStepNames,
  runQualityGateScript,
} from "../helpers/validation";

describe("early foundation quality gate command surface", () => {
  test("make quality-gate delegates to the bun quality-gate script", () => {
    expect(dryRunMake("quality-gate")).toContain("bun run quality-gate");
  });

  test("quality-gate subprocess output shows foundational checks in enforced order", () => {
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

  test("make quality-gate succeeds on the current foundation baseline", () => {
    const result = runMake("quality-gate");

    expect(result.status).toBe(0);
  }, 180_000);
});
