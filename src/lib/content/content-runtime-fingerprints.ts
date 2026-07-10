import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";

/**
 * Bump when fingerprint material or serialization changes so warm caches
 * invalidate across prepare runs after a format change.
 */
export const CONTENT_RUNTIME_FINGERPRINT_SCHEMA_VERSION = 1;

/** Derived fingerprint store written beside generated runtime modules. */
export const CONTENT_RUNTIME_FINGERPRINTS_RELATIVE_PATH =
  "src/lib/content/generated/.content-runtime-fingerprints.json";

export type ContentRuntimeStepFingerprintInputs = {
  stepId: string;
  /** Relative paths (files or directories) whose contents affect the step output. */
  inputPaths: readonly string[];
  /** Generator scripts / libraries that define how inputs become outputs. */
  generatorPaths: readonly string[];
  /** Schema / contract modules that shape validation or emitted structure. */
  schemaPaths: readonly string[];
};

/**
 * Declared fingerprint surfaces per contracted preparation step.
 * Paths are repo-relative and stable across machines.
 */
export const CONTENT_RUNTIME_STEP_FINGERPRINT_INPUTS: readonly ContentRuntimeStepFingerprintInputs[] =
  [
    {
      stepId: "shipped-localized-docs",
      inputPaths: ["src/content/docs"],
      generatorPaths: [
        "scripts/generate-shipped-localized-docs.ts",
        "src/lib/content/shipped-localized-docs.server.ts",
        "src/lib/content/shipped-localized-docs.ts",
        "src/lib/content/render-typescript-literal.ts",
        "src/lib/content/write-file-if-changed.ts",
        "src/lib/i18n/locale-routing.ts",
      ],
      schemaPaths: [
        "src/lib/content/schemas.ts",
        "src/lib/content/yaml-frontmatter.ts",
      ],
    },
    {
      stepId: "graph-registry-runtime",
      inputPaths: ["src/content/registry/graphs"],
      generatorPaths: [
        "scripts/generate-graph-registry-runtime.ts",
        "src/lib/content/graph-registry-validation.ts",
      ],
      schemaPaths: ["src/lib/content/schemas.ts"],
    },
    {
      stepId: "published-docs-registry",
      inputPaths: ["src/content/docs"],
      generatorPaths: [
        "scripts/generate-published-docs-registry.ts",
        "src/lib/content/published-docs-registry-source.ts",
        "src/lib/content/published-docs-registry-contract.ts",
        "src/lib/content/pages.ts",
        "src/lib/content/render-typescript-literal.ts",
        "src/lib/content/write-file-if-changed.ts",
      ],
      schemaPaths: [
        "src/lib/content/schemas.ts",
        "src/lib/content/yaml-frontmatter.ts",
      ],
    },
    {
      stepId: "registry-runtime",
      inputPaths: [
        "src/content/registry/citations",
        "src/content/registry/classifications",
        "src/content/registry/concepts",
        "src/content/registry/datasets",
        "src/content/registry/documentation",
        "src/content/registry/guides",
        "src/content/registry/organizations",
        "src/content/registry/tags",
        "src/content/registry/techniques",
      ],
      generatorPaths: [
        "scripts/generate-registry-runtime.ts",
        "src/lib/content/registry-runtime-generation.ts",
        "src/lib/content/registry.ts",
        "src/lib/content/related-docs.ts",
        "src/lib/content/published-docs-registry-ids.ts",
      ],
      schemaPaths: ["src/lib/content/schemas.ts"],
    },
    {
      stepId: "table-registry-runtime",
      inputPaths: ["src/content/registry/tables"],
      generatorPaths: [
        "scripts/generate-table-registry-runtime.ts",
        "src/lib/content/table-registry-generation.ts",
      ],
      schemaPaths: ["src/lib/content/schemas.ts"],
    },
  ] as const;

export type ContentRuntimeFingerprintStore = {
  schemaVersion: number;
  steps: Record<string, string>;
};

export type ContentRuntimeStepCacheDecision =
  | {
      action: "skip";
      reason: "cache-hit";
      fingerprint: string;
    }
  | {
      action: "run";
      reason:
        | "force-clean"
        | "missing-output"
        | "unusable-output"
        | "fingerprint-miss"
        | "no-fingerprint-inputs";
      fingerprint: string | null;
    };

export type ContentRuntimeFingerprintDependencies = {
  fileExists?: (path: string) => boolean;
  readFile?: (path: string) => string;
  writeFile?: (path: string, contents: string) => void;
  isDirectory?: (path: string) => boolean;
  listDirectoryNames?: (path: string) => readonly string[];
  fileSize?: (path: string) => number;
};

function toPosixRelativePath(path: string): string {
  return path.split(sep).join("/");
}

function defaultIsDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function defaultListDirectoryNames(path: string): readonly string[] {
  return readdirSync(path);
}

function collectSortedFileRelativePaths(
  cwd: string,
  relativePath: string,
  dependencies: ContentRuntimeFingerprintDependencies,
): string[] {
  const fileExists = dependencies.fileExists ?? existsSync;
  const isDirectory = dependencies.isDirectory ?? defaultIsDirectory;
  const listDirectoryNames =
    dependencies.listDirectoryNames ?? defaultListDirectoryNames;
  const absolutePath = join(cwd, relativePath);

  if (!fileExists(absolutePath)) {
    return [];
  }

  if (!isDirectory(absolutePath)) {
    return [toPosixRelativePath(relativePath)];
  }

  const files: string[] = [];
  for (const entryName of listDirectoryNames(absolutePath)) {
    const childRelative = toPosixRelativePath(join(relativePath, entryName));
    files.push(
      ...collectSortedFileRelativePaths(cwd, childRelative, dependencies),
    );
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function hashPathMaterial(
  cwd: string,
  relativePath: string,
  dependencies: ContentRuntimeFingerprintDependencies,
): string {
  const fileExists = dependencies.fileExists ?? existsSync;
  const isDirectory = dependencies.isDirectory ?? defaultIsDirectory;
  const readFile =
    dependencies.readFile ?? ((path) => readFileSync(path, "utf8"));
  const absolutePath = join(cwd, relativePath);
  const posixPath = toPosixRelativePath(relativePath);

  if (!fileExists(absolutePath)) {
    return `missing:${posixPath}`;
  }

  if (!isDirectory(absolutePath)) {
    return `file:${posixPath}:${createHash("sha256")
      .update(readFile(absolutePath))
      .digest("hex")}`;
  }

  const nestedFiles = collectSortedFileRelativePaths(
    cwd,
    relativePath,
    dependencies,
  );
  if (nestedFiles.length === 0) {
    return `empty-dir:${posixPath}`;
  }

  const directoryHash = createHash("sha256");
  for (const nestedRelativePath of nestedFiles) {
    directoryHash.update(nestedRelativePath);
    directoryHash.update("\0");
    directoryHash.update(readFile(join(cwd, nestedRelativePath)));
    directoryHash.update("\n");
  }
  return `dir:${posixPath}:${directoryHash.digest("hex")}`;
}

export function getContentRuntimeStepFingerprintInputs(
  stepId: string,
): ContentRuntimeStepFingerprintInputs | undefined {
  return CONTENT_RUNTIME_STEP_FINGERPRINT_INPUTS.find(
    (entry) => entry.stepId === stepId,
  );
}

/**
 * Deterministic fingerprint over declared inputs, generator identity, and
 * schema/contract surfaces. Stable across machines for the same relative tree.
 */
export function computeContentRuntimeStepFingerprint(
  cwd: string,
  inputs: ContentRuntimeStepFingerprintInputs,
  dependencies: ContentRuntimeFingerprintDependencies = {},
): string {
  const hash = createHash("sha256");
  hash.update(`schemaVersion:${CONTENT_RUNTIME_FINGERPRINT_SCHEMA_VERSION}\n`);
  hash.update(`stepId:${inputs.stepId}\n`);

  const sections: Array<{
    label: string;
    paths: readonly string[];
  }> = [
    { label: "inputs", paths: inputs.inputPaths },
    { label: "generators", paths: inputs.generatorPaths },
    { label: "schemas", paths: inputs.schemaPaths },
  ];

  for (const section of sections) {
    hash.update(`${section.label}:\n`);
    for (const path of section.paths) {
      hash.update(hashPathMaterial(cwd, path, dependencies));
      hash.update("\n");
    }
  }

  return hash.digest("hex");
}

export function resolveContentRuntimeFingerprintsPath(cwd: string): string {
  return join(cwd, CONTENT_RUNTIME_FINGERPRINTS_RELATIVE_PATH);
}

export function readContentRuntimeFingerprintStore(
  cwd: string,
  dependencies: ContentRuntimeFingerprintDependencies = {},
): ContentRuntimeFingerprintStore {
  const fileExists = dependencies.fileExists ?? existsSync;
  const readFile =
    dependencies.readFile ?? ((path) => readFileSync(path, "utf8"));
  const storePath = resolveContentRuntimeFingerprintsPath(cwd);

  if (!fileExists(storePath)) {
    return {
      schemaVersion: CONTENT_RUNTIME_FINGERPRINT_SCHEMA_VERSION,
      steps: {},
    };
  }

  try {
    const parsed = JSON.parse(
      readFile(storePath),
    ) as Partial<ContentRuntimeFingerprintStore>;
    if (
      parsed.schemaVersion !== CONTENT_RUNTIME_FINGERPRINT_SCHEMA_VERSION ||
      typeof parsed.steps !== "object" ||
      parsed.steps === null
    ) {
      return {
        schemaVersion: CONTENT_RUNTIME_FINGERPRINT_SCHEMA_VERSION,
        steps: {},
      };
    }

    const steps: Record<string, string> = {};
    for (const [stepId, fingerprint] of Object.entries(parsed.steps)) {
      if (typeof fingerprint === "string" && fingerprint.length > 0) {
        steps[stepId] = fingerprint;
      }
    }

    return {
      schemaVersion: CONTENT_RUNTIME_FINGERPRINT_SCHEMA_VERSION,
      steps,
    };
  } catch {
    return {
      schemaVersion: CONTENT_RUNTIME_FINGERPRINT_SCHEMA_VERSION,
      steps: {},
    };
  }
}

function defaultWriteFile(path: string, contents: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, "utf8");
}

export function writeContentRuntimeFingerprintStore(
  cwd: string,
  store: ContentRuntimeFingerprintStore,
  dependencies: ContentRuntimeFingerprintDependencies = {},
): void {
  const writeFile = dependencies.writeFile ?? defaultWriteFile;
  writeFile(
    resolveContentRuntimeFingerprintsPath(cwd),
    `${JSON.stringify(store, null, 2)}\n`,
  );
}

/** Persist one step fingerprint into the shared store. */
export function writeContentRuntimeStepFingerprint(
  cwd: string,
  stepId: string,
  fingerprint: string,
  dependencies: ContentRuntimeFingerprintDependencies = {},
): void {
  const store = readContentRuntimeFingerprintStore(cwd, dependencies);
  store.steps[stepId] = fingerprint;
  writeContentRuntimeFingerprintStore(cwd, store, dependencies);
}

export function clearContentRuntimeFingerprints(
  cwd: string,
  dependencies: ContentRuntimeFingerprintDependencies = {},
): void {
  writeContentRuntimeFingerprintStore(
    cwd,
    {
      schemaVersion: CONTENT_RUNTIME_FINGERPRINT_SCHEMA_VERSION,
      steps: {},
    },
    dependencies,
  );
}

/**
 * Output is usable when it exists and has non-zero size. Deeper corrupt
 * recovery belongs to later incremental-proof stories.
 */
export function isContentRuntimeOutputUsable(
  cwd: string,
  outputPath: string,
  dependencies: ContentRuntimeFingerprintDependencies = {},
): boolean {
  const fileExists = dependencies.fileExists ?? existsSync;
  const fileSize = dependencies.fileSize ?? ((path) => statSync(path).size);
  const absoluteOutputPath = join(cwd, outputPath);

  if (!fileExists(absoluteOutputPath)) {
    return false;
  }

  try {
    return fileSize(absoluteOutputPath) > 0;
  } catch {
    return false;
  }
}

export function evaluateContentRuntimeStepCache(options: {
  cwd: string;
  stepId: string;
  outputPath: string;
  forceClean?: boolean;
  dependencies?: ContentRuntimeFingerprintDependencies;
  fingerprintInputs?: ContentRuntimeStepFingerprintInputs;
}): ContentRuntimeStepCacheDecision {
  const dependencies = options.dependencies ?? {};
  const inputs =
    options.fingerprintInputs ??
    getContentRuntimeStepFingerprintInputs(options.stepId);

  if (!inputs) {
    return {
      action: "run",
      reason: "no-fingerprint-inputs",
      fingerprint: null,
    };
  }

  const fingerprint = computeContentRuntimeStepFingerprint(
    options.cwd,
    inputs,
    dependencies,
  );

  if (options.forceClean === true) {
    return {
      action: "run",
      reason: "force-clean",
      fingerprint,
    };
  }

  if (
    !isContentRuntimeOutputUsable(options.cwd, options.outputPath, dependencies)
  ) {
    const fileExists = dependencies.fileExists ?? existsSync;
    const absoluteOutputPath = join(options.cwd, options.outputPath);
    return {
      action: "run",
      reason: fileExists(absoluteOutputPath)
        ? "unusable-output"
        : "missing-output",
      fingerprint,
    };
  }

  const store = readContentRuntimeFingerprintStore(options.cwd, dependencies);
  if (store.steps[options.stepId] === fingerprint) {
    return {
      action: "skip",
      reason: "cache-hit",
      fingerprint,
    };
  }

  return {
    action: "run",
    reason: "fingerprint-miss",
    fingerprint,
  };
}

/** Test/diagnostics helper for the store path relative to cwd. */
export function relativeContentRuntimeFingerprintsPath(
  cwd: string,
  absolutePath: string = resolveContentRuntimeFingerprintsPath(cwd),
): string {
  return toPosixRelativePath(relative(cwd, absolutePath));
}
