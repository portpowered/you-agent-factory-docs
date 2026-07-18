import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  listW20BudgetCoveredFamilies,
  W20_BUDGET_COMMAND_GATES,
  W20_BUDGET_FOCUSED_PAYLOAD_PAGE_BUDGETS,
  W20_BUDGET_FOCUSED_PAYLOAD_ROUTE_IDS,
  W20_BUDGET_LIVE_GATE_COMMANDS,
  W20_BUDGET_POST_COMMAND_SUITE_PATHS,
  W20_BUDGET_REQUIRED_FAMILIES,
  W20_BUDGET_REQUIRED_TEST_PATHS,
  W20_BUDGET_SUITE_COMMAND,
  W20_BUDGET_SUITE_ENTRIES,
  W20_BUDGET_TOTAL_SITE_BASELINES,
} from "./w20-budget-convergence";

const repoRoot = join(import.meta.dir, "../../..");

describe("W20 budget convergence catalog", () => {
  test("documents the maintainer reproduction command", () => {
    expect(W20_BUDGET_SUITE_COMMAND).toBe("make test-w20-budget");
  });

  test("lists make budget as the sole command gate", () => {
    expect(W20_BUDGET_COMMAND_GATES.length).toBe(1);

    const [gate] = W20_BUDGET_COMMAND_GATES;
    expect(gate.makeTarget).toBe("budget");
    expect(gate.packageScript).toBe("budget");
    expect(Object.keys(gate.env)).toEqual([]);
    expect([...gate.families]).toEqual([
      "total-site-exported-budget",
      "focused-reference-payload-budgets",
      "trusted-out-measurement",
    ]);
  });

  test("documents the live gate sequence (build then budget)", () => {
    expect([...W20_BUDGET_LIVE_GATE_COMMANDS]).toEqual([
      "make build",
      "make budget",
    ]);
  });

  test("lists a non-empty set of existing budget suite files", () => {
    expect(W20_BUDGET_SUITE_ENTRIES.length).toBeGreaterThan(0);
    expect(W20_BUDGET_REQUIRED_TEST_PATHS.length).toBe(
      W20_BUDGET_SUITE_ENTRIES.length,
    );

    for (const relativePath of W20_BUDGET_REQUIRED_TEST_PATHS) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });

  test("keeps suite paths unique", () => {
    const paths = W20_BUDGET_REQUIRED_TEST_PATHS;
    expect(new Set(paths).size).toBe(paths.length);
  });

  test("covers every required budget gate family", () => {
    const covered = listW20BudgetCoveredFamilies();
    expect(covered).toEqual([...W20_BUDGET_REQUIRED_FAMILIES].sort());

    for (const family of W20_BUDGET_REQUIRED_FAMILIES) {
      expect(covered).toContain(family);
    }
  });

  test("locks focused reference payload routes and total-site ceilings", () => {
    expect([...W20_BUDGET_FOCUSED_PAYLOAD_ROUTE_IDS]).toEqual([
      "references-api",
      "references-events",
      "references-factory-schema",
    ]);
    expect(W20_BUDGET_FOCUSED_PAYLOAD_PAGE_BUDGETS.length).toBe(3);

    expect(W20_BUDGET_TOTAL_SITE_BASELINES.maxTotalOutBytes).toBe(235_000_000);
    expect(W20_BUDGET_TOTAL_SITE_BASELINES.maxNextStaticJsBytes).toBe(
      3_500_000,
    );
    expect(W20_BUDGET_TOTAL_SITE_BASELINES.maxSearchBootstrapBytes).toBe(
      32_000_000,
    );

    expect(W20_BUDGET_POST_COMMAND_SUITE_PATHS).toContain(
      "src/lib/verify/w20-budget-out-verify.test.ts",
    );
  });
});
