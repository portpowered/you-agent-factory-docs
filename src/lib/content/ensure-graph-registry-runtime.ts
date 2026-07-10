import { spawnSync } from "node:child_process";
import {
  type ContentRuntimeFingerprintDependencies,
  type ContentRuntimeStepCacheDecision,
  evaluateContentRuntimeStepCache,
  writeContentRuntimeStepFingerprint,
} from "@/lib/content/content-runtime-fingerprints";
import { CONTENT_RUNTIME_PREPARATION_STEPS } from "@/lib/content/content-runtime-preparation";

export const GRAPH_REGISTRY_RUNTIME_STEP_ID = "graph-registry-runtime" as const;

const graphRegistryRuntimeStep = CONTENT_RUNTIME_PREPARATION_STEPS.find(
  (step) => step.id === GRAPH_REGISTRY_RUNTIME_STEP_ID,
);

if (!graphRegistryRuntimeStep) {
  throw new Error(
    `Missing "${GRAPH_REGISTRY_RUNTIME_STEP_ID}" in CONTENT_RUNTIME_PREPARATION_STEPS.`,
  );
}

export const GRAPH_REGISTRY_RUNTIME_OUTPUT_PATH =
  graphRegistryRuntimeStep.outputPath;

export type EnsureGraphRegistryRuntimeResult = {
  action: "skipped" | "generated";
  reason: ContentRuntimeStepCacheDecision["reason"] | "process-memo";
  fingerprint: string | null;
  generationCount: number;
};

export type EnsureGraphRegistryRuntimeOptions = {
  cwd: string;
  /**
   * When true, ignore cache hits and regenerate once for this call.
   * Process-local memo still collapses duplicate force regenerations in the
   * same process for the same cwd+fingerprint key after the first run.
   */
  forceClean?: boolean;
  /**
   * When false, do not reuse the process-local "already ensured" memo.
   * Defaults to true so prepare → build consumers share one generation.
   */
  useProcessMemo?: boolean;
  dependencies?: ContentRuntimeFingerprintDependencies;
  evaluateStepCache?: (options: {
    cwd: string;
    stepId: string;
    outputPath: string;
    forceClean?: boolean;
    dependencies?: ContentRuntimeFingerprintDependencies;
  }) => ContentRuntimeStepCacheDecision;
  recordStepFingerprint?: (
    cwd: string,
    stepId: string,
    fingerprint: string,
    dependencies?: ContentRuntimeFingerprintDependencies,
  ) => void;
  /**
   * Runs the graph-registry generator. Defaults to spawning
   * `bun ./scripts/generate-graph-registry-runtime.ts`.
   */
  runGenerator?: (cwd: string) => void;
  log?: (message: string) => void;
};

type ProcessMemoEntry = {
  fingerprint: string | null;
  result: EnsureGraphRegistryRuntimeResult;
};

const processMemoByCwd = new Map<string, ProcessMemoEntry>();
let generationInvocationCount = 0;

function defaultRunGenerator(cwd: string): void {
  const result = spawnSync(
    "bun",
    ["./scripts/generate-graph-registry-runtime.ts"],
    {
      cwd,
      env: process.env,
      stdio: "inherit",
    },
  );

  if (typeof result.status === "number" && result.status === 0) {
    return;
  }

  if (result.error) {
    throw result.error;
  }

  throw new Error(
    `Graph registry runtime generation failed with exit status ${result.status ?? "null"}${
      result.signal ? ` (signal ${result.signal})` : ""
    }.`,
  );
}

/**
 * Ensure the live graph-registry runtime module exists and is fingerprint-fresh.
 *
 * Intended for build-path consumers (for example `run-next`) that follow
 * `prepare:content-runtime`. Cache hits skip generation and parse entirely so
 * the prepare/build path regenerates the live graph registry at most once.
 */
export function ensureGraphRegistryRuntimeOnce(
  options: EnsureGraphRegistryRuntimeOptions,
): EnsureGraphRegistryRuntimeResult {
  const useProcessMemo = options.useProcessMemo !== false;
  const evaluateStepCache =
    options.evaluateStepCache ?? evaluateContentRuntimeStepCache;
  const recordStepFingerprint =
    options.recordStepFingerprint ?? writeContentRuntimeStepFingerprint;
  const runGenerator = options.runGenerator ?? defaultRunGenerator;
  const log = options.log ?? console.log;
  const forceClean = options.forceClean === true;

  const cacheDecision = evaluateStepCache({
    cwd: options.cwd,
    stepId: GRAPH_REGISTRY_RUNTIME_STEP_ID,
    outputPath: GRAPH_REGISTRY_RUNTIME_OUTPUT_PATH,
    forceClean,
    dependencies: options.dependencies,
  });

  if (useProcessMemo) {
    const memo = processMemoByCwd.get(options.cwd);
    if (memo && memo.fingerprint === cacheDecision.fingerprint) {
      // A prior cache-hit skip must not block an explicit force regeneration,
      // but once this process has generated for the fingerprint, stay at most once.
      if (!forceClean || memo.result.action === "generated") {
        return {
          action: "skipped",
          reason: "process-memo",
          fingerprint: memo.fingerprint,
          generationCount: generationInvocationCount,
        };
      }
    }
  }

  if (cacheDecision.action === "skip") {
    const result: EnsureGraphRegistryRuntimeResult = {
      action: "skipped",
      reason: cacheDecision.reason,
      fingerprint: cacheDecision.fingerprint,
      generationCount: generationInvocationCount,
    };
    if (useProcessMemo) {
      processMemoByCwd.set(options.cwd, {
        fingerprint: cacheDecision.fingerprint,
        result,
      });
    }
    log(
      `[graph-registry-runtime] Cache hit; reusing ${GRAPH_REGISTRY_RUNTIME_OUTPUT_PATH} without regenerating.`,
    );
    return result;
  }

  log(
    `[graph-registry-runtime] Generating ${GRAPH_REGISTRY_RUNTIME_OUTPUT_PATH} (${cacheDecision.reason}).`,
  );
  runGenerator(options.cwd);
  generationInvocationCount += 1;

  if (cacheDecision.fingerprint) {
    recordStepFingerprint(
      options.cwd,
      GRAPH_REGISTRY_RUNTIME_STEP_ID,
      cacheDecision.fingerprint,
      options.dependencies,
    );
  }

  const result: EnsureGraphRegistryRuntimeResult = {
    action: "generated",
    reason: cacheDecision.reason,
    fingerprint: cacheDecision.fingerprint,
    generationCount: generationInvocationCount,
  };

  if (useProcessMemo) {
    processMemoByCwd.set(options.cwd, {
      fingerprint: cacheDecision.fingerprint,
      result,
    });
  }

  return result;
}

/** Test helper: reset process-local ensure memo and generation counter. */
export function resetGraphRegistryRuntimeEnsureStateForTests(): void {
  processMemoByCwd.clear();
  generationInvocationCount = 0;
}

/** Test helper: how many times the default/injected generator has run. */
export function getGraphRegistryRuntimeGenerationCountForTests(): number {
  return generationInvocationCount;
}
