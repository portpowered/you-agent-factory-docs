import { describe, expect, test } from "bun:test";
import { EARLY_FOUNDATION_GATE_STEPS } from "../../src/lib/quality-gate/steps";
import { dryRunMake, runMake } from "../helpers/make";

describe("early foundation quality gate command surface", () => {
  test("make quality-gate delegates to the bun quality-gate script", () => {
    expect(dryRunMake("quality-gate")).toContain("bun run quality-gate");
  });

  test("quality-gate steps run foundational checks in enforced order", () => {
    const orderedChecks = [
      "typecheck",
      "lint",
      "validate:localization",
      "validate:content",
      "validate:accessibility",
      "validate:static-export",
    ];

    const flattenedArgs = EARLY_FOUNDATION_GATE_STEPS.flatMap(
      (step) => step.args,
    );
    let previousIndex = -1;

    for (const check of orderedChecks) {
      const index = flattenedArgs.indexOf(check);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeGreaterThan(previousIndex);
      previousIndex = index;
    }
  });

  test("make quality-gate succeeds on the current foundation baseline", () => {
    const result = runMake("quality-gate");

    expect(result.status).toBe(0);
  }, 180_000);
});
