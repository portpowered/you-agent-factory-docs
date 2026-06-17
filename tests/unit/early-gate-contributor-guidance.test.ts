import { describe, expect, test } from "bun:test";
import { DEFERRED_PHASE_8_QUALITY_CHECKS } from "../../src/lib/quality-gate/deferred-phase8";
import {
  extractQualityGateStepNames,
  runQualityGateScript,
} from "../helpers/validation";

describe("early gate contributor guidance", () => {
  test("quality-gate script announces deferred phase 8 checks before running foundation steps", () => {
    const result = runQualityGateScript();

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Running early foundation quality gate/);
    expect(result.stdout).toMatch(/Deferred to later Phase 8 work:/);

    for (const deferredCheck of DEFERRED_PHASE_8_QUALITY_CHECKS) {
      expect(result.stdout).toContain(deferredCheck);
    }

    const stepNames = extractQualityGateStepNames(result.stdout);
    expect(stepNames).toContain("typecheck");
    expect(stepNames).toContain("lint");
    expect(stepNames).toContain("localization validation");
    expect(stepNames).toContain("content validation");
    expect(stepNames).toContain("focused accessibility validation");
    expect(stepNames).toContain("static export correctness");
  }, 180_000);
});
