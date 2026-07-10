import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ensureGraphRegistryRuntimeOnce,
  GRAPH_REGISTRY_RUNTIME_OUTPUT_PATH,
  GRAPH_REGISTRY_RUNTIME_STEP_ID,
  getGraphRegistryRuntimeGenerationCountForTests,
  resetGraphRegistryRuntimeEnsureStateForTests,
} from "./ensure-graph-registry-runtime";

const cleanupPaths: string[] = [];

afterEach(() => {
  resetGraphRegistryRuntimeEnsureStateForTests();
  for (const path of cleanupPaths.splice(0)) {
    rmSync(path, { force: true, recursive: true });
  }
});

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "ensure-graph-registry-"));
  cleanupPaths.push(dir);
  return dir;
}

describe("ensureGraphRegistryRuntimeOnce", () => {
  test("skips generation on fingerprint cache hit and usable output", () => {
    const cwd = createTempDir();
    let generatorCalls = 0;

    const first = ensureGraphRegistryRuntimeOnce({
      cwd,
      evaluateStepCache: () => ({
        action: "skip",
        reason: "cache-hit",
        fingerprint: "fp-hit",
      }),
      runGenerator: () => {
        generatorCalls += 1;
      },
      log: () => {},
    });

    expect(first).toEqual({
      action: "skipped",
      reason: "cache-hit",
      fingerprint: "fp-hit",
      generationCount: 0,
    });
    expect(generatorCalls).toBe(0);
    expect(getGraphRegistryRuntimeGenerationCountForTests()).toBe(0);
  });

  test("generates once on missing output then process-memo skips a second ensure", () => {
    const cwd = createTempDir();
    let generatorCalls = 0;
    const fingerprints: string[] = [];

    const first = ensureGraphRegistryRuntimeOnce({
      cwd,
      evaluateStepCache: () => ({
        action: "run",
        reason: "missing-output",
        fingerprint: "fp-miss",
      }),
      recordStepFingerprint: (_cwd, stepId, fingerprint) => {
        expect(stepId).toBe(GRAPH_REGISTRY_RUNTIME_STEP_ID);
        fingerprints.push(fingerprint);
      },
      runGenerator: () => {
        generatorCalls += 1;
      },
      log: () => {},
    });

    const second = ensureGraphRegistryRuntimeOnce({
      cwd,
      evaluateStepCache: () => ({
        action: "run",
        reason: "missing-output",
        fingerprint: "fp-miss",
      }),
      runGenerator: () => {
        generatorCalls += 1;
      },
      log: () => {},
    });

    expect(first.action).toBe("generated");
    expect(first.reason).toBe("missing-output");
    expect(second).toEqual({
      action: "skipped",
      reason: "process-memo",
      fingerprint: "fp-miss",
      generationCount: 1,
    });
    expect(generatorCalls).toBe(1);
    expect(fingerprints).toEqual(["fp-miss"]);
    expect(getGraphRegistryRuntimeGenerationCountForTests()).toBe(1);
  });

  test("force-clean regenerates after a prior cache-hit skip, then stays at most once", () => {
    const cwd = createTempDir();
    let generatorCalls = 0;

    ensureGraphRegistryRuntimeOnce({
      cwd,
      evaluateStepCache: () => ({
        action: "skip",
        reason: "cache-hit",
        fingerprint: "fp-same",
      }),
      runGenerator: () => {
        generatorCalls += 1;
      },
      log: () => {},
    });

    const forced = ensureGraphRegistryRuntimeOnce({
      cwd,
      forceClean: true,
      evaluateStepCache: () => ({
        action: "run",
        reason: "force-clean",
        fingerprint: "fp-same",
      }),
      recordStepFingerprint: () => {},
      runGenerator: () => {
        generatorCalls += 1;
      },
      log: () => {},
    });

    const forcedAgain = ensureGraphRegistryRuntimeOnce({
      cwd,
      forceClean: true,
      evaluateStepCache: () => ({
        action: "run",
        reason: "force-clean",
        fingerprint: "fp-same",
      }),
      runGenerator: () => {
        generatorCalls += 1;
      },
      log: () => {},
    });

    expect(forced.action).toBe("generated");
    expect(forced.reason).toBe("force-clean");
    expect(forcedAgain.reason).toBe("process-memo");
    expect(generatorCalls).toBe(1);
  });

  test("exposes the contracted graph-registry output path from preparation steps", () => {
    expect(GRAPH_REGISTRY_RUNTIME_OUTPUT_PATH).toBe(
      "src/lib/content/generated/graph-registry-runtime.generated.ts",
    );
  });
});
