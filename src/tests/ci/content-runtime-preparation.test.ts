import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative } from "node:path";
import {
  getGeneratedContentRuntimeRoot,
  getGeneratedDocsSourceRoot,
} from "@/lib/content/content-paths";
import {
  CONTENT_RUNTIME_FINGERPRINTS_RELATIVE_PATH,
  CONTENT_RUNTIME_STEP_FINGERPRINT_INPUTS,
  clearContentRuntimeFingerprints,
  computeContentRuntimeStepFingerprint,
  evaluateContentRuntimeStepCache,
  getContentRuntimeStepFingerprintInputs,
  writeContentRuntimeStepFingerprint,
} from "@/lib/content/content-runtime-fingerprints";
import {
  CONTENT_RUNTIME_COMPLETENESS_CONTRACT,
  CONTENT_RUNTIME_PREPARATION_STEPS,
  type ContentRuntimeGitCommandResult,
  type ContentRuntimePreparationCommandResult,
  type ContentRuntimePreparationStep,
  planContentRuntimePreparationWaves,
  resolveContentRuntimeForceClean,
  runContentRuntimeCompletenessGate,
  runContentRuntimePreparation,
} from "@/lib/content/content-runtime-preparation";
import {
  ensureGraphRegistryRuntimeOnce,
  resetGraphRegistryRuntimeEnsureStateForTests,
} from "@/lib/content/ensure-graph-registry-runtime";

const repoRoot = join(import.meta.dir, "../../..");
const CONTENT_RUNTIME_PREPARATION_TIMEOUT_MS = 30_000;
const GENERATED_REGISTRY_RUNTIME_RELATIVE_PATH =
  "src/lib/content/generated/registry-runtime.generated.ts";
const LEGACY_TOP_LEVEL_GENERATED_RUNTIME_PATHS = [
  "src/lib/content/published-docs-registry-manifest.ts",
] as const;
const GENERATED_PUBLISHED_DOCS_REGISTRY_RELATIVE_PATH =
  "src/lib/content/generated/published-docs-registry.generated.ts";
/** Stable published page used by recovery/import proofs (rewrite-era content). */
const STABLE_PUBLISHED_DOCS_REGISTRY_ID = "guide.getting-started";
const STABLE_PUBLISHED_DOCS_SLUG = "guides/getting-started";
const RUNTIME_DISCOVERY_TEST_DOCS_SLUG = "glossary/runtime-recovery-smoke-test";
const RUNTIME_DISCOVERY_TEST_PAGE_RELATIVE_PATH = join(
  "src/content/docs",
  RUNTIME_DISCOVERY_TEST_DOCS_SLUG,
);
const RUNTIME_DISCOVERY_TEST_REGISTRY_ID =
  "concept.runtime-recovery-smoke-test";
const INVALID_REGISTRY_FIXTURE_RELATIVE_PATH =
  "src/content/registry/guides/__invalid-runtime-preparation-test.json";

function runPrepareContentRuntime(options?: { forceClean?: boolean }) {
  const args = ["run", "prepare:content-runtime"];
  if (options?.forceClean) {
    args.push("--", "--force-clean");
  }
  return spawnSync("bun", args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
  });
}

function clearContentRuntimeFingerprintStore() {
  rmSync(join(repoRoot, CONTENT_RUNTIME_FINGERPRINTS_RELATIVE_PATH), {
    force: true,
  });
}

function writePublishedDocsPage(
  pageRelativePath: string,
  frontmatter: {
    kind: string;
    registryId: string;
    status: string;
  },
) {
  const pagePath = join(repoRoot, pageRelativePath);
  mkdirSync(join(pagePath, "messages"), { recursive: true });
  writeFileSync(
    join(pagePath, "page.mdx"),
    `---
kind: "${frontmatter.kind}"
registryId: "${frontmatter.registryId}"
messageNamespace: "local"
assetNamespace: "local"
tags:
  - test
status: ${frontmatter.status}
updatedAt: "2026-06-20"
---
`,
    "utf8",
  );
  writeFileSync(
    join(pagePath, "messages", "en.json"),
    JSON.stringify(
      {
        title: frontmatter.registryId,
        description: `${frontmatter.registryId} description`,
      },
      null,
      2,
    ),
    "utf8",
  );
}

describe("content runtime preparation", () => {
  test("publishes one authoritative completeness contract for all generated runtime outputs", () => {
    expect(CONTENT_RUNTIME_COMPLETENESS_CONTRACT).toHaveLength(5);
    expect(CONTENT_RUNTIME_PREPARATION_STEPS).toBe(
      CONTENT_RUNTIME_COMPLETENESS_CONTRACT,
    );
    expect(CONTENT_RUNTIME_COMPLETENESS_CONTRACT).toEqual([
      {
        id: "shipped-localized-docs",
        command: ["bun", "run", "generate:shipped-localized-docs"],
        outputPath:
          "src/lib/content/generated/shipped-localized-docs.generated.ts",
        gitClassification: "committed",
        owningSurface: "shipped localized docs runtime helpers",
      },
      {
        id: "graph-registry-runtime",
        command: ["bun", "run", "generate:graph-registry-runtime"],
        outputPath:
          "src/lib/content/generated/graph-registry-runtime.generated.ts",
        gitClassification: "ignored",
        owningSurface: "graph registry runtime lookups",
      },
      {
        id: "published-docs-registry",
        command: ["bun", "run", "generate:published-docs-registry"],
        outputPath:
          "src/lib/content/generated/published-docs-registry.generated.ts",
        gitClassification: "ignored",
        owningSurface: "published docs registry manifest",
      },
      {
        id: "registry-runtime",
        command: ["bun", "run", "generate:registry-runtime"],
        outputPath: "src/lib/content/generated/registry-runtime.generated.ts",
        gitClassification: "ignored",
        owningSurface: "main content registry runtime",
      },
      {
        id: "table-registry-runtime",
        command: ["bun", "run", "generate:table-registry"],
        outputPath: "src/lib/content/generated/table-registry.generated.ts",
        gitClassification: "committed",
        owningSurface: "table registry runtime payloads",
      },
    ]);
  });

  test("default preparation preserves .source and ignored outputs; force-clean wipes them first", async () => {
    const defaultLifecycle: string[] = [];
    const defaultResult = await runContentRuntimePreparation({
      cwd: repoRoot,
      useFingerprints: false,
      concurrency: false,
      log: () => {},
      logError: () => {},
      removeDirectory(path) {
        defaultLifecycle.push(`remove ${relative(repoRoot, path)}`);
      },
      removeFile(path) {
        defaultLifecycle.push(`invalidate ${relative(repoRoot, path)}`);
      },
      runCommand(command) {
        defaultLifecycle.push(`run ${command.join(" ")}`);
        return {
          signal: null,
          status: 0,
        } satisfies ContentRuntimePreparationCommandResult;
      },
    });

    expect(defaultResult).toEqual({
      ok: true,
      completedSteps: [...CONTENT_RUNTIME_PREPARATION_STEPS],
      skippedSteps: [],
    });
    expect(defaultLifecycle).toEqual(
      CONTENT_RUNTIME_PREPARATION_STEPS.map(
        (step) => `run ${step.command.join(" ")}`,
      ),
    );

    const forceCleanLifecycle: string[] = [];
    const forceCleanResult = await runContentRuntimePreparation({
      cwd: repoRoot,
      forceClean: true,
      useFingerprints: false,
      concurrency: false,
      log: () => {},
      logError: () => {},
      removeDirectory(path) {
        forceCleanLifecycle.push(`remove ${relative(repoRoot, path)}`);
      },
      removeFile(path) {
        forceCleanLifecycle.push(`invalidate ${relative(repoRoot, path)}`);
      },
      runCommand(command) {
        forceCleanLifecycle.push(`run ${command.join(" ")}`);
        return {
          signal: null,
          status: 0,
        } satisfies ContentRuntimePreparationCommandResult;
      },
    });

    expect(forceCleanResult).toEqual({
      ok: true,
      completedSteps: [...CONTENT_RUNTIME_PREPARATION_STEPS],
      skippedSteps: [],
    });
    expect(forceCleanLifecycle[0]).toBe("remove .source");
    expect(forceCleanLifecycle.slice(1)).toEqual([
      ...CONTENT_RUNTIME_PREPARATION_STEPS.filter(
        (step) => step.gitClassification === "ignored",
      ).map((step) => `invalidate ${step.outputPath}`),
      ...CONTENT_RUNTIME_PREPARATION_STEPS.map(
        (step) => `run ${step.command.join(" ")}`,
      ),
    ]);
    expect(CONTENT_RUNTIME_PREPARATION_STEPS).toContainEqual({
      id: "graph-registry-runtime",
      command: ["bun", "run", "generate:graph-registry-runtime"],
      outputPath:
        "src/lib/content/generated/graph-registry-runtime.generated.ts",
      gitClassification: "ignored",
      owningSurface: "graph registry runtime lookups",
    });
  });

  test("resolveContentRuntimeForceClean reads CLI and env flags", () => {
    expect(resolveContentRuntimeForceClean({}, [])).toBe(false);
    expect(resolveContentRuntimeForceClean({}, ["--force-clean"])).toBe(true);
    expect(resolveContentRuntimeForceClean({}, ["--force-clean=true"])).toBe(
      true,
    );
    expect(resolveContentRuntimeForceClean({}, ["--force-clean=0"])).toBe(
      false,
    );
    expect(
      resolveContentRuntimeForceClean({ CONTENT_RUNTIME_FORCE_CLEAN: "1" }, []),
    ).toBe(true);
    expect(
      resolveContentRuntimeForceClean(
        { CONTENT_RUNTIME_FORCE_CLEAN: "yes" },
        [],
      ),
    ).toBe(true);
    expect(
      resolveContentRuntimeForceClean({ CONTENT_RUNTIME_FORCE_CLEAN: "1" }, [
        "--force-clean=false",
      ]),
    ).toBe(false);
  });

  test("runs required runtime generation steps in canonical order", async () => {
    const commands: string[] = [];
    const result = await runContentRuntimePreparation({
      cwd: repoRoot,
      useFingerprints: false,
      concurrency: false,
      log: () => {},
      logError: () => {},
      runCommand(command) {
        commands.push(command.join(" "));
        return {
          signal: null,
          status: 0,
        } satisfies ContentRuntimePreparationCommandResult;
      },
    });

    expect(result).toEqual({
      ok: true,
      completedSteps: [...CONTENT_RUNTIME_PREPARATION_STEPS],
      skippedSteps: [],
    });
    expect(commands).toEqual(
      CONTENT_RUNTIME_PREPARATION_STEPS.map((step) => step.command.join(" ")),
    );
  });

  test("stops at the first failing step and reports the step id", async () => {
    const errors: string[] = [];
    const result = await runContentRuntimePreparation({
      cwd: repoRoot,
      useFingerprints: false,
      concurrency: false,
      log: () => {},
      logError(message) {
        errors.push(message);
      },
      runCommand(command) {
        const step = command[2];
        return {
          signal: null,
          status: step === "generate:graph-registry-runtime" ? 23 : 0,
        } satisfies ContentRuntimePreparationCommandResult;
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.completedSteps.map((step) => step.id)).toEqual([
      "shipped-localized-docs",
    ]);
    expect(result.skippedSteps).toEqual([]);
    expect(result.failedStep.id).toBe("graph-registry-runtime");
    expect(result.commandResult.status).toBe(23);
    expect(errors).toEqual([
      expect.stringContaining('Failed step "graph-registry-runtime"'),
    ]);
  });

  test("plans one concurrent wave for contracted steps with disjoint outputs", () => {
    const waves = planContentRuntimePreparationWaves(
      CONTENT_RUNTIME_PREPARATION_STEPS,
    );
    expect(waves).toHaveLength(1);
    expect(waves[0]?.map((step) => step.id)).toEqual(
      CONTENT_RUNTIME_PREPARATION_STEPS.map((step) => step.id),
    );

    const serialWaves = planContentRuntimePreparationWaves(
      CONTENT_RUNTIME_PREPARATION_STEPS,
      { concurrency: false },
    );
    expect(serialWaves).toEqual(
      CONTENT_RUNTIME_PREPARATION_STEPS.map((step) => [step]),
    );
  });

  test("sequences steps that share an output path or declare dependsOn", () => {
    const sharedOutputSteps: ContentRuntimePreparationStep[] = [
      {
        id: "first",
        command: ["bun", "run", "generate:first"],
        outputPath: "src/lib/content/generated/shared.generated.ts",
        gitClassification: "ignored",
        owningSurface: "shared output A",
      },
      {
        id: "second",
        command: ["bun", "run", "generate:second"],
        outputPath: "src/lib/content/generated/shared.generated.ts",
        gitClassification: "ignored",
        owningSurface: "shared output B",
      },
      {
        id: "third",
        command: ["bun", "run", "generate:third"],
        outputPath: "src/lib/content/generated/third.generated.ts",
        gitClassification: "ignored",
        owningSurface: "independent",
      },
    ];

    expect(
      planContentRuntimePreparationWaves(sharedOutputSteps).map((wave) =>
        wave.map((step) => step.id),
      ),
    ).toEqual([["first", "third"], ["second"]]);

    const dependentSteps: ContentRuntimePreparationStep[] = [
      {
        id: "producer",
        command: ["bun", "run", "generate:producer"],
        outputPath: "src/lib/content/generated/producer.generated.ts",
        gitClassification: "ignored",
        owningSurface: "producer",
      },
      {
        id: "consumer",
        command: ["bun", "run", "generate:consumer"],
        outputPath: "src/lib/content/generated/consumer.generated.ts",
        gitClassification: "ignored",
        owningSurface: "consumer",
        dependsOn: ["producer"],
      },
      {
        id: "peer",
        command: ["bun", "run", "generate:peer"],
        outputPath: "src/lib/content/generated/peer.generated.ts",
        gitClassification: "ignored",
        owningSurface: "peer",
      },
    ];

    expect(
      planContentRuntimePreparationWaves(dependentSteps).map((wave) =>
        wave.map((step) => step.id),
      ),
    ).toEqual([["producer", "peer"], ["consumer"]]);
  });

  test("runs disjoint generators concurrently when multiple steps must regenerate", async () => {
    let running = 0;
    let maxRunning = 0;
    const result = await runContentRuntimePreparation({
      cwd: repoRoot,
      useFingerprints: false,
      log: () => {},
      logError: () => {},
      async runCommand() {
        running += 1;
        maxRunning = Math.max(maxRunning, running);
        await Bun.sleep(40);
        running -= 1;
        return {
          signal: null,
          status: 0,
        } satisfies ContentRuntimePreparationCommandResult;
      },
    });

    expect(result).toEqual({
      ok: true,
      completedSteps: [...CONTENT_RUNTIME_PREPARATION_STEPS],
      skippedSteps: [],
    });
    expect(maxRunning).toBe(CONTENT_RUNTIME_PREPARATION_STEPS.length);
  });

  test("concurrent failure reports the earliest contract-order failed step", async () => {
    const errors: string[] = [];
    const result = await runContentRuntimePreparation({
      cwd: repoRoot,
      useFingerprints: false,
      log: () => {},
      logError(message) {
        errors.push(message);
      },
      async runCommand(command) {
        await Bun.sleep(
          command[2] === "generate:graph-registry-runtime" ? 5 : 20,
        );
        return {
          signal: null,
          status: command[2] === "generate:graph-registry-runtime" ? 23 : 0,
        } satisfies ContentRuntimePreparationCommandResult;
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.failedStep.id).toBe("graph-registry-runtime");
    expect(result.commandResult.status).toBe(23);
    expect(result.completedSteps.map((step) => step.id)).toEqual([
      "shipped-localized-docs",
      "published-docs-registry",
      "registry-runtime",
      "table-registry-runtime",
    ]);
    expect(errors).toEqual([
      expect.stringContaining('Failed step "graph-registry-runtime"'),
    ]);
  });

  test("concurrent and serial preparation write identical output bytes", async () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "content-runtime-concurrent-"));
    const steps: ContentRuntimePreparationStep[] =
      CONTENT_RUNTIME_PREPARATION_STEPS.map((step) => ({
        ...step,
        outputPath: join("generated", `${step.id}.ts`),
      }));

    const runMode = async (concurrency: boolean) => {
      const modeRoot = join(tempRoot, concurrency ? "concurrent" : "serial");
      mkdirSync(join(modeRoot, "generated"), { recursive: true });
      const result = await runContentRuntimePreparation({
        cwd: modeRoot,
        steps,
        useFingerprints: false,
        concurrency,
        log: () => {},
        logError: () => {},
        async runCommand(command) {
          const step = steps.find(
            (candidate) => candidate.command.join(" ") === command.join(" "),
          );
          expect(step).toBeDefined();
          if (!step) {
            return { signal: null, status: 1 };
          }
          await Bun.sleep(concurrency ? 15 : 0);
          writeFileSync(
            join(modeRoot, step.outputPath),
            `export const id = ${JSON.stringify(step.id)};\n`,
            "utf8",
          );
          return { signal: null, status: 0 };
        },
      });
      expect(result.ok).toBe(true);
      return Object.fromEntries(
        steps.map((step) => [
          step.id,
          readFileSync(join(modeRoot, step.outputPath), "utf8"),
        ]),
      );
    };

    try {
      const [serialOutputs, concurrentOutputs] = await Promise.all([
        runMode(false),
        runMode(true),
      ]);
      expect(concurrentOutputs).toEqual(serialOutputs);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test("declares fingerprint inputs for every contracted preparation step", () => {
    expect(
      CONTENT_RUNTIME_STEP_FINGERPRINT_INPUTS.map((entry) => entry.stepId),
    ).toEqual(CONTENT_RUNTIME_PREPARATION_STEPS.map((step) => step.id));
    for (const step of CONTENT_RUNTIME_PREPARATION_STEPS) {
      const inputs = getContentRuntimeStepFingerprintInputs(step.id);
      expect(inputs).toBeDefined();
      expect(inputs?.inputPaths.length).toBeGreaterThan(0);
      expect(inputs?.generatorPaths.length).toBeGreaterThan(0);
      expect(inputs?.schemaPaths.length).toBeGreaterThan(0);
    }
  });

  test("fingerprint cache hits skip generation; input changes and force-clean regenerate", async () => {
    const step = CONTENT_RUNTIME_PREPARATION_STEPS[0];
    const inputs = getContentRuntimeStepFingerprintInputs(step.id);
    expect(inputs).toBeDefined();
    if (!inputs) {
      return;
    }

    const files = new Map<string, string>([
      [
        join(repoRoot, "src/content/docs/page.mdx"),
        "---\nstatus: published\n---\n",
      ],
      [
        join(repoRoot, "scripts/generate-shipped-localized-docs.ts"),
        "generator-v1",
      ],
      [
        join(repoRoot, "src/lib/content/shipped-localized-docs.server.ts"),
        "server-v1",
      ],
      [join(repoRoot, "src/lib/content/shipped-localized-docs.ts"), "types-v1"],
      [join(repoRoot, "src/lib/i18n/locale-routing.ts"), "locale-v1"],
      [join(repoRoot, "src/lib/content/schemas.ts"), "schema-v1"],
      [join(repoRoot, "src/lib/content/yaml-frontmatter.ts"), "yaml-v1"],
      [join(repoRoot, step.outputPath), "generated-output"],
    ]);
    const directories = new Set<string>([
      join(repoRoot, "src/content/docs"),
      join(repoRoot, "src/lib/content/generated"),
    ]);

    const dependencies = {
      fileExists(path: string) {
        return files.has(path) || directories.has(path);
      },
      isDirectory(path: string) {
        return directories.has(path);
      },
      listDirectoryNames(path: string) {
        if (path === join(repoRoot, "src/content/docs")) {
          return ["page.mdx"];
        }
        return [];
      },
      readFile(path: string) {
        const contents = files.get(path);
        if (contents === undefined) {
          throw new Error(`missing file ${path}`);
        }
        return contents;
      },
      writeFile(path: string, contents: string) {
        files.set(path, contents);
      },
      fileSize(path: string) {
        return files.get(path)?.length ?? 0;
      },
    };

    const fingerprint = computeContentRuntimeStepFingerprint(
      repoRoot,
      inputs,
      dependencies,
    );
    writeContentRuntimeStepFingerprint(
      repoRoot,
      step.id,
      fingerprint,
      dependencies,
    );

    const hit = evaluateContentRuntimeStepCache({
      cwd: repoRoot,
      stepId: step.id,
      outputPath: step.outputPath,
      fingerprintInputs: inputs,
      dependencies,
    });
    expect(hit).toEqual({
      action: "skip",
      reason: "cache-hit",
      fingerprint,
    });

    const lifecycle: string[] = [];
    const cacheHitResult = await runContentRuntimePreparation({
      cwd: repoRoot,
      steps: [step],
      log: () => {},
      logError: () => {},
      fingerprintDependencies: dependencies,
      runCommand(command) {
        lifecycle.push(`run ${command.join(" ")}`);
        return { signal: null, status: 0 };
      },
    });
    expect(cacheHitResult).toEqual({
      ok: true,
      completedSteps: [step],
      skippedSteps: [step],
    });
    expect(lifecycle).toEqual([]);

    files.set(
      join(repoRoot, "scripts/generate-shipped-localized-docs.ts"),
      "generator-v2",
    );
    const missLifecycle: string[] = [];
    const missResult = await runContentRuntimePreparation({
      cwd: repoRoot,
      steps: [step],
      log: () => {},
      logError: () => {},
      fingerprintDependencies: dependencies,
      runCommand(command) {
        missLifecycle.push(`run ${command.join(" ")}`);
        return { signal: null, status: 0 };
      },
    });
    expect(missResult.ok).toBe(true);
    expect(missResult.skippedSteps).toEqual([]);
    expect(missLifecycle).toEqual([`run ${step.command.join(" ")}`]);

    const forceCleanLifecycle: string[] = [];
    const forceCleanResult = await runContentRuntimePreparation({
      cwd: repoRoot,
      steps: [step],
      forceClean: true,
      log: () => {},
      logError: () => {},
      fingerprintDependencies: dependencies,
      removeDirectory() {},
      removeFile() {},
      clearFingerprints(cwd, deps) {
        clearContentRuntimeFingerprints(cwd, deps);
        forceCleanLifecycle.push("clear-fingerprints");
      },
      runCommand(command) {
        forceCleanLifecycle.push(`run ${command.join(" ")}`);
        return { signal: null, status: 0 };
      },
    });
    expect(forceCleanResult.ok).toBe(true);
    expect(forceCleanResult.skippedSteps).toEqual([]);
    expect(forceCleanLifecycle).toEqual([
      "clear-fingerprints",
      `run ${step.command.join(" ")}`,
    ]);
  });

  test("missing output regenerates even when a stored fingerprint matches", () => {
    const step = CONTENT_RUNTIME_PREPARATION_STEPS.find(
      (candidate) => candidate.id === "graph-registry-runtime",
    );
    expect(step).toBeDefined();
    if (!step) {
      return;
    }
    const inputs = getContentRuntimeStepFingerprintInputs(step.id);
    expect(inputs).toBeDefined();
    if (!inputs) {
      return;
    }

    const files = new Map<string, string>();
    const directories = new Set<string>([
      join(repoRoot, "src/content/registry/graphs"),
      join(repoRoot, "src/lib/content/generated"),
    ]);
    for (const relativePath of [
      ...inputs.inputPaths,
      ...inputs.generatorPaths,
      ...inputs.schemaPaths,
    ]) {
      if (relativePath.endsWith(".ts") || relativePath.endsWith(".tsx")) {
        files.set(join(repoRoot, relativePath), `contents:${relativePath}`);
      }
    }

    const dependencies = {
      fileExists(path: string) {
        return files.has(path) || directories.has(path);
      },
      isDirectory(path: string) {
        return directories.has(path);
      },
      listDirectoryNames() {
        return [];
      },
      readFile(path: string) {
        const contents = files.get(path);
        if (contents === undefined) {
          throw new Error(`missing file ${path}`);
        }
        return contents;
      },
      writeFile(path: string, contents: string) {
        files.set(path, contents);
      },
      fileSize(path: string) {
        return files.get(path)?.length ?? 0;
      },
    };

    const fingerprint = computeContentRuntimeStepFingerprint(
      repoRoot,
      inputs,
      dependencies,
    );
    writeContentRuntimeStepFingerprint(
      repoRoot,
      step.id,
      fingerprint,
      dependencies,
    );

    const decision = evaluateContentRuntimeStepCache({
      cwd: repoRoot,
      stepId: step.id,
      outputPath: step.outputPath,
      fingerprintInputs: inputs,
      dependencies,
    });
    expect(decision).toEqual({
      action: "run",
      reason: "missing-output",
      fingerprint,
    });
    expect(
      files.has(join(repoRoot, CONTENT_RUNTIME_FINGERPRINTS_RELATIVE_PATH)),
    ).toBe(true);
  });

  test("completeness gate fails with targeted guidance when a required ignored runtime output is still missing after preparation", async () => {
    const result = await runContentRuntimeCompletenessGate({
      cwd: repoRoot,
      log: () => {},
      logError: () => {},
      runPreparation() {
        return {
          ok: true,
          completedSteps: [...CONTENT_RUNTIME_PREPARATION_STEPS],
          skippedSteps: [],
        };
      },
      fileExists(path) {
        return !path.endsWith("graph-registry-runtime.generated.ts");
      },
      runGitCommand(command) {
        if (command[1] === "ls-files") {
          return {
            signal: null,
            status: 0,
            stdout: command[command.length - 1],
            stderr: "",
          } satisfies ContentRuntimeGitCommandResult;
        }

        return {
          signal: null,
          status: 1,
          stdout: "",
          stderr: "",
        } satisfies ContentRuntimeGitCommandResult;
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.stage).toBe("verification");
    expect(result.step?.id).toBe("graph-registry-runtime");
    expect(result.message).toContain(
      "src/lib/content/generated/graph-registry-runtime.generated.ts",
    );
    expect(result.message).toContain("graph registry runtime lookups");
    expect(result.repairGuidance).toContain(
      "bun run generate:graph-registry-runtime",
    );
    expect(result.repairGuidance).toContain("leave it out of the commit");
  });

  test("completeness gate fails when a required committed runtime output is classified as ignored", async () => {
    const result = await runContentRuntimeCompletenessGate({
      cwd: repoRoot,
      log: () => {},
      logError: () => {},
      runPreparation() {
        return {
          ok: true,
          completedSteps: [...CONTENT_RUNTIME_PREPARATION_STEPS],
          skippedSteps: [],
        };
      },
      fileExists() {
        return true;
      },
      runGitCommand(command) {
        const targetPath = command[command.length - 1];
        if (
          targetPath ===
          "src/lib/content/generated/shipped-localized-docs.generated.ts"
        ) {
          if (command[1] === "ls-files") {
            return {
              signal: null,
              status: 1,
              stdout: "",
              stderr: "",
            } satisfies ContentRuntimeGitCommandResult;
          }

          return {
            signal: null,
            status: 0,
            stdout: targetPath,
            stderr: "",
          } satisfies ContentRuntimeGitCommandResult;
        }

        if (command[1] === "ls-files") {
          return {
            signal: null,
            status: 0,
            stdout: targetPath,
            stderr: "",
          } satisfies ContentRuntimeGitCommandResult;
        }

        return {
          signal: null,
          status: 1,
          stdout: "",
          stderr: "",
        } satisfies ContentRuntimeGitCommandResult;
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.stage).toBe("verification");
    expect(result.step?.id).toBe("shipped-localized-docs");
    expect(result.message).toContain('git classification "ignored"');
    expect(result.message).toContain('requires "committed"');
    expect(result.message).toContain("shipped localized docs runtime helpers");
    expect(result.repairGuidance).toContain(
      "commit the regenerated file because this runtime module is authoritative repo state",
    );
  });

  test(
    "prepare:content-runtime recreates the generated registry runtime when absent",
    () => {
      const generatedRuntimeRoot = getGeneratedContentRuntimeRoot(repoRoot);
      const generatedRuntimeRootRelative = relative(
        repoRoot,
        generatedRuntimeRoot,
      );
      const generatedRegistryRuntimePath = join(
        repoRoot,
        GENERATED_REGISTRY_RUNTIME_RELATIVE_PATH,
      );

      rmSync(generatedRegistryRuntimePath, { force: true });
      expect(existsSync(generatedRegistryRuntimePath)).toBe(false);

      const firstRun = runPrepareContentRuntime();
      const secondRun = runPrepareContentRuntime();
      const firstRunOutput = `${firstRun.stdout}\n${firstRun.stderr}`;

      expect(firstRun.status).toBe(0);
      expect(secondRun.status).toBe(0);
      expect(firstRunOutput).toContain(
        `[content-runtime] Preparing registry-runtime -> ${GENERATED_REGISTRY_RUNTIME_RELATIVE_PATH}`,
      );
      expect(existsSync(generatedRegistryRuntimePath)).toBe(true);

      for (const step of CONTENT_RUNTIME_PREPARATION_STEPS) {
        expect(
          step.outputPath.startsWith(`${generatedRuntimeRootRelative}/`),
        ).toBe(true);
        expect(existsSync(join(repoRoot, step.outputPath))).toBe(true);
        expect(
          existsSync(
            join(repoRoot, "src/lib/content", basename(step.outputPath)),
          ),
        ).toBe(false);
      }

      for (const legacyPath of LEGACY_TOP_LEVEL_GENERATED_RUNTIME_PATHS) {
        expect(existsSync(join(repoRoot, legacyPath))).toBe(false);
      }
    },
    { timeout: CONTENT_RUNTIME_PREPARATION_TIMEOUT_MS },
  );

  test("prepare:content-runtime recreates the ignored published docs manifest before runtime import", () => {
    const manifestPath = join(
      repoRoot,
      GENERATED_PUBLISHED_DOCS_REGISTRY_RELATIVE_PATH,
    );
    const originalManifest = existsSync(manifestPath)
      ? readFileSync(manifestPath, "utf8")
      : null;

    try {
      rmSync(manifestPath, { force: true });
      expect(existsSync(manifestPath)).toBe(false);

      const prepareResult = runPrepareContentRuntime();
      const prepareOutput = `${prepareResult.stdout}\n${prepareResult.stderr}`;

      expect(prepareResult.status).toBe(0);
      expect(prepareOutput).toContain(
        `[content-runtime] Preparing published-docs-registry -> ${GENERATED_PUBLISHED_DOCS_REGISTRY_RELATIVE_PATH}`,
      );
      expect(existsSync(manifestPath)).toBe(true);

      const importResult = spawnSync(
        "bun",
        [
          "--eval",
          [
            'import { getPublishedDocsEntryByRegistryId } from "./src/lib/content/published-docs-registry-ids";',
            `const entry = getPublishedDocsEntryByRegistryId("${STABLE_PUBLISHED_DOCS_REGISTRY_ID}");`,
            `if (!entry) throw new Error("missing ${STABLE_PUBLISHED_DOCS_REGISTRY_ID} published docs entry");`,
            "console.log(entry.docsSlug);",
          ].join(" "),
        ],
        {
          cwd: repoRoot,
          encoding: "utf8",
          env: process.env,
        },
      );

      expect(importResult.status).toBe(0);
      expect(importResult.stdout).toContain(STABLE_PUBLISHED_DOCS_SLUG);
      expect(existsSync(manifestPath)).toBe(true);
    } finally {
      if (originalManifest === null) {
        rmSync(manifestPath, { force: true });
      } else {
        writeFileSync(manifestPath, originalManifest, "utf8");
      }
      clearContentRuntimeFingerprintStore();
    }
  });

  test("fresh-checkout preparation refreshes the published docs manifest so newly authored pages appear without a manual manifest edit", () => {
    const manifestPath = join(
      repoRoot,
      GENERATED_PUBLISHED_DOCS_REGISTRY_RELATIVE_PATH,
    );
    const pagePath = join(repoRoot, RUNTIME_DISCOVERY_TEST_PAGE_RELATIVE_PATH);
    const originalManifest = existsSync(manifestPath)
      ? readFileSync(manifestPath, "utf8")
      : null;

    try {
      clearContentRuntimeFingerprintStore();
      rmSync(manifestPath, { force: true });
      rmSync(pagePath, { force: true, recursive: true });
      writePublishedDocsPage(RUNTIME_DISCOVERY_TEST_PAGE_RELATIVE_PATH, {
        kind: "glossary",
        registryId: RUNTIME_DISCOVERY_TEST_REGISTRY_ID,
        status: "published",
      });

      const prepareResult = runPrepareContentRuntime();
      const prepareOutput = `${prepareResult.stdout}\n${prepareResult.stderr}`;

      expect(prepareResult.status).toBe(0);
      expect(prepareOutput).toContain(
        `[content-runtime] Preparing published-docs-registry -> ${GENERATED_PUBLISHED_DOCS_REGISTRY_RELATIVE_PATH}`,
      );
      expect(existsSync(manifestPath)).toBe(true);

      const importResult = spawnSync(
        "bun",
        [
          "--eval",
          [
            'import { getPublishedDocsEntryByRegistryId, listPublishedDocsEntries } from "./src/lib/content/published-docs-registry-ids";',
            `const registryId = "${RUNTIME_DISCOVERY_TEST_REGISTRY_ID}";`,
            "const entry = getPublishedDocsEntryByRegistryId(registryId);",
            "if (!entry) throw new Error('missing published docs entry for ' + registryId);",
            "const listed = listPublishedDocsEntries().some((candidate) => candidate.registryId === registryId);",
            "if (!listed) throw new Error('listPublishedDocsEntries omitted ' + registryId);",
            "console.log(JSON.stringify({ docsSlug: entry.docsSlug, url: entry.url, listed }));",
          ].join(" "),
        ],
        {
          cwd: repoRoot,
          encoding: "utf8",
          env: process.env,
        },
      );

      expect(importResult.status).toBe(0);
      expect(importResult.stdout).toContain(RUNTIME_DISCOVERY_TEST_DOCS_SLUG);
      expect(importResult.stdout).toContain(
        "/docs/glossary/runtime-recovery-smoke-test",
      );
      expect(importResult.stdout).toContain('"listed":true');
      expect(existsSync(manifestPath)).toBe(true);
    } finally {
      rmSync(pagePath, { force: true, recursive: true });
      if (originalManifest === null) {
        rmSync(manifestPath, { force: true });
      } else {
        writeFileSync(manifestPath, originalManifest, "utf8");
      }
      clearContentRuntimeFingerprintStore();
    }
  });

  test(
    "fresh-checkout preparation removes deleted pages from the ignored published docs manifest",
    () => {
      const manifestPath = join(
        repoRoot,
        GENERATED_PUBLISHED_DOCS_REGISTRY_RELATIVE_PATH,
      );
      const pagePath = join(
        repoRoot,
        RUNTIME_DISCOVERY_TEST_PAGE_RELATIVE_PATH,
      );
      const originalManifest = existsSync(manifestPath)
        ? readFileSync(manifestPath, "utf8")
        : null;

      try {
        clearContentRuntimeFingerprintStore();
        rmSync(pagePath, { force: true, recursive: true });
        writePublishedDocsPage(RUNTIME_DISCOVERY_TEST_PAGE_RELATIVE_PATH, {
          kind: "glossary",
          registryId: RUNTIME_DISCOVERY_TEST_REGISTRY_ID,
          status: "published",
        });

        const firstPrepare = runPrepareContentRuntime();
        expect(firstPrepare.status).toBe(0);
        expect(readFileSync(manifestPath, "utf8")).toContain(
          RUNTIME_DISCOVERY_TEST_DOCS_SLUG,
        );

        rmSync(pagePath, { force: true, recursive: true });

        const secondPrepare = runPrepareContentRuntime();
        const secondPrepareOutput = `${secondPrepare.stdout}\n${secondPrepare.stderr}`;

        expect(secondPrepare.status).toBe(0);
        expect(secondPrepareOutput).toContain(
          `[content-runtime] Preparing published-docs-registry -> ${GENERATED_PUBLISHED_DOCS_REGISTRY_RELATIVE_PATH}`,
        );
        expect(secondPrepareOutput).toContain(
          "[content-runtime] Preserving existing .source and ignored generated runtime outputs",
        );
        expect(secondPrepareOutput).not.toContain(
          "Force-clean: invalidating ignored generated runtime output",
        );
        expect(readFileSync(manifestPath, "utf8")).not.toContain(
          RUNTIME_DISCOVERY_TEST_DOCS_SLUG,
        );

        const importResult = spawnSync(
          "bun",
          [
            "--eval",
            [
              'import { getPublishedDocsEntryByRegistryId } from "./src/lib/content/published-docs-registry-ids";',
              `const entry = getPublishedDocsEntryByRegistryId("${RUNTIME_DISCOVERY_TEST_REGISTRY_ID}");`,
              "console.log(entry === undefined ? 'missing' : entry.docsSlug);",
            ].join(" "),
          ],
          {
            cwd: repoRoot,
            encoding: "utf8",
            env: process.env,
          },
        );

        expect(importResult.status).toBe(0);
        expect(importResult.stdout.trim()).toBe("missing");
      } finally {
        rmSync(pagePath, { force: true, recursive: true });
        if (originalManifest === null) {
          rmSync(manifestPath, { force: true });
        } else {
          writeFileSync(manifestPath, originalManifest, "utf8");
        }
        clearContentRuntimeFingerprintStore();
      }
    },
    { timeout: CONTENT_RUNTIME_PREPARATION_TIMEOUT_MS },
  );

  test(
    "prepare:content-runtime force-clean clears stale Fumadocs bindings so deleted docs pages disappear after regeneration",
    () => {
      const pagePath = join(
        repoRoot,
        RUNTIME_DISCOVERY_TEST_PAGE_RELATIVE_PATH,
      );
      const sourceRoot = getGeneratedDocsSourceRoot(repoRoot);
      const sourceServerPath = join(sourceRoot, "server.ts");

      try {
        rmSync(sourceRoot, { force: true, recursive: true });
        rmSync(pagePath, { force: true, recursive: true });
        writePublishedDocsPage(RUNTIME_DISCOVERY_TEST_PAGE_RELATIVE_PATH, {
          kind: "glossary",
          registryId: RUNTIME_DISCOVERY_TEST_REGISTRY_ID,
          status: "published",
        });

        const firstPrepare = runPrepareContentRuntime();
        expect(firstPrepare.status).toBe(0);

        const firstGenerate = spawnSync("bunx", ["fumadocs-mdx"], {
          cwd: repoRoot,
          encoding: "utf8",
          env: process.env,
        });
        expect(firstGenerate.status).toBe(0);
        expect(existsSync(sourceServerPath)).toBe(true);
        expect(readFileSync(sourceServerPath, "utf8")).toContain(
          RUNTIME_DISCOVERY_TEST_DOCS_SLUG,
        );

        rmSync(pagePath, { force: true, recursive: true });

        const secondPrepare = runPrepareContentRuntime({ forceClean: true });
        const secondPrepareOutput = `${secondPrepare.stdout}\n${secondPrepare.stderr}`;
        expect(secondPrepare.status).toBe(0);
        expect(secondPrepareOutput).toContain(
          "Force-clean: removing generated Fumadocs bindings",
        );
        expect(existsSync(sourceRoot)).toBe(false);

        const secondGenerate = spawnSync("bunx", ["fumadocs-mdx"], {
          cwd: repoRoot,
          encoding: "utf8",
          env: process.env,
        });
        expect(secondGenerate.status).toBe(0);
        expect(existsSync(sourceServerPath)).toBe(true);

        const regeneratedServer = readFileSync(sourceServerPath, "utf8");
        expect(regeneratedServer).not.toContain(
          RUNTIME_DISCOVERY_TEST_DOCS_SLUG,
        );
        expect(regeneratedServer).toContain(STABLE_PUBLISHED_DOCS_SLUG);
      } finally {
        rmSync(pagePath, { force: true, recursive: true });
        rmSync(sourceRoot, { force: true, recursive: true });
        runPrepareContentRuntime();
      }
    },
    { timeout: CONTENT_RUNTIME_PREPARATION_TIMEOUT_MS },
  );

  test(
    "default prepare:content-runtime preserves existing .source bindings",
    () => {
      const sourceRoot = getGeneratedDocsSourceRoot(repoRoot);
      const sourceServerPath = join(sourceRoot, "server.ts");
      const marker = "// content-runtime-preserve-marker\n";

      try {
        mkdirSync(sourceRoot, { recursive: true });
        writeFileSync(sourceServerPath, marker, "utf8");

        const prepareResult = runPrepareContentRuntime();
        const prepareOutput = `${prepareResult.stdout}\n${prepareResult.stderr}`;

        expect(prepareResult.status).toBe(0);
        expect(prepareOutput).toContain(
          "[content-runtime] Preserving existing .source and ignored generated runtime outputs",
        );
        expect(existsSync(sourceServerPath)).toBe(true);
        expect(readFileSync(sourceServerPath, "utf8")).toBe(marker);
      } finally {
        rmSync(sourceRoot, { force: true, recursive: true });
      }
    },
    { timeout: CONTENT_RUNTIME_PREPARATION_TIMEOUT_MS },
  );

  test("published docs registry manifest stays out of the authored git surface", () => {
    const checkIgnored = spawnSync(
      "git",
      [
        "check-ignore",
        "--quiet",
        GENERATED_PUBLISHED_DOCS_REGISTRY_RELATIVE_PATH,
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );
    const checkTracked = spawnSync(
      "git",
      [
        "ls-files",
        "--error-unmatch",
        GENERATED_PUBLISHED_DOCS_REGISTRY_RELATIVE_PATH,
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    expect(checkIgnored.status).toBe(0);
    expect(checkTracked.status).not.toBe(0);
  });

  test(
    "prepare:content-runtime reports the registry runtime step for invalid registry JSON",
    () => {
      const invalidRegistryFixturePath = join(
        repoRoot,
        INVALID_REGISTRY_FIXTURE_RELATIVE_PATH,
      );
      writeFileSync(
        invalidRegistryFixturePath,
        "{ invalid registry json",
        "utf8",
      );

      try {
        const result = runPrepareContentRuntime();
        const output = `${result.stdout}\n${result.stderr}`;

        expect(result.status).not.toBe(0);
        expect(output).toContain('Failed step "registry-runtime"');
        expect(output).toContain("bun run generate:registry-runtime");
        expect(output).toContain(INVALID_REGISTRY_FIXTURE_RELATIVE_PATH);
      } finally {
        rmSync(invalidRegistryFixturePath, { force: true });
        runPrepareContentRuntime();
      }
    },
    { timeout: CONTENT_RUNTIME_PREPARATION_TIMEOUT_MS },
  );

  test("generated registry runtime is ignored as a derived artifact", () => {
    const generatedRuntimePath = relative(
      repoRoot,
      join(
        getGeneratedContentRuntimeRoot(repoRoot),
        "registry-runtime.generated.ts",
      ),
    );
    const checkIgnore = spawnSync(
      "git",
      ["check-ignore", "--quiet", "--no-index", generatedRuntimePath],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: process.env,
      },
    );

    expect(generatedRuntimePath).toBe(GENERATED_REGISTRY_RUNTIME_RELATIVE_PATH);
    expect(checkIgnore.status).toBe(0);
  });

  test(
    "warm prepare:content-runtime skips fingerprint-fresh steps",
    () => {
      clearContentRuntimeFingerprintStore();
      const cold = runPrepareContentRuntime();
      const coldOutput = `${cold.stdout}\n${cold.stderr}`;
      expect(cold.status).toBe(0);
      expect(coldOutput).toContain("[content-runtime] Preparing");
      expect(coldOutput).toContain("0 cache hits");

      const warm = runPrepareContentRuntime();
      const warmOutput = `${warm.stdout}\n${warm.stderr}`;
      expect(warm.status).toBe(0);
      expect(warmOutput).toContain("Cache hit for");
      expect(warmOutput).toContain(
        `${CONTENT_RUNTIME_PREPARATION_STEPS.length} cache hits`,
      );
      for (const step of CONTENT_RUNTIME_PREPARATION_STEPS) {
        expect(warmOutput).toContain(
          `Cache hit for ${step.id} -> ${step.outputPath}; skipping generation.`,
        );
      }

      const forceClean = runPrepareContentRuntime({ forceClean: true });
      const forceCleanOutput = `${forceClean.stdout}\n${forceClean.stderr}`;
      expect(forceClean.status).toBe(0);
      expect(forceCleanOutput).toContain("Force-clean:");
      expect(forceCleanOutput).not.toContain("Cache hit for");
      expect(forceCleanOutput).toContain("0 cache hits");
    },
    { timeout: CONTENT_RUNTIME_PREPARATION_TIMEOUT_MS * 3 },
  );

  test(
    "content-runtime generators use write-if-changed and leave identical bytes untouched",
    () => {
      // Force generators to run (bypass fingerprint skip) and prove identical
      // content does not rewrite contracted runtime outputs.
      clearContentRuntimeFingerprintStore();
      const seed = runPrepareContentRuntime();
      expect(seed.status).toBe(0);

      const outputStatsBefore = CONTENT_RUNTIME_PREPARATION_STEPS.map(
        (step) => {
          const absolutePath = join(repoRoot, step.outputPath);
          const stats = statSync(absolutePath);
          return {
            stepId: step.id,
            absolutePath,
            mtimeMs: stats.mtimeMs,
            ino: stats.ino,
            bytes: readFileSync(absolutePath),
          };
        },
      );

      // Clear fingerprints so the next prepare re-runs every generator.
      clearContentRuntimeFingerprintStore();
      // Brief pause so a naive unconditional write would bump mtime.
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);

      const rerun = runPrepareContentRuntime();
      const rerunOutput = `${rerun.stdout}\n${rerun.stderr}`;
      expect(rerun.status).toBe(0);
      expect(rerunOutput).toContain("0 cache hits");
      expect(rerunOutput).toMatch(/Verified|already current|verified/i);

      for (const before of outputStatsBefore) {
        const after = statSync(before.absolutePath);
        expect(readFileSync(before.absolutePath)).toEqual(before.bytes);
        expect(after.mtimeMs).toBe(before.mtimeMs);
        expect(after.ino).toBe(before.ino);
      }
    },
    { timeout: CONTENT_RUNTIME_PREPARATION_TIMEOUT_MS * 2 },
  );

  test(
    "verify:content-runtime-completeness succeeds on the healthy repo checkout",
    () => {
      const result = spawnSync(
        "bun",
        ["run", "verify:content-runtime-completeness"],
        {
          cwd: repoRoot,
          encoding: "utf8",
          env: process.env,
        },
      );

      expect(result.status).toBe(0);
      expect(`${result.stdout}\n${result.stderr}`).toContain(
        "Generated-runtime completeness gate passed",
      );
    },
    { timeout: CONTENT_RUNTIME_PREPARATION_TIMEOUT_MS },
  );

  test(
    "content-runtime generators emit biome-stable modules without per-file biome subprocesses",
    () => {
      const realBunx = spawnSync("bash", ["-lc", "command -v bunx"], {
        cwd: repoRoot,
        encoding: "utf8",
        env: process.env,
      });
      expect(realBunx.status).toBe(0);
      const realBunxPath = realBunx.stdout.trim();
      expect(realBunxPath.length).toBeGreaterThan(0);

      const shimDir = join(
        repoRoot,
        "src/lib/content/generated/.biome-spawn-guard-test",
      );
      rmSync(shimDir, { recursive: true, force: true });
      mkdirSync(shimDir, { recursive: true });

      // Fail the run if any generator still shells out to `bunx biome …`.
      writeFileSync(
        join(shimDir, "bunx"),
        `#!/usr/bin/env bash
set -euo pipefail
if [[ "\${1:-}" == "biome" ]]; then
  echo "unexpected bunx biome subprocess: $*" >&2
  exit 97
fi
exec "${realBunxPath}" "$@"
`,
        { mode: 0o755 },
      );

      const guardedEnv = {
        ...process.env,
        PATH: `${shimDir}:${process.env.PATH ?? ""}`,
      };

      const generatorScripts = [
        "scripts/generate-shipped-localized-docs.ts",
        "scripts/generate-published-docs-registry.ts",
      ] as const;

      for (const script of generatorScripts) {
        const result = spawnSync("bun", ["run", script], {
          cwd: repoRoot,
          encoding: "utf8",
          env: guardedEnv,
        });
        expect(result.status, `${script}: ${result.stderr}`).toBe(0);
        expect(`${result.stdout}\n${result.stderr}`).not.toContain(
          "unexpected bunx biome subprocess",
        );
      }

      const generatedOutputs = [
        "src/lib/content/generated/shipped-localized-docs.generated.ts",
        "src/lib/content/generated/published-docs-registry.generated.ts",
      ] as const;

      for (const relativePath of generatedOutputs) {
        const absolutePath = join(repoRoot, relativePath);
        const before = readFileSync(absolutePath, "utf8");
        const formatResult = spawnSync(
          "bunx",
          [
            "biome",
            "format",
            "--write",
            "--vcs-use-ignore-file=false",
            absolutePath,
          ],
          {
            cwd: repoRoot,
            encoding: "utf8",
            env: process.env,
          },
        );
        expect(formatResult.status, relativePath).toBe(0);
        expect(readFileSync(absolutePath, "utf8")).toBe(before);
      }

      rmSync(shimDir, { recursive: true, force: true });
    },
    { timeout: CONTENT_RUNTIME_PREPARATION_TIMEOUT_MS },
  );

  test(
    "prepare then ensureGraphRegistryRuntimeOnce regenerates live graphs at most once",
    async () => {
      resetGraphRegistryRuntimeEnsureStateForTests();

      const prepareResult = spawnSync(
        "bun",
        ["run", "prepare:content-runtime"],
        {
          cwd: repoRoot,
          encoding: "utf8",
          env: process.env,
        },
      );
      expect(prepareResult.status).toBe(0);

      let generatorCalls = 0;
      const ensureResult = ensureGraphRegistryRuntimeOnce({
        cwd: repoRoot,
        runGenerator: () => {
          generatorCalls += 1;
        },
        log: () => {},
      });

      expect(ensureResult.action).toBe("skipped");
      expect(ensureResult.reason).toBe("cache-hit");
      expect(generatorCalls).toBe(0);

      // A second build-path ensure in the same process stays skipped without
      // re-entering generation (run-next after prepare).
      const secondEnsure = ensureGraphRegistryRuntimeOnce({
        cwd: repoRoot,
        runGenerator: () => {
          generatorCalls += 1;
        },
        log: () => {},
      });
      expect(secondEnsure.action).toBe("skipped");
      expect(secondEnsure.reason).toBe("process-memo");
      expect(generatorCalls).toBe(0);

      resetGraphRegistryRuntimeEnsureStateForTests();
    },
    { timeout: CONTENT_RUNTIME_PREPARATION_TIMEOUT_MS },
  );
});
