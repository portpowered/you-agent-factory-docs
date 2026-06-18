import { describe, expect, test } from "bun:test";
import { EARLY_FOUNDATION_GATE_STEPS } from "../../src/lib/quality-gate/steps";
import { dryRunMake } from "../helpers/make";

const verifyingMakeTest = process.env.VERIFYING_MAKE_TEST === "1";
const testUnlessVerifying = verifyingMakeTest ? test.skip : test;

describe("early gate automation parity", () => {
  testUnlessVerifying(
    "make quality-gate delegates to the bun quality-gate script",
    () => {
      expect(dryRunMake("quality-gate")).toContain("bun run quality-gate");
    },
  );

  testUnlessVerifying(
    "quality-gate keeps the enforced foundation steps in the shared ordered contract",
    () => {
      expect(EARLY_FOUNDATION_GATE_STEPS.map((step) => step.name)).toEqual([
        "typecheck",
        "lint",
        "localization validation",
        "content validation",
        "focused accessibility validation",
        "static export correctness",
        "search-index contract validation",
        "foundation unit tests",
      ]);
    },
  );
});
