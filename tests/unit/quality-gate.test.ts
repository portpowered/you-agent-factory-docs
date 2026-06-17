import { describe, expect, test } from "bun:test";
import { DEFERRED_PHASE_8_QUALITY_CHECKS } from "../../src/lib/quality-gate/deferred-phase8";
import { dryRunMake, runMake } from "../helpers/make";
import {
  extractQualityGateStepNames,
  runQualityGateScript,
} from "../helpers/validation";

const verifyingMakeTest = process.env.VERIFYING_MAKE_TEST === "1";
const testUnlessVerifying = verifyingMakeTest ? test.skip : test;

describe("early foundation quality gate command surface", () => {
  testUnlessVerifying(
    "make quality-gate delegates to the bun quality-gate script",
    () => {
      expect(dryRunMake("quality-gate")).toContain("bun run quality-gate");
    },
  );

  testUnlessVerifying(
    "quality-gate subprocess output shows foundational checks in enforced order",
    () => {
      const result = runQualityGateScript();

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/Running early foundation quality gate/);
      expect(result.stdout).toMatch(/Deferred to later Phase 8 work:/);

      for (const deferredCheck of DEFERRED_PHASE_8_QUALITY_CHECKS) {
        expect(result.stdout).toContain(deferredCheck);
      }

      expect(extractQualityGateStepNames(result.stdout)).toEqual([
        "typecheck",
        "lint",
        "localization validation",
        "content validation",
        "focused accessibility validation",
        "static export correctness",
        "foundation unit tests",
      ]);
    },
    180_000,
  );

  testUnlessVerifying(
    "make quality-gate succeeds on the current foundation baseline",
    () => {
      const result = runMake("quality-gate");

      expect(result.status).toBe(0);
    },
    180_000,
  );
});
