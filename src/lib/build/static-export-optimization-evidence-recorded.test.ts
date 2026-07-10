import { describe, expect, test } from "bun:test";
import { STATIC_EXPORT_CLEAN_BUDGET_MS } from "@/lib/build/static-export-optimization-evidence";
import {
  RECORDED_STATIC_EXPORT_OPTIMIZATION_EVIDENCE,
  recordedStaticExportOptimizationEvidence,
} from "@/lib/build/static-export-optimization-evidence-recorded";

describe("static-export-optimization-evidence-recorded", () => {
  test("recorded evidence meets clean budget, warm reuse, and determinism", () => {
    const evidence = recordedStaticExportOptimizationEvidence();

    expect(
      RECORDED_STATIC_EXPORT_OPTIMIZATION_EVIDENCE.clean.totalWallTimeMs,
    ).toBeLessThanOrEqual(STATIC_EXPORT_CLEAN_BUDGET_MS);
    expect(
      RECORDED_STATIC_EXPORT_OPTIMIZATION_EVIDENCE.warm.totalWallTimeMs,
    ).toBeLessThan(
      RECORDED_STATIC_EXPORT_OPTIMIZATION_EVIDENCE.clean.totalWallTimeMs,
    );
    expect(evidence.cleanBudget.passes).toBe(true);
    expect(evidence.warm.passes).toBe(true);
    expect(evidence.warm.reportsCacheReuse).toBe(true);
    expect(evidence.determinism.passes).toBe(true);
    expect(evidence.overallPasses).toBe(true);
    expect(evidence.summaryLines).toContain("overallPasses=true");
  });

  test("recorded machine metadata matches the reference class", () => {
    const machine = RECORDED_STATIC_EXPORT_OPTIMIZATION_EVIDENCE.machineClass;
    expect(machine.osFamily).toBe("darwin");
    expect(machine.cpuArchitecture).toBe("arm64");
    expect(machine.logicalCpuCount).toBe(10);
    expect(machine.runtimeName).toBe("bun");
    expect(machine.cpuSummary).toContain("M1 Max");
  });
});
