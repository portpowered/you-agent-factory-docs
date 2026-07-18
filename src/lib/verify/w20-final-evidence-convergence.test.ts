import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateFinalEvidenceConvergence,
  listW20FinalEvidenceCoveredFamilies,
  W20_FINAL_EVIDENCE_BROWSER_PROBES,
  W20_FINAL_EVIDENCE_COMMAND_GATES,
  W20_FINAL_EVIDENCE_ENTRIES,
  W20_FINAL_EVIDENCE_POST_COMMAND_SUITE_PATHS,
  W20_FINAL_EVIDENCE_REQUIRED_FAMILIES,
  W20_FINAL_EVIDENCE_REQUIRED_TEST_PATHS,
  W20_FINAL_EVIDENCE_SUITE_COMMAND,
  W20_FINAL_EVIDENCE_SUITE_ENTRIES,
  W20_UPSTREAM_FOLLOW_UP_ALLOWED_SCOPES,
  W20_UPSTREAM_FOLLOW_UPS,
} from "./w20-final-evidence-convergence";

const repoRoot = join(import.meta.dir, "../../..");

describe("W20 final-evidence convergence catalog", () => {
  test("documents the maintainer reproduction command", () => {
    expect(W20_FINAL_EVIDENCE_SUITE_COMMAND).toBe(
      "make test-w20-final-evidence",
    );
  });

  test("lists make check as the lint/typecheck command gate", () => {
    expect(W20_FINAL_EVIDENCE_COMMAND_GATES.length).toBe(1);

    const [gate] = W20_FINAL_EVIDENCE_COMMAND_GATES;
    expect(gate.makeTarget).toBe("check");
    expect(gate.packageScript).toBe("check");
    expect(Object.keys(gate.env)).toEqual([]);
    expect([...gate.families]).toEqual(["lint-typecheck"]);
  });

  test("records every required §17 gate family with a command and evidence path", () => {
    expect(W20_FINAL_EVIDENCE_ENTRIES.length).toBe(
      W20_FINAL_EVIDENCE_REQUIRED_FAMILIES.length,
    );

    const families = W20_FINAL_EVIDENCE_ENTRIES.map((entry) => entry.family);
    expect(families).toEqual([...W20_FINAL_EVIDENCE_REQUIRED_FAMILIES]);

    for (const entry of W20_FINAL_EVIDENCE_ENTRIES) {
      expect(entry.command.length).toBeGreaterThan(0);
      expect(entry.evidencePath.length).toBeGreaterThan(0);
      expect(
        entry.storyId.startsWith("refs-w20-static-export-convergence-"),
      ).toBe(true);
      expect(existsSync(join(repoRoot, entry.evidencePath))).toBe(true);
    }
  });

  test("covers every required final-evidence gate family", () => {
    const covered = listW20FinalEvidenceCoveredFamilies();
    expect(covered).toEqual([...W20_FINAL_EVIDENCE_REQUIRED_FAMILIES].sort());

    for (const family of W20_FINAL_EVIDENCE_REQUIRED_FAMILIES) {
      expect(covered).toContain(family);
    }
  });

  test("locks upstream follow-ups to Worker/Workstation discriminated-schema only", () => {
    expect([...W20_UPSTREAM_FOLLOW_UP_ALLOWED_SCOPES]).toEqual([
      "worker-workstation-discriminated-schema",
    ]);
    expect(W20_UPSTREAM_FOLLOW_UPS.length).toBeGreaterThan(0);

    for (const followUp of W20_UPSTREAM_FOLLOW_UPS) {
      expect(followUp.scope).toBe("worker-workstation-discriminated-schema");
      expect(followUp.summary.length).toBeGreaterThan(0);
      expect(followUp.source.length).toBeGreaterThan(0);
      expect(followUp.exampleDefs.length).toBeGreaterThan(0);
    }

    const exampleDefs = W20_UPSTREAM_FOLLOW_UPS.flatMap(
      (followUp) => followUp.exampleDefs,
    );
    expect(exampleDefs).toContain("AgentWorker");
    expect(exampleDefs).toContain("RepeaterWorkstation");
    expect(exampleDefs).toContain("ClassifierWorkstation");
    expect(exampleDefs).toContain("Worker");
    expect(exampleDefs).toContain("Workstation");
  });

  test("lists representative browser probes covering api/events/schema/authored families", () => {
    expect(W20_FINAL_EVIDENCE_BROWSER_PROBES.length).toBe(6);

    const families = W20_FINAL_EVIDENCE_BROWSER_PROBES.map(
      (probe) => probe.family,
    ).sort();
    expect(families).toEqual([
      "api",
      "events",
      "factory",
      "schema",
      "worker",
      "workstation",
    ]);

    expect(
      W20_FINAL_EVIDENCE_BROWSER_PROBES.map((probe) => probe.path),
    ).toEqual([
      "/docs/references/api",
      "/docs/references/events",
      "/docs/references/factory-schema",
      "/docs/factories/packaged",
      "/docs/workers/hosted",
      "/docs/workstations/standard",
    ]);
  });

  test("lists catalog + browser-verify suite files that exist", () => {
    expect(W20_FINAL_EVIDENCE_SUITE_ENTRIES.length).toBeGreaterThan(0);
    expect(W20_FINAL_EVIDENCE_REQUIRED_TEST_PATHS.length).toBe(
      W20_FINAL_EVIDENCE_SUITE_ENTRIES.length,
    );

    for (const relativePath of W20_FINAL_EVIDENCE_REQUIRED_TEST_PATHS) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }

    expect([...W20_FINAL_EVIDENCE_POST_COMMAND_SUITE_PATHS]).toEqual([
      "src/lib/verify/w20-final-evidence-browser-verify.test.ts",
    ]);
  });

  test("evaluateFinalEvidenceConvergence reports complete evidence", () => {
    const result = evaluateFinalEvidenceConvergence();
    if (!result.ok) {
      console.error(
        [
          "W20 final-evidence evaluation failed:",
          ...result.reasons.map((reason) => `  - ${reason}`),
          `Reproduce with: ${W20_FINAL_EVIDENCE_SUITE_COMMAND}`,
        ].join("\n"),
      );
    }

    expect(result.ok).toBe(true);
    expect(result.missingFamilies).toEqual([]);
    expect(result.emptyPointers).toEqual([]);
    expect(result.upstreamScopeViolations).toEqual([]);
    expect(result.coveredFamilies).toEqual(
      [...W20_FINAL_EVIDENCE_REQUIRED_FAMILIES].sort(),
    );
  });
});
