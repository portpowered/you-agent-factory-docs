import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DEFERRED_PHASE_8_QUALITY_CHECKS } from "@/lib/quality-gate/deferred-phase8";
import { EARLY_FOUNDATION_GATE_STEPS } from "@/lib/quality-gate/steps";

const repoRoot = join(import.meta.dir, "..");
const QUALITY_GATE_DRY_RUN_ENV = "QUALITY_GATE_DRY_RUN";
const QUALITY_GATE_START_STEP_ENV = "QUALITY_GATE_START_STEP";

function runStep(step: (typeof EARLY_FOUNDATION_GATE_STEPS)[number]): number {
  console.log(`\n==> Early quality gate: ${step.name}`);

  if (process.env[QUALITY_GATE_DRY_RUN_ENV] === "1") {
    return 0;
  }

  const result = spawnSync(step.command, step.args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
    stdio: "inherit",
  });

  return result.status ?? 1;
}

console.log("Running early foundation quality gate.");
console.log(
  `Deferred to later Phase 8 work: ${DEFERRED_PHASE_8_QUALITY_CHECKS.join(", ")}`,
);

const startStepName = process.env[QUALITY_GATE_START_STEP_ENV];
let reachedRequestedStartStep = startStepName === undefined;

for (const step of EARLY_FOUNDATION_GATE_STEPS) {
  if (!reachedRequestedStartStep) {
    reachedRequestedStartStep = step.name === startStepName;
  }

  if (!reachedRequestedStartStep) {
    continue;
  }

  const status = runStep(step);
  if (status !== 0) {
    console.error(`\nEarly quality gate failed at: ${step.name}`);
    process.exit(status);
  }
}

const exportDir = join(repoRoot, "out");
if (process.env[QUALITY_GATE_DRY_RUN_ENV] !== "1" && !existsSync(exportDir)) {
  console.error(
    "\nEarly quality gate failed: static export output missing at out/",
  );
  process.exit(1);
}

console.log("\nEarly foundation quality gate passed.");
