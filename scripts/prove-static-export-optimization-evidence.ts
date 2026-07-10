/**
 * Maintainer entrypoint: print the recorded optimize-next-static-export
 * evidence gate (clean <=180s, warm faster with cache reuse, determinism).
 *
 * Does not re-run the full benchmark. Re-measure with:
 *   make benchmark-static-export MODE=clean
 *   make benchmark-static-export MODE=warm
 * then update `static-export-optimization-evidence-recorded.ts`.
 */

import { STATIC_EXPORT_CLEAN_BUDGET_MS } from "../src/lib/build/static-export-optimization-evidence";
import {
  RECORDED_STATIC_EXPORT_OPTIMIZATION_EVIDENCE,
  recordedStaticExportOptimizationEvidence,
} from "../src/lib/build/static-export-optimization-evidence-recorded";

const evidence = recordedStaticExportOptimizationEvidence();
const recorded = RECORDED_STATIC_EXPORT_OPTIMIZATION_EVIDENCE;

console.log("static-export-optimization-evidence=recorded");
console.log(`recordedAtUtc=${recorded.recordedAtUtc}`);
console.log(`cleanBudgetMs=${STATIC_EXPORT_CLEAN_BUDGET_MS}`);
console.log(
  `machine=${recorded.machineClass.cpuSummary};${recorded.machineClass.osFamily};${recorded.machineClass.cpuArchitecture};cpus=${recorded.machineClass.logicalCpuCount};${recorded.machineClass.runtimeName}@${recorded.machineClass.runtimeVersion}`,
);
for (const line of evidence.summaryLines) {
  console.log(line);
}

if (!evidence.overallPasses) {
  process.exit(1);
}
