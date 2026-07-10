import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { getGeneratedDocsSourceRoot } from "./content-paths";
import {
  type ContentRuntimeFingerprintDependencies,
  type ContentRuntimeStepCacheDecision,
  clearContentRuntimeFingerprints,
  evaluateContentRuntimeStepCache,
  writeContentRuntimeStepFingerprint,
} from "./content-runtime-fingerprints";

export type ContentRuntimePreparationStep = {
  id: string;
  command: readonly [string, ...string[]];
  outputPath: string;
  gitClassification: "committed" | "ignored";
  owningSurface: string;
};

export type ContentRuntimePreparationCommandResult = {
  error?: Error;
  signal: NodeJS.Signals | null;
  status: number | null;
};

export type ContentRuntimeGitCommandResult =
  ContentRuntimePreparationCommandResult & {
    stderr?: string;
    stdout?: string;
  };

export type RunContentRuntimePreparationCommand = (
  command: readonly [string, ...string[]],
  options: {
    cwd: string;
  },
) => ContentRuntimePreparationCommandResult;

export type RunContentRuntimeGitCommand = (
  command: readonly [string, ...string[]],
  options: {
    cwd: string;
  },
) => ContentRuntimeGitCommandResult;

export type ContentRuntimePreparationLogger = (message: string) => void;
export type ContentRuntimeGitClassification =
  | "committed"
  | "ignored"
  | "unclassified";

export const CONTENT_RUNTIME_COMPLETENESS_CONTRACT: readonly ContentRuntimePreparationStep[] =
  [
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
  ] as const;

export const CONTENT_RUNTIME_PREPARATION_STEPS =
  CONTENT_RUNTIME_COMPLETENESS_CONTRACT;

/**
 * Env flag that enables force-clean for `prepare:content-runtime`.
 * Accepted truthy values: `1`, `true`, `yes` (case-insensitive).
 */
export const CONTENT_RUNTIME_FORCE_CLEAN_ENV = "CONTENT_RUNTIME_FORCE_CLEAN";

export type RunContentRuntimePreparationOptions = {
  cwd: string;
  /**
   * When true, wipe `.source` and ignored generated runtime outputs before
   * regenerating all steps. Default preparation preserves those artifacts.
   */
  forceClean?: boolean;
  /**
   * When false, every step runs without fingerprint cache checks.
   * Defaults to true so warm prepares can skip unchanged generators.
   */
  useFingerprints?: boolean;
  log?: ContentRuntimePreparationLogger;
  logError?: ContentRuntimePreparationLogger;
  runCommand?: RunContentRuntimePreparationCommand;
  removeDirectory?: (
    path: string,
    options: { force: boolean; recursive: boolean },
  ) => void;
  removeFile?: (path: string, options: { force: boolean }) => void;
  steps?: readonly ContentRuntimePreparationStep[];
  fingerprintDependencies?: ContentRuntimeFingerprintDependencies;
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
  clearFingerprints?: (
    cwd: string,
    dependencies?: ContentRuntimeFingerprintDependencies,
  ) => void;
};

/**
 * Resolve whether force-clean is requested from CLI argv and/or env.
 * CLI `--force-clean` / `--force-clean=true|1|yes` wins over env when present.
 */
export function resolveContentRuntimeForceClean(
  env: Record<string, string | undefined> = process.env,
  argv: readonly string[] = [],
): boolean {
  for (const arg of argv) {
    if (arg === "--force-clean") {
      return true;
    }
    if (arg.startsWith("--force-clean=")) {
      return isTruthyFlagValue(arg.slice("--force-clean=".length));
    }
  }

  return isTruthyFlagValue(env[CONTENT_RUNTIME_FORCE_CLEAN_ENV]);
}

function isTruthyFlagValue(value: string | undefined): boolean {
  if (value === undefined) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export type ContentRuntimePreparationResult =
  | {
      ok: true;
      completedSteps: readonly ContentRuntimePreparationStep[];
      /** Steps skipped because fingerprints matched and outputs were usable. */
      skippedSteps: readonly ContentRuntimePreparationStep[];
    }
  | {
      ok: false;
      completedSteps: readonly ContentRuntimePreparationStep[];
      skippedSteps: readonly ContentRuntimePreparationStep[];
      failedStep: ContentRuntimePreparationStep;
      commandResult: ContentRuntimePreparationCommandResult;
    };

export type DetectContentRuntimeGitClassificationResult =
  | {
      ok: true;
      classification: ContentRuntimeGitClassification;
    }
  | {
      ok: false;
      message: string;
      commandResult: ContentRuntimeGitCommandResult;
    };

export type VerifyContentRuntimeCompletenessResult =
  | {
      ok: true;
      verifiedSteps: readonly ContentRuntimePreparationStep[];
    }
  | {
      ok: false;
      kind:
        | "missing-output"
        | "git-classification-mismatch"
        | "git-command-failed";
      step: ContentRuntimePreparationStep;
      message: string;
      repairGuidance: string;
      commandResult?: ContentRuntimeGitCommandResult;
    };

export type RunContentRuntimeCompletenessGateOptions = {
  cwd: string;
  forceClean?: boolean;
  log?: ContentRuntimePreparationLogger;
  logError?: ContentRuntimePreparationLogger;
  runPreparation?: (
    options: RunContentRuntimePreparationOptions,
  ) => ContentRuntimePreparationResult;
  runGitCommand?: RunContentRuntimeGitCommand;
  steps?: readonly ContentRuntimePreparationStep[];
  fileExists?: (path: string) => boolean;
};

export type ContentRuntimeCompletenessGateResult =
  | {
      ok: true;
      completedSteps: readonly ContentRuntimePreparationStep[];
      verifiedSteps: readonly ContentRuntimePreparationStep[];
    }
  | {
      ok: false;
      stage: "preparation" | "verification";
      completedSteps: readonly ContentRuntimePreparationStep[];
      message: string;
      repairGuidance: string;
      step?: ContentRuntimePreparationStep;
      preparationResult?: ContentRuntimePreparationResult;
      verificationResult?: VerifyContentRuntimeCompletenessResult;
    };

function removeGeneratedDocsSource(
  cwd: string,
  removeDirectory: (
    path: string,
    options: { force: boolean; recursive: boolean },
  ) => void = rmSync,
): string {
  const generatedDocsSourceRoot = getGeneratedDocsSourceRoot(cwd);
  removeDirectory(generatedDocsSourceRoot, {
    force: true,
    recursive: true,
  });

  return generatedDocsSourceRoot;
}

function removeIgnoredGeneratedRuntimeOutputs(
  cwd: string,
  steps: readonly ContentRuntimePreparationStep[],
  removeFile: (path: string, options: { force: boolean }) => void = rmSync,
): string[] {
  const removedPaths: string[] = [];

  for (const step of steps) {
    if (step.gitClassification !== "ignored") {
      continue;
    }

    const absoluteOutputPath = join(cwd, step.outputPath);
    removeFile(absoluteOutputPath, { force: true });
    removedPaths.push(absoluteOutputPath);
  }

  return removedPaths;
}

function runCommandSync(
  command: readonly [string, ...string[]],
  options: {
    cwd: string;
  },
): ContentRuntimePreparationCommandResult {
  const [binary, ...args] = command;
  const result = spawnSync(binary, args, {
    cwd: options.cwd,
    env: process.env,
    stdio: "inherit",
  });

  return {
    error:
      result.error instanceof Error
        ? result.error
        : result.error
          ? new Error(String(result.error))
          : undefined,
    signal: result.signal,
    status: result.status,
  };
}

function runGitCommandSync(
  command: readonly [string, ...string[]],
  options: {
    cwd: string;
  },
): ContentRuntimeGitCommandResult {
  const [binary, ...args] = command;
  const result = spawnSync(binary, args, {
    cwd: options.cwd,
    env: process.env,
    encoding: "utf8",
    stdio: "pipe",
  });

  return {
    error:
      result.error instanceof Error
        ? result.error
        : result.error
          ? new Error(String(result.error))
          : undefined,
    signal: result.signal,
    status: result.status,
    stderr: typeof result.stderr === "string" ? result.stderr : undefined,
    stdout: typeof result.stdout === "string" ? result.stdout : undefined,
  };
}

function formatCommand(command: readonly [string, ...string[]]): string {
  return command.join(" ");
}

function formatRepairGuidance(step: ContentRuntimePreparationStep): string {
  const rerunCommand = formatCommand(step.command);

  if (step.gitClassification === "committed") {
    return `Rerun \`${rerunCommand}\` or \`bun run prepare:content-runtime\`, verify \`${step.outputPath}\` exists, and commit the regenerated file because this runtime module is authoritative repo state.`;
  }

  return `Rerun \`${rerunCommand}\` or \`bun run prepare:content-runtime\`, verify \`${step.outputPath}\` exists locally, and leave it out of the commit because this runtime module is intentionally ignored derived state.`;
}

export function detectContentRuntimeGitClassification(
  step: ContentRuntimePreparationStep,
  options: {
    cwd: string;
    runGitCommand?: RunContentRuntimeGitCommand;
  },
): DetectContentRuntimeGitClassificationResult {
  const runGitCommand = options.runGitCommand ?? runGitCommandSync;
  const trackedResult = runGitCommand(
    ["git", "ls-files", "--error-unmatch", "--", step.outputPath],
    {
      cwd: options.cwd,
    },
  );

  if (trackedResult.status === 0) {
    return {
      ok: true,
      classification: "committed",
    };
  }

  const trackedFailedUnexpectedly =
    trackedResult.status === null || trackedResult.error;
  if (trackedFailedUnexpectedly) {
    return {
      ok: false,
      message: `Failed to inspect tracked state for "${step.outputPath}" while checking generated-runtime completeness.`,
      commandResult: trackedResult,
    };
  }

  const ignoredResult = runGitCommand(
    ["git", "check-ignore", "--quiet", "--no-index", step.outputPath],
    {
      cwd: options.cwd,
    },
  );

  if (ignoredResult.status === 0) {
    return {
      ok: true,
      classification: "ignored",
    };
  }

  const ignoredFailedUnexpectedly =
    ignoredResult.status === null ||
    ignoredResult.error ||
    (ignoredResult.status !== 1 && ignoredResult.status !== 0);
  if (ignoredFailedUnexpectedly) {
    return {
      ok: false,
      message: `Failed to inspect ignore rules for "${step.outputPath}" while checking generated-runtime completeness.`,
      commandResult: ignoredResult,
    };
  }

  return {
    ok: true,
    classification: "unclassified",
  };
}

export function verifyContentRuntimeCompleteness(options: {
  cwd: string;
  runGitCommand?: RunContentRuntimeGitCommand;
  steps?: readonly ContentRuntimePreparationStep[];
  fileExists?: (path: string) => boolean;
}): VerifyContentRuntimeCompletenessResult {
  const steps = options.steps ?? CONTENT_RUNTIME_PREPARATION_STEPS;
  const fileExists = options.fileExists ?? existsSync;

  for (const step of steps) {
    const absoluteOutputPath = join(options.cwd, step.outputPath);
    if (!fileExists(absoluteOutputPath)) {
      return {
        ok: false,
        kind: "missing-output",
        step,
        message: `Missing required generated runtime module "${step.outputPath}" for step "${step.id}" (${step.owningSurface}) after \`bun run prepare:content-runtime\`.`,
        repairGuidance: formatRepairGuidance(step),
      };
    }

    const classificationResult = detectContentRuntimeGitClassification(step, {
      cwd: options.cwd,
      runGitCommand: options.runGitCommand,
    });
    if (!classificationResult.ok) {
      return {
        ok: false,
        kind: "git-command-failed",
        step,
        message: classificationResult.message,
        repairGuidance:
          "Fix the git command failure in this worktree, then rerun `bun run verify:content-runtime-completeness`.",
        commandResult: classificationResult.commandResult,
      };
    }

    if (classificationResult.classification !== step.gitClassification) {
      const expectedState =
        step.gitClassification === "committed"
          ? "tracked in git and reviewable in the PR"
          : "ignored by git and kept as local derived state";
      const actualState =
        classificationResult.classification === "committed"
          ? "tracked in git"
          : classificationResult.classification === "ignored"
            ? "ignored by git"
            : "present but neither tracked nor ignored";

      return {
        ok: false,
        kind: "git-classification-mismatch",
        step,
        message: `Generated runtime module "${step.outputPath}" for step "${step.id}" (${step.owningSurface}) has git classification "${classificationResult.classification}", but the completeness contract requires "${step.gitClassification}". Expected this file to be ${expectedState}; instead it is ${actualState}.`,
        repairGuidance: formatRepairGuidance(step),
      };
    }
  }

  return {
    ok: true,
    verifiedSteps: steps,
  };
}

export function runContentRuntimePreparation(
  options: RunContentRuntimePreparationOptions,
): ContentRuntimePreparationResult {
  const runCommand = options.runCommand ?? runCommandSync;
  const log = options.log ?? console.log;
  const logError = options.logError ?? console.error;
  const removeDirectory = options.removeDirectory ?? rmSync;
  const steps = options.steps ?? CONTENT_RUNTIME_PREPARATION_STEPS;
  const removeFile = options.removeFile ?? rmSync;
  const forceClean = options.forceClean === true;
  const useFingerprints = options.useFingerprints !== false;
  const fingerprintDependencies = options.fingerprintDependencies;
  const evaluateStepCache =
    options.evaluateStepCache ?? evaluateContentRuntimeStepCache;
  const recordStepFingerprint =
    options.recordStepFingerprint ?? writeContentRuntimeStepFingerprint;
  const clearFingerprints =
    options.clearFingerprints ?? clearContentRuntimeFingerprints;
  const completedSteps: ContentRuntimePreparationStep[] = [];
  const skippedSteps: ContentRuntimePreparationStep[] = [];

  if (forceClean) {
    const removedSourceRoot = removeGeneratedDocsSource(
      options.cwd,
      removeDirectory,
    );
    const removedIgnoredOutputs = removeIgnoredGeneratedRuntimeOutputs(
      options.cwd,
      steps,
      removeFile,
    );
    if (useFingerprints) {
      clearFingerprints(options.cwd, fingerprintDependencies);
    }

    log(
      `[content-runtime] Force-clean: removing generated Fumadocs bindings -> ${relative(options.cwd, removedSourceRoot) || ".source"}`,
    );
    for (const removedOutputPath of removedIgnoredOutputs) {
      log(
        `[content-runtime] Force-clean: invalidating ignored generated runtime output -> ${relative(options.cwd, removedOutputPath)}`,
      );
    }
  } else {
    log(
      "[content-runtime] Preserving existing .source and ignored generated runtime outputs (pass --force-clean to wipe).",
    );
  }

  for (const step of steps) {
    const cacheDecision = useFingerprints
      ? evaluateStepCache({
          cwd: options.cwd,
          stepId: step.id,
          outputPath: step.outputPath,
          forceClean,
          dependencies: fingerprintDependencies,
        })
      : ({
          action: "run",
          reason: "fingerprint-miss",
          fingerprint: null,
        } satisfies ContentRuntimeStepCacheDecision);

    if (cacheDecision.action === "skip") {
      log(
        `[content-runtime] Cache hit for ${step.id} -> ${step.outputPath}; skipping generation.`,
      );
      skippedSteps.push(step);
      completedSteps.push(step);
      continue;
    }

    log(
      `[content-runtime] Preparing ${step.id} -> ${step.outputPath} (${formatCommand(step.command)}) [${cacheDecision.reason}]`,
    );
    const commandResult = runCommand(step.command, {
      cwd: options.cwd,
    });

    if (commandResult.status !== 0) {
      const failureReason =
        commandResult.status === null
          ? commandResult.signal
            ? `signal ${commandResult.signal}`
            : (commandResult.error?.message ?? "unknown failure")
          : `exit status ${commandResult.status}`;
      logError(
        `[content-runtime] Failed step "${step.id}" while running ${formatCommand(step.command)} (${failureReason}).`,
      );

      return {
        ok: false,
        completedSteps,
        skippedSteps,
        failedStep: step,
        commandResult,
      };
    }

    if (useFingerprints && cacheDecision.fingerprint) {
      recordStepFingerprint(
        options.cwd,
        step.id,
        cacheDecision.fingerprint,
        fingerprintDependencies,
      );
    }

    completedSteps.push(step);
  }

  log(
    `[content-runtime] Prepared ${completedSteps.length} runtime steps successfully (${skippedSteps.length} cache hits).`,
  );

  return {
    ok: true,
    completedSteps,
    skippedSteps,
  };
}

export function runContentRuntimeCompletenessGate(
  options: RunContentRuntimeCompletenessGateOptions,
): ContentRuntimeCompletenessGateResult {
  const runPreparation = options.runPreparation ?? runContentRuntimePreparation;
  const log = options.log ?? console.log;
  const steps = options.steps ?? CONTENT_RUNTIME_PREPARATION_STEPS;
  const preparationResult = runPreparation({
    cwd: options.cwd,
    forceClean: options.forceClean,
    log: options.log,
    logError: options.logError,
    steps,
  });

  if (!preparationResult.ok) {
    return {
      ok: false,
      stage: "preparation",
      completedSteps: preparationResult.completedSteps,
      step: preparationResult.failedStep,
      message: `Generated-runtime completeness gate stopped because preparation failed at step "${preparationResult.failedStep.id}".`,
      repairGuidance: formatRepairGuidance(preparationResult.failedStep),
      preparationResult,
    };
  }

  log(
    `[content-runtime] Verifying completeness contract for ${steps.length} generated runtime outputs.`,
  );
  const verificationResult = verifyContentRuntimeCompleteness({
    cwd: options.cwd,
    runGitCommand: options.runGitCommand,
    steps,
    fileExists: options.fileExists,
  });

  if (!verificationResult.ok) {
    return {
      ok: false,
      stage: "verification",
      completedSteps: preparationResult.completedSteps,
      step: verificationResult.step,
      message: verificationResult.message,
      repairGuidance: verificationResult.repairGuidance,
      preparationResult,
      verificationResult,
    };
  }

  log("[content-runtime] Generated-runtime completeness gate passed.");
  return {
    ok: true,
    completedSteps: preparationResult.completedSteps,
    verifiedSteps: verificationResult.verifiedSteps,
  };
}
