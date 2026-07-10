/**
 * Recorded optimize-next-static-export evidence (story 007).
 *
 * Captured on the agreed reference machine class (Apple Silicon M1 Max,
 * Darwin arm64, 10 logical CPUs, Bun 1.3.13) at UTC 2026-07-10.
 *
 * Re-run with `make benchmark-static-export MODE=clean|warm` and
 * `bun run prove:static-export-optimization-evidence` after material
 * export-path changes.
 */

import {
  evaluateStaticExportOptimizationEvidence,
  type StaticExportOptimizationEvidenceEvaluation,
} from "@/lib/build/static-export-optimization-evidence";
import type { StaticExportProfileCacheReasons } from "@/lib/build/static-export-profile";

export const RECORDED_STATIC_EXPORT_OPTIMIZATION_EVIDENCE = {
  recordedAtUtc: "2026-07-10T21:35:00Z",
  machineClass: {
    osFamily: "darwin",
    cpuArchitecture: "arm64",
    logicalCpuCount: 10,
    runtimeName: "bun",
    runtimeVersion: "1.3.13",
    cpuSummary: "Apple M1 Max",
  },
  /** First clean profiled export (`make benchmark-static-export MODE=clean`). */
  clean: {
    totalWallTimeMs: 111_560,
    summaryExcerpt: [
      "mode=clean",
      "totalWallTimeMs=111560.15024999999",
      "contentRuntimePreparationCache=miss:clean-mode-regenerates",
      "fumadocsGenerationCache=miss:clean-mode-regenerates",
      "nextCompilationStaticRenderingCache=miss:clean-mode-regenerates",
      "searchIndexEmissionCache=miss:clean-mode-regenerates",
      "staticRouteCount=169",
      "localeCount=4",
      "majorBundleModuleCount=77",
    ],
  },
  /** Warm profiled export after the first clean (`MODE=warm`). */
  warm: {
    totalWallTimeMs: 92_776,
    cacheReasons: {
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
        reason: "always-writes-fingerprint",
      },
    } satisfies StaticExportProfileCacheReasons,
    summaryExcerpt: [
      "mode=warm",
      "totalWallTimeMs=92775.69",
      "contentRuntimePreparationCache=hit:fingerprint-store-and-outputs-present",
      "fumadocsGenerationCache=hit:immutable-snapshot-store-and-source-present",
      "nextCompilationStaticRenderingCache=hit:next-compiler-cache-present",
      "searchIndexEmissionCache=hit:parsed-documents-store-present",
    ],
  },
  /**
   * Contracted-surface digests from two consecutive clean exports with
   * identical inputs (root base path). Bootstrap payloads are byte-identical;
   * HTML digests encode base-path contract outcomes + length band.
   */
  determinism: {
    firstDigests: {
      "bootstrap:api/search":
        "8683b5e9104471d9dfc6938854a58f1252a3697c532c32d27e689d0815290c8e",
      "bootstrap:api/search.ja":
        "df0a9deec3380f6cd4682ae03c1906e5e4a044e5f0aacc45743284da705213b6",
      "bootstrap:api/search.vi":
        "f2f3b1533f6bd0e820c6fee84fedd823d76fcf8816becf83a30b36f231232a77",
      "bootstrap:api/search.zh-CN":
        "ed3ce3ce6391a059a0b3af78c5deaab549ecffd65044399add23de5a2c989a6e",
      "html-contract:index.html":
        "d1e7421964ba40174999d9c113c68a2829298c6554c88c3563a87d8fb19e997b",
      "html-contract:blog.html":
        "5d98631ff99171f9efb45819aa72196141b4e5aebbfbad35a739ceed7918e439",
      "html-contract:docs/guides.html":
        "7eb69fdda291518cab90cbe448b95516009dff0b9528c27e591ef16c287731b0",
    },
    secondDigests: {
      "bootstrap:api/search":
        "8683b5e9104471d9dfc6938854a58f1252a3697c532c32d27e689d0815290c8e",
      "bootstrap:api/search.ja":
        "df0a9deec3380f6cd4682ae03c1906e5e4a044e5f0aacc45743284da705213b6",
      "bootstrap:api/search.vi":
        "f2f3b1533f6bd0e820c6fee84fedd823d76fcf8816becf83a30b36f231232a77",
      "bootstrap:api/search.zh-CN":
        "ed3ce3ce6391a059a0b3af78c5deaab549ecffd65044399add23de5a2c989a6e",
      "html-contract:index.html":
        "d1e7421964ba40174999d9c113c68a2829298c6554c88c3563a87d8fb19e997b",
      "html-contract:blog.html":
        "5d98631ff99171f9efb45819aa72196141b4e5aebbfbad35a739ceed7918e439",
      "html-contract:docs/guides.html":
        "7eb69fdda291518cab90cbe448b95516009dff0b9528c27e591ef16c287731b0",
    },
  },
} as const;

export function recordedStaticExportOptimizationEvidence(): StaticExportOptimizationEvidenceEvaluation {
  return evaluateStaticExportOptimizationEvidence({
    cleanTotalWallTimeMs:
      RECORDED_STATIC_EXPORT_OPTIMIZATION_EVIDENCE.clean.totalWallTimeMs,
    warmTotalWallTimeMs:
      RECORDED_STATIC_EXPORT_OPTIMIZATION_EVIDENCE.warm.totalWallTimeMs,
    warmCacheReasons:
      RECORDED_STATIC_EXPORT_OPTIMIZATION_EVIDENCE.warm.cacheReasons,
    firstDigests:
      RECORDED_STATIC_EXPORT_OPTIMIZATION_EVIDENCE.determinism.firstDigests,
    secondDigests:
      RECORDED_STATIC_EXPORT_OPTIMIZATION_EVIDENCE.determinism.secondDigests,
  });
}
