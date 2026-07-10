import { describe, expect, test } from "bun:test";
import {
  evaluateStaticExportCleanBudget,
  evaluateStaticExportDeterminism,
  evaluateStaticExportOptimizationEvidence,
  evaluateStaticExportWarmEvidence,
  STATIC_EXPORT_CLEAN_BUDGET_MS,
} from "@/lib/build/static-export-optimization-evidence";
import type { StaticExportProfileCacheReasons } from "@/lib/build/static-export-profile";

function warmHitCacheReasons(): StaticExportProfileCacheReasons {
  return {
    contentRuntimePreparation: {
      status: "hit",
      reason: "fingerprint-store-and-outputs-present",
    },
    fumadocsGeneration: {
      status: "hit",
      reason: "immutable-snapshot-store-and-source-present",
    },
    nextCompilationStaticRendering: {
      status: "hit",
      reason: "next-compiler-cache-present",
    },
    searchIndexEmission: {
      status: "hit",
      reason: "parsed-documents-store-present",
    },
    fingerprintWriting: {
      status: "not-applicable",
      reason: "always-writes",
    },
  };
}

describe("static-export-optimization-evidence", () => {
  test("clean budget passes at or under 180s", () => {
    expect(evaluateStaticExportCleanBudget(179_999).passes).toBe(true);
    expect(evaluateStaticExportCleanBudget(180_000).passes).toBe(true);
    expect(evaluateStaticExportCleanBudget(180_001).passes).toBe(false);
    expect(STATIC_EXPORT_CLEAN_BUDGET_MS).toBe(180_000);
  });

  test("warm evidence requires faster wall time and at least one cache hit", () => {
    const warm = evaluateStaticExportWarmEvidence({
      cleanTotalWallTimeMs: 120_000,
      warmTotalWallTimeMs: 80_000,
      warmCacheReasons: warmHitCacheReasons(),
    });
    expect(warm.passes).toBe(true);
    expect(warm.warmFaster).toBe(true);
    expect(warm.reportsCacheReuse).toBe(true);
    expect(warm.reusedStageIds).toContain("nextCompilationStaticRendering");

    const slower = evaluateStaticExportWarmEvidence({
      cleanTotalWallTimeMs: 80_000,
      warmTotalWallTimeMs: 90_000,
      warmCacheReasons: warmHitCacheReasons(),
    });
    expect(slower.passes).toBe(false);
    expect(slower.reason).toBe("warm-not-faster-than-clean");

    const noHits = evaluateStaticExportWarmEvidence({
      cleanTotalWallTimeMs: 120_000,
      warmTotalWallTimeMs: 80_000,
      warmCacheReasons: {
        contentRuntimePreparation: {
          status: "miss",
          reason: "fingerprint-store-or-outputs-absent",
        },
        fumadocsGeneration: {
          status: "miss",
          reason: "immutable-snapshot-store-or-source-absent",
        },
        nextCompilationStaticRendering: {
          status: "miss",
          reason: "next-compiler-cache-absent",
        },
        searchIndexEmission: {
          status: "miss",
          reason: "parsed-documents-store-absent",
        },
        fingerprintWriting: {
          status: "not-applicable",
          reason: "always-writes",
        },
      },
    });
    expect(noHits.passes).toBe(false);
    expect(noHits.reason).toBe("warm-missing-cache-reuse");
  });

  test("determinism requires matching contracted digests", () => {
    const match = evaluateStaticExportDeterminism({
      firstDigests: {
        "bootstrap:api/search": "abc",
        "html-contract:index.html": "def",
      },
      secondDigests: {
        "bootstrap:api/search": "abc",
        "html-contract:index.html": "def",
      },
    });
    expect(match.passes).toBe(true);

    const mismatch = evaluateStaticExportDeterminism({
      firstDigests: { "bootstrap:api/search": "abc" },
      secondDigests: { "bootstrap:api/search": "xyz" },
    });
    expect(mismatch.passes).toBe(false);
    expect(mismatch.mismatchPaths).toEqual(["bootstrap:api/search"]);
  });

  test("overall evidence gate requires clean, warm, and determinism", () => {
    const digests = {
      "bootstrap:api/search": "abc",
      "html-contract:index.html": "def",
    };
    const passing = evaluateStaticExportOptimizationEvidence({
      cleanTotalWallTimeMs: 150_000,
      warmTotalWallTimeMs: 90_000,
      warmCacheReasons: warmHitCacheReasons(),
      firstDigests: digests,
      secondDigests: digests,
    });
    expect(passing.overallPasses).toBe(true);
    expect(passing.summaryLines).toContain("overallPasses=true");

    const failing = evaluateStaticExportOptimizationEvidence({
      cleanTotalWallTimeMs: 200_000,
      warmTotalWallTimeMs: 90_000,
      warmCacheReasons: warmHitCacheReasons(),
      firstDigests: digests,
      secondDigests: digests,
    });
    expect(failing.overallPasses).toBe(false);
    expect(failing.cleanBudget.passes).toBe(false);
  });
});
