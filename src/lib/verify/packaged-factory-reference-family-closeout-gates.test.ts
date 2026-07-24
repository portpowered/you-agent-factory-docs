/**
 * Closeout story 007 — tip proofs for avoidable import leakage isolation and
 * full repository gate contracts (validate-data → ci) without budget inflation.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_EXPORT_OUT_DIR } from "@/lib/build/export-out-directory";
import { FACTORY_EXPORTED_SITE_BUDGET_BASELINES } from "@/lib/build/exported-site-budget";
import { MAKE_CI_PREREQUISITES } from "@/lib/ci-required-path";
import { VERIFY_PRODUCTION_INTEGRATION_TESTS_ENV } from "@/lib/verify/server-lifecycle";
import {
  assertPackagedFactoryCloseoutBudgetCeilingsLocked,
  listPackagedFactoryCloseoutCoveredGateFamilies,
  PACKAGED_FACTORY_CLOSEOUT_LEAKAGE_REMEDIATION_POLICY,
  PACKAGED_FACTORY_CLOSEOUT_LOCKED_BUDGET_BASELINES,
  PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_COMMAND_GATES,
  PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_GATE_COMMANDS,
  PACKAGED_FACTORY_CLOSEOUT_REQUIRED_GATE_FAMILIES,
  PackagedFactoryCloseoutGatesError,
  provePackagedFactoryCloseoutBudgetAgainstOut,
  provePackagedFactoryReferenceFamilyCloseoutGates,
} from "./packaged-factory-reference-family-closeout-gates";

const repoRoot = join(import.meta.dir, "../../..");
const outDir = join(repoRoot, DEFAULT_EXPORT_OUT_DIR);

function requireTrustedOutOrSkip(): boolean {
  if (existsSync(outDir)) {
    return true;
  }
  if (process.env[VERIFY_PRODUCTION_INTEGRATION_TESTS_ENV] === "1") {
    throw new Error(
      "trusted out/ is required for packaged-factory closeout gates tip proof under make test-integration",
    );
  }
  return false;
}

describe("packaged-factory-reference-family-closeout gates (pure)", () => {
  test("catalogues the PRD repository gate inventory in order", () => {
    expect(
      PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_COMMAND_GATES.map(
        (gate) => gate.makeTarget,
      ),
    ).toEqual([
      "validate-data",
      "linkcheck",
      "check",
      "build",
      "a11y",
      "budget",
      "ci",
    ]);
    expect(PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_GATE_COMMANDS).toEqual([
      "make validate-data",
      "make linkcheck",
      "make check",
      "make build",
      "make a11y",
      "make budget",
      "make ci",
    ]);
  });

  test("covers every required closeout gate family", () => {
    expect(listPackagedFactoryCloseoutCoveredGateFamilies()).toEqual(
      [...PACKAGED_FACTORY_CLOSEOUT_REQUIRED_GATE_FAMILIES].sort(),
    );
  });

  test("locks tip budget ceilings without inflation headroom", () => {
    expect(PACKAGED_FACTORY_CLOSEOUT_LOCKED_BUDGET_BASELINES).toEqual({
      maxTotalOutBytes: 385_000_000,
      maxNextStaticJsBytes: 15_000_000,
      maxSearchBootstrapBytes: 32_000_000,
    });
    expect(PACKAGED_FACTORY_CLOSEOUT_LOCKED_BUDGET_BASELINES).toEqual(
      FACTORY_EXPORTED_SITE_BUDGET_BASELINES,
    );
    expect(PACKAGED_FACTORY_CLOSEOUT_LEAKAGE_REMEDIATION_POLICY).toBe(
      "fix-import-leakage-before-raising-budget-ceilings",
    );

    const evidence = assertPackagedFactoryCloseoutBudgetCeilingsLocked();
    expect(evidence.matchesLiveBaselines).toBe(true);
    expect(evidence.remediationPolicy).toBe(
      PACKAGED_FACTORY_CLOSEOUT_LEAKAGE_REMEDIATION_POLICY,
    );
  });

  test("fails closed when live budget ceilings are inflated above the lock", () => {
    expect(() =>
      assertPackagedFactoryCloseoutBudgetCeilingsLocked({
        ...FACTORY_EXPORTED_SITE_BUDGET_BASELINES,
        maxTotalOutBytes:
          PACKAGED_FACTORY_CLOSEOUT_LOCKED_BUDGET_BASELINES.maxTotalOutBytes +
          1,
      }),
    ).toThrow(PackagedFactoryCloseoutGatesError);

    try {
      assertPackagedFactoryCloseoutBudgetCeilingsLocked({
        ...FACTORY_EXPORTED_SITE_BUDGET_BASELINES,
        maxNextStaticJsBytes:
          PACKAGED_FACTORY_CLOSEOUT_LOCKED_BUDGET_BASELINES.maxNextStaticJsBytes +
          1,
      });
      throw new Error("expected budget-ceiling-inflated");
    } catch (error) {
      expect(error).toBeInstanceOf(PackagedFactoryCloseoutGatesError);
      expect((error as PackagedFactoryCloseoutGatesError).code).toBe(
        "budget-ceiling-inflated",
      );
      expect(String(error)).toContain(
        PACKAGED_FACTORY_CLOSEOUT_LEAKAGE_REMEDIATION_POLICY,
      );
    }
  });

  test("make ci prerequisites still include the story 007 command gates", () => {
    for (const target of [
      "validate-data",
      "linkcheck",
      "build",
      "a11y",
      "budget",
    ] as const) {
      expect(MAKE_CI_PREREQUISITES).toContain(target);
    }
    // `check` is typecheck+lint; make ci lists those peers explicitly.
    expect(MAKE_CI_PREREQUISITES).toContain("lint");
    expect(MAKE_CI_PREREQUISITES).toContain("typecheck");
  });
});

describe("packaged-factory-reference-family-closeout gates (tip)", () => {
  test("import-leakage detectors + locked budget evaluation stay green on tip", async () => {
    if (!requireTrustedOutOrSkip()) {
      return;
    }

    const budgetOnly = provePackagedFactoryCloseoutBudgetAgainstOut({
      cwd: repoRoot,
    });
    expect(budgetOnly.ok).toBe(true);
    expect(budgetOnly.measurement?.totalOutBytes).toBeLessThanOrEqual(
      PACKAGED_FACTORY_CLOSEOUT_LOCKED_BUDGET_BASELINES.maxTotalOutBytes,
    );
    expect(budgetOnly.measurement?.nextStaticJsBytes).toBeLessThanOrEqual(
      PACKAGED_FACTORY_CLOSEOUT_LOCKED_BUDGET_BASELINES.maxNextStaticJsBytes,
    );
    expect(budgetOnly.measurement?.searchBootstrapBytes).toBeLessThanOrEqual(
      PACKAGED_FACTORY_CLOSEOUT_LOCKED_BUDGET_BASELINES.maxSearchBootstrapBytes,
    );

    const evidence = await provePackagedFactoryReferenceFamilyCloseoutGates({
      projectRoot: repoRoot,
    });

    expect(evidence.budgetLock.matchesLiveBaselines).toBe(true);
    expect(evidence.budgetEvaluation.ok).toBe(true);
    expect(evidence.importGraphs.children).toHaveLength(6);
    expect(evidence.importGraphs.parent).toHaveLength(2);
    expect(evidence.importGraphs.youi).toHaveLength(2);
    expect(
      evidence.importGraphs.positiveControl.parentDetectorObservesReplay,
    ).toBe(true);
    expect(
      evidence.importGraphs.positiveControl
        .youiPollutedFixtureObservesForbidden,
    ).toBe(true);
    expect(evidence.commandGates).toHaveLength(7);
  }, 120_000);
});
