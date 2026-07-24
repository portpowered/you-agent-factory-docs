/**
 * Pure drift helpers for the packaged-factories-index generated corpus.
 *
 * Compares acquired source hashes and generated artifact bytes so tests fail
 * closed when the installed package drifts or committed generated outputs
 * diverge from regeneration. No filesystem IO.
 */

export type PackagedFactoryCorpusSourceHash = {
  relativePath: string;
  sha256: string;
};

export type PackagedFactoryCorpusArtifactContents = {
  relativePath: string;
  contents: string;
};

export type PackagedFactoryCorpusDriftErrorCode =
  | "source-hash-drift"
  | "source-hash-set-mismatch"
  | "generated-artifact-drift"
  | "missing-generated-artifact"
  | "extra-generated-artifact";

export class PackagedFactoryCorpusDriftError extends Error {
  readonly code: PackagedFactoryCorpusDriftErrorCode;
  readonly relativePath?: string;

  constructor(
    code: PackagedFactoryCorpusDriftErrorCode,
    message: string,
    options?: { relativePath?: string; cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoryCorpusDriftError";
    this.code = code;
    if (options?.relativePath !== undefined) {
      this.relativePath = options.relativePath;
    }
  }
}

export type PackagedFactoryCorpusSourceHashComparison =
  | { ok: true }
  | {
      ok: false;
      code: Extract<
        PackagedFactoryCorpusDriftErrorCode,
        "source-hash-drift" | "source-hash-set-mismatch"
      >;
      relativePath?: string;
      message: string;
    };

export type PackagedFactoryCorpusArtifactComparison =
  | { ok: true }
  | {
      ok: false;
      code: Extract<
        PackagedFactoryCorpusDriftErrorCode,
        | "generated-artifact-drift"
        | "missing-generated-artifact"
        | "extra-generated-artifact"
      >;
      relativePath?: string;
      message: string;
    };

function sortByRelativePath<T extends { relativePath: string }>(
  entries: readonly T[],
): T[] {
  return [...entries].sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath),
  );
}

/**
 * Compare expected (for example committed manifest) source hashes against
 * actual hashes recomputed from installed package file bytes.
 */
export function comparePackagedFactorySourceHashes(
  expected: readonly PackagedFactoryCorpusSourceHash[],
  actual: readonly PackagedFactoryCorpusSourceHash[],
): PackagedFactoryCorpusSourceHashComparison {
  const expectedSorted = sortByRelativePath(expected);
  const actualSorted = sortByRelativePath(actual);

  if (expectedSorted.length !== actualSorted.length) {
    return {
      ok: false,
      code: "source-hash-set-mismatch",
      message: `Source hash set size mismatch: expected ${expectedSorted.length} entries, got ${actualSorted.length}.`,
    };
  }

  for (let i = 0; i < expectedSorted.length; i += 1) {
    const expectedEntry = expectedSorted[i];
    const actualEntry = actualSorted[i];
    if (expectedEntry === undefined || actualEntry === undefined) {
      return {
        ok: false,
        code: "source-hash-set-mismatch",
        message: `Source hash set missing entry at index ${i}.`,
      };
    }
    if (expectedEntry.relativePath !== actualEntry.relativePath) {
      return {
        ok: false,
        code: "source-hash-set-mismatch",
        relativePath: expectedEntry.relativePath,
        message: `Source hash path mismatch at index ${i}: expected ${JSON.stringify(expectedEntry.relativePath)}, got ${JSON.stringify(actualEntry.relativePath)}.`,
      };
    }
    if (expectedEntry.sha256 !== actualEntry.sha256) {
      return {
        ok: false,
        code: "source-hash-drift",
        relativePath: expectedEntry.relativePath,
        message: `Source hash drift for ${JSON.stringify(expectedEntry.relativePath)}: expected ${expectedEntry.sha256}, got ${actualEntry.sha256}.`,
      };
    }
  }

  return { ok: true };
}

/**
 * Fail closed when acquired allowlisted source hashes diverge from expected
 * hashes (committed manifest or prior acquisition).
 */
export function assertPackagedFactorySourceHashesMatch(
  expected: readonly PackagedFactoryCorpusSourceHash[],
  actual: readonly PackagedFactoryCorpusSourceHash[],
): void {
  const comparison = comparePackagedFactorySourceHashes(expected, actual);
  if (!comparison.ok) {
    throw new PackagedFactoryCorpusDriftError(
      comparison.code,
      comparison.message,
      comparison.relativePath !== undefined
        ? { relativePath: comparison.relativePath }
        : undefined,
    );
  }
}

/**
 * Compare expected (committed) generated artifact bytes against actual
 * regenerated artifact bytes for the same installed package inputs.
 */
export function comparePackagedFactoryGeneratedArtifacts(
  expected: readonly PackagedFactoryCorpusArtifactContents[],
  actual: readonly PackagedFactoryCorpusArtifactContents[],
): PackagedFactoryCorpusArtifactComparison {
  const expectedByPath = new Map(
    expected.map((entry) => [entry.relativePath, entry.contents] as const),
  );
  const actualByPath = new Map(
    actual.map((entry) => [entry.relativePath, entry.contents] as const),
  );

  for (const relativePath of expectedByPath.keys()) {
    if (!actualByPath.has(relativePath)) {
      return {
        ok: false,
        code: "missing-generated-artifact",
        relativePath,
        message: `Regenerated corpus is missing committed artifact ${JSON.stringify(relativePath)}.`,
      };
    }
  }

  for (const relativePath of actualByPath.keys()) {
    if (!expectedByPath.has(relativePath)) {
      return {
        ok: false,
        code: "extra-generated-artifact",
        relativePath,
        message: `Regenerated corpus has unexpected artifact ${JSON.stringify(relativePath)} not present in committed outputs.`,
      };
    }
  }

  const paths = [...expectedByPath.keys()].sort((a, b) => a.localeCompare(b));
  for (const relativePath of paths) {
    const expectedContents = expectedByPath.get(relativePath);
    const actualContents = actualByPath.get(relativePath);
    if (expectedContents === undefined || actualContents === undefined) {
      return {
        ok: false,
        code: "missing-generated-artifact",
        relativePath,
        message: `Unable to compare artifact ${JSON.stringify(relativePath)}.`,
      };
    }
    if (expectedContents !== actualContents) {
      return {
        ok: false,
        code: "generated-artifact-drift",
        relativePath,
        message: `Generated artifact drift for ${JSON.stringify(relativePath)}: regenerated bytes diverge from committed outputs.`,
      };
    }
  }

  return { ok: true };
}

/**
 * Fail closed when regenerated generated-tree artifacts diverge from committed
 * outputs for the same package inputs.
 */
export function assertPackagedFactoryGeneratedArtifactsMatch(
  expected: readonly PackagedFactoryCorpusArtifactContents[],
  actual: readonly PackagedFactoryCorpusArtifactContents[],
): void {
  const comparison = comparePackagedFactoryGeneratedArtifacts(expected, actual);
  if (!comparison.ok) {
    throw new PackagedFactoryCorpusDriftError(
      comparison.code,
      comparison.message,
      comparison.relativePath !== undefined
        ? { relativePath: comparison.relativePath }
        : undefined,
    );
  }
}
