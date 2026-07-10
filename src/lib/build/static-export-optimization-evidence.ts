/**
 * Pure evaluation helpers for the optimize-next-static-export evidence gate
 * (story 007): clean <=180s budget, warm faster with cache reuse, and
 * contracted-surface determinism.
 */

import type {
  StaticExportCacheReason,
  StaticExportProfileCacheReasons,
  StaticExportProfileStageId,
} from "@/lib/build/static-export-profile";
import { STATIC_EXPORT_PROFILE_STAGE_IDS } from "@/lib/build/static-export-profile";

/** Clean local static-export wall-time budget on the recorded reference machine. */
export const STATIC_EXPORT_CLEAN_BUDGET_MS = 180_000;

/**
 * Stages where warm mode is expected to report a cache hit when reuse is
 * working. Fingerprint writing is always a write and stays not-applicable.
 */
export const STATIC_EXPORT_WARM_REUSE_STAGE_IDS = [
  "contentRuntimePreparation",
  "fumadocsGeneration",
  "nextCompilationStaticRendering",
  "searchIndexEmission",
] as const satisfies readonly StaticExportProfileStageId[];

export type StaticExportWarmReuseStageId =
  (typeof STATIC_EXPORT_WARM_REUSE_STAGE_IDS)[number];

export type StaticExportCleanBudgetEvaluation = {
  passes: boolean;
  totalWallTimeMs: number;
  budgetMs: number;
  reason: string;
};

export type StaticExportWarmEvidenceEvaluation = {
  passes: boolean;
  warmFaster: boolean;
  reportsCacheReuse: boolean;
  reusedStageIds: readonly StaticExportWarmReuseStageId[];
  missingHitStageIds: readonly StaticExportWarmReuseStageId[];
  cleanTotalWallTimeMs: number;
  warmTotalWallTimeMs: number;
  reason: string;
};

export type StaticExportDeterminismEvaluation = {
  passes: boolean;
  mismatchPaths: readonly string[];
  reason: string;
};

export type StaticExportOptimizationEvidenceEvaluation = {
  cleanBudget: StaticExportCleanBudgetEvaluation;
  warm: StaticExportWarmEvidenceEvaluation;
  determinism: StaticExportDeterminismEvaluation;
  overallPasses: boolean;
  summaryLines: readonly string[];
};

export function evaluateStaticExportCleanBudget(
  totalWallTimeMs: number,
  budgetMs: number = STATIC_EXPORT_CLEAN_BUDGET_MS,
): StaticExportCleanBudgetEvaluation {
  if (!Number.isFinite(totalWallTimeMs) || totalWallTimeMs < 0) {
    return {
      passes: false,
      totalWallTimeMs,
      budgetMs,
      reason: "invalid-total-wall-time",
    };
  }

  if (totalWallTimeMs <= budgetMs) {
    return {
      passes: true,
      totalWallTimeMs,
      budgetMs,
      reason: "clean-within-budget",
    };
  }

  return {
    passes: false,
    totalWallTimeMs,
    budgetMs,
    reason: "clean-exceeds-budget",
  };
}

function isCacheHit(reason: StaticExportCacheReason | undefined): boolean {
  return reason?.status === "hit";
}

/**
 * Warm must be strictly faster than clean and report cache hits for the
 * reuse-capable stages that retained valid caches.
 */
export function evaluateStaticExportWarmEvidence(input: {
  cleanTotalWallTimeMs: number;
  warmTotalWallTimeMs: number;
  warmCacheReasons: StaticExportProfileCacheReasons;
}): StaticExportWarmEvidenceEvaluation {
  const { cleanTotalWallTimeMs, warmTotalWallTimeMs, warmCacheReasons } = input;

  if (
    !Number.isFinite(cleanTotalWallTimeMs) ||
    !Number.isFinite(warmTotalWallTimeMs) ||
    cleanTotalWallTimeMs < 0 ||
    warmTotalWallTimeMs < 0
  ) {
    return {
      passes: false,
      warmFaster: false,
      reportsCacheReuse: false,
      reusedStageIds: [],
      missingHitStageIds: [...STATIC_EXPORT_WARM_REUSE_STAGE_IDS],
      cleanTotalWallTimeMs,
      warmTotalWallTimeMs,
      reason: "invalid-wall-times",
    };
  }

  const warmFaster = warmTotalWallTimeMs < cleanTotalWallTimeMs;
  const reusedStageIds = STATIC_EXPORT_WARM_REUSE_STAGE_IDS.filter((stageId) =>
    isCacheHit(warmCacheReasons[stageId]),
  );
  const missingHitStageIds = STATIC_EXPORT_WARM_REUSE_STAGE_IDS.filter(
    (stageId) => !isCacheHit(warmCacheReasons[stageId]),
  );
  const reportsCacheReuse = reusedStageIds.length > 0;
  const passes = warmFaster && reportsCacheReuse;

  let reason = "warm-faster-with-cache-reuse";
  if (!warmFaster && !reportsCacheReuse) {
    reason = "warm-not-faster-and-no-cache-reuse";
  } else if (!warmFaster) {
    reason = "warm-not-faster-than-clean";
  } else if (!reportsCacheReuse) {
    reason = "warm-missing-cache-reuse";
  }

  return {
    passes,
    warmFaster,
    reportsCacheReuse,
    reusedStageIds,
    missingHitStageIds,
    cleanTotalWallTimeMs,
    warmTotalWallTimeMs,
    reason,
  };
}

/**
 * Two contracted-surface digests match when every path/hash pair is identical.
 */
export function evaluateStaticExportDeterminism(input: {
  firstDigests: Readonly<Record<string, string>>;
  secondDigests: Readonly<Record<string, string>>;
}): StaticExportDeterminismEvaluation {
  const firstKeys = Object.keys(input.firstDigests).sort();
  const secondKeys = Object.keys(input.secondDigests).sort();
  const mismatchPaths: string[] = [];

  if (firstKeys.length === 0 && secondKeys.length === 0) {
    return {
      passes: false,
      mismatchPaths: [],
      reason: "empty-contracted-digests",
    };
  }

  const allKeys = new Set([...firstKeys, ...secondKeys]);
  for (const key of [...allKeys].sort()) {
    const left = input.firstDigests[key];
    const right = input.secondDigests[key];
    if (left === undefined || right === undefined || left !== right) {
      mismatchPaths.push(key);
    }
  }

  if (mismatchPaths.length === 0) {
    return {
      passes: true,
      mismatchPaths: [],
      reason: "contracted-surfaces-match",
    };
  }

  return {
    passes: false,
    mismatchPaths,
    reason: "contracted-surfaces-differ",
  };
}

export function evaluateStaticExportOptimizationEvidence(input: {
  cleanTotalWallTimeMs: number;
  warmTotalWallTimeMs: number;
  warmCacheReasons: StaticExportProfileCacheReasons;
  firstDigests: Readonly<Record<string, string>>;
  secondDigests: Readonly<Record<string, string>>;
  budgetMs?: number;
}): StaticExportOptimizationEvidenceEvaluation {
  const cleanBudget = evaluateStaticExportCleanBudget(
    input.cleanTotalWallTimeMs,
    input.budgetMs,
  );
  const warm = evaluateStaticExportWarmEvidence({
    cleanTotalWallTimeMs: input.cleanTotalWallTimeMs,
    warmTotalWallTimeMs: input.warmTotalWallTimeMs,
    warmCacheReasons: input.warmCacheReasons,
  });
  const determinism = evaluateStaticExportDeterminism({
    firstDigests: input.firstDigests,
    secondDigests: input.secondDigests,
  });
  const overallPasses = cleanBudget.passes && warm.passes && determinism.passes;

  const summaryLines = [
    `cleanBudgetPasses=${cleanBudget.passes}`,
    `cleanTotalWallTimeMs=${cleanBudget.totalWallTimeMs}`,
    `cleanBudgetMs=${cleanBudget.budgetMs}`,
    `cleanBudgetReason=${cleanBudget.reason}`,
    `warmPasses=${warm.passes}`,
    `warmFaster=${warm.warmFaster}`,
    `warmReportsCacheReuse=${warm.reportsCacheReuse}`,
    `warmTotalWallTimeMs=${warm.warmTotalWallTimeMs}`,
    `warmReusedStages=${warm.reusedStageIds.join(",") || "none"}`,
    `warmReason=${warm.reason}`,
    `determinismPasses=${determinism.passes}`,
    `determinismReason=${determinism.reason}`,
    `determinismMismatchCount=${determinism.mismatchPaths.length}`,
    `overallPasses=${overallPasses}`,
  ];

  return {
    cleanBudget,
    warm,
    determinism,
    overallPasses,
    summaryLines,
  };
}

/** Ensures warm cache-reason fixtures cover every profile stage id. */
export function assertWarmCacheReasonsCoverAllStages(
  reasons: StaticExportProfileCacheReasons,
): void {
  for (const stageId of STATIC_EXPORT_PROFILE_STAGE_IDS) {
    if (!(stageId in reasons)) {
      throw new Error(`missing warm cache reason for stage ${stageId}`);
    }
  }
}
