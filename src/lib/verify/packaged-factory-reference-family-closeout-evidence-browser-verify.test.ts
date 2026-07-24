/**
 * Closeout story 008 — required-suite browser evidence for the packaged-factory
 * reference family. Runs under `make test-integration` (after `make build`) so
 * CI enforces the in-app family probe rather than fixture-only unit coverage.
 */

import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { provePackagedFactoryCloseoutEvidenceInBrowser } from "./assert-packaged-factory-reference-family-closeout-evidence-browser";
import {
  PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_STANDARD_CHILDREN_FOR_REPLAY,
  PACKAGED_FACTORY_CLOSEOUT_FAMILY_COMPLETE_STATEMENT,
} from "./packaged-factory-reference-family-closeout-evidence";
import { VERIFY_PRODUCTION_INTEGRATION_TESTS_ENV } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");
const outDir = join(repoRoot, "out");
const goalExportIndex = join(
  outDir,
  "docs/references/packaged-factories-index/goal/index.html",
);

describe("packaged-factory-reference-family-closeout evidence browser verify", () => {
  test("trusted out/ family surfaces produce a complete evidence pack", async () => {
    if (process.env[VERIFY_PRODUCTION_INTEGRATION_TESTS_ENV] !== "1") {
      return;
    }

    expect(existsSync(outDir)).toBe(true);
    expect(existsSync(goalExportIndex)).toBe(true);

    // Repository gate peers are enforced by make ci; this suite owns the
    // in-app browser observations + evidence pack assembly.
    process.env.CLOSEOUT_EVIDENCE_ASSUME_GATES_PASS = "1";
    process.env.CLOSEOUT_EVIDENCE_INTEGRATION_FIXES_JSON = JSON.stringify([
      "Wire closeout tip proofs into verify-contract + integration suites",
      "Story 004 export-payload exclusion observation",
      "Story 008 browser evidence required under make test-integration",
    ]);

    const proof = await provePackagedFactoryCloseoutEvidenceInBrowser();

    expect(proof.servedFrom).toBe("static-export");
    expect(proof.evidencePack.closeoutStatus).toBe("complete");
    expect(proof.evidencePack.closeoutStatement).toBe(
      PACKAGED_FACTORY_CLOSEOUT_FAMILY_COMPLETE_STATEMENT,
    );
    expect(proof.evidencePack.residualFollowUps).toEqual([]);
    expect(proof.evidencePack.browserSurfaces.map((s) => s.surfaceId)).toEqual([
      "parent-index",
      "standard-child-replay",
      "deep-research-child",
      "home-youi",
    ]);

    const parent = proof.evidencePack.browserSurfaces.find(
      (surface) => surface.surfaceId === "parent-index",
    );
    expect(parent?.surfaceId).toBe("parent-index");
    if (parent?.surfaceId !== "parent-index") {
      throw new Error("expected parent-index surface");
    }
    expect(parent.ok).toBe(true);
    expect(parent.definitionPanelCount).toBe(7);
    expect(parent.childLinkCount).toBe(7);

    const children = proof.evidencePack.browserSurfaces.find(
      (surface) => surface.surfaceId === "standard-child-replay",
    );
    expect(children?.surfaceId).toBe("standard-child-replay");
    if (children?.surfaceId !== "standard-child-replay") {
      throw new Error("expected standard-child-replay surface");
    }
    expect(children.ok).toBe(true);
    expect(children.children.map((child) => child.slug)).toEqual([
      ...PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_STANDARD_CHILDREN_FOR_REPLAY,
    ]);

    const deepResearch = proof.evidencePack.browserSurfaces.find(
      (surface) => surface.surfaceId === "deep-research-child",
    );
    expect(deepResearch?.ok).toBe(true);

    const home = proof.evidencePack.browserSurfaces.find(
      (surface) => surface.surfaceId === "home-youi",
    );
    expect(home?.surfaceId).toBe("home-youi");
    if (home?.surfaceId !== "home-youi") {
      throw new Error("expected home-youi surface");
    }
    expect(home.ok).toBe(true);
    expect(home.compactReplayActivated).toBe(true);
    expect(home.playPause).toBe(true);
  }, 300_000);
});
