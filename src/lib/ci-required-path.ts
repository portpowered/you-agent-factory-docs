/**
 * Aligned required path for `make ci` and `.github/workflows/ci.yml`
 * (restore-required-tests-gates-007 → Wave CI-1 job graph → Wave CI-2
 * static-export artifact handoff).
 *
 * GitHub Actions CI is modeled as a required job graph: suite membership per
 * job plus real ordering edges (parallel peers allowed). Wave CI-2 adds a
 * trusted Actions artifact handoff so `integration` / `budget` consume the
 * `static-export` job’s `out/` instead of rebuilding it. `make ci`
 * prerequisites stay the sequential local reproduction path and must cover the
 * same shared restored suites — no workflow-only required gate that `make ci`
 * skips, and no `make ci`-only required suite that CI never runs. Local
 * `make ci` still builds once then runs integration/budget on one machine; it
 * does not use Actions artifacts.
 *
 * Deploy-pages stays a Pages-focused subset (check / test / build / guard /
 * budget) and is not required to mirror the full verify path.
 */

/**
 * Makefile `ci:` prerequisites in order.
 * Includes `build` so `test-integration` and `budget` reuse one trusted `out/`.
 */
export const MAKE_CI_PREREQUISITES = [
  "lint",
  "typecheck",
  "test",
  "test-reader-facing",
  "a11y",
  "test-ci-contract",
  "test-verify-contract",
  "test-build-contract",
  "build",
  "test-integration",
  "budget",
  "component-coverage",
  "validate-data",
  "linkcheck",
] as const;

/**
 * Workflow `run: make <target>` stages that must appear across the CI job
 * graph. Uses `check` (typecheck + lint) instead of the separate `lint` /
 * `typecheck` prerequisites from `make ci`. Includes `setup` as a per-job
 * prerequisite inventory entry (not a graph job id).
 */
export const CI_WORKFLOW_REQUIRED_MAKE_TARGETS = [
  "setup",
  "check",
  "test",
  "test-reader-facing",
  "a11y",
  "test-ci-contract",
  "test-verify-contract",
  "test-build-contract",
  "build",
  "test-integration",
  "budget",
  "component-coverage",
  "validate-data",
  "linkcheck",
] as const;

/**
 * Restored required suites that must appear in both `make ci` and CI.
 * (`build` is the shared export step that feeds integration + budget.)
 */
export const SHARED_REQUIRED_SUITE_TARGETS = [
  "test",
  "test-reader-facing",
  "a11y",
  "test-ci-contract",
  "test-verify-contract",
  "test-build-contract",
  "build",
  "test-integration",
  "budget",
  "component-coverage",
  "validate-data",
  "linkcheck",
] as const;

/** Targets that must stay out of the required `make ci` path. */
export const EXCLUDED_MAKE_CI_TARGETS = [
  "validate-pdf",
  "deploy",
  "build-search-index",
] as const;

/** Maintainer reproduction command for the full local required path. */
export const MAKE_CI_REPRODUCTION_COMMAND = "make ci";

/** Wave CI-1 required GitHub Actions job ids (including the aggregate gate). */
export const CI_REQUIRED_JOB_IDS = [
  "check",
  "unit-tests",
  "reader-facing",
  "a11y",
  "contracts",
  "component-coverage",
  "content",
  "static-export",
  "integration",
  "budget",
  "ci-gate",
] as const;

export type CiRequiredJobId = (typeof CI_REQUIRED_JOB_IDS)[number];

/**
 * One node in the required CI job graph: suite membership (`makeTargets`) and
 * ordering (`needs`). Peer jobs that may run in parallel have empty `needs`.
 * `ci-gate` is the aggregate check and has no make targets of its own.
 */
export type CiRequiredJobGraphNode = {
  readonly id: CiRequiredJobId;
  readonly makeTargets: readonly string[];
  readonly needs: readonly CiRequiredJobId[];
};

const CI_REQUIRED_CHILD_JOB_IDS = [
  "check",
  "unit-tests",
  "reader-facing",
  "a11y",
  "contracts",
  "component-coverage",
  "content",
  "static-export",
  "integration",
  "budget",
] as const satisfies readonly Exclude<CiRequiredJobId, "ci-gate">[];

/**
 * Required Actions job graph for Wave CI-1 (+ CI-2 artifact consumers).
 * Independent peers have no serial edges between them; `integration` and
 * `budget` require `static-export` (ordering) and consume the trusted
 * static-export Actions artifact (Wave CI-2 — not a second local export);
 * `ci-gate` needs every required child job.
 */
export const CI_REQUIRED_JOB_GRAPH = [
  { id: "check", makeTargets: ["check"], needs: [] },
  { id: "unit-tests", makeTargets: ["test"], needs: [] },
  { id: "reader-facing", makeTargets: ["test-reader-facing"], needs: [] },
  { id: "a11y", makeTargets: ["a11y"], needs: [] },
  {
    id: "contracts",
    makeTargets: [
      "test-ci-contract",
      "test-verify-contract",
      "test-build-contract",
    ],
    needs: [],
  },
  {
    id: "component-coverage",
    makeTargets: ["component-coverage"],
    needs: [],
  },
  {
    id: "content",
    makeTargets: ["validate-data", "linkcheck"],
    needs: [],
  },
  { id: "static-export", makeTargets: ["build"], needs: [] },
  {
    id: "integration",
    makeTargets: ["test-integration"],
    needs: ["static-export"],
  },
  { id: "budget", makeTargets: ["budget"], needs: ["static-export"] },
  {
    id: "ci-gate",
    makeTargets: [],
    needs: [...CI_REQUIRED_CHILD_JOB_IDS],
  },
] as const satisfies readonly CiRequiredJobGraphNode[];

/** Non-gate jobs that actually run make targets. */
export const CI_REQUIRED_SUITE_JOBS = CI_REQUIRED_JOB_GRAPH.filter(
  (job) => job.id !== "ci-gate",
);

/** Aggregate gate job id for branch-protection / maintainer guidance. */
export const CI_GATE_JOB_ID = "ci-gate" as const satisfies CiRequiredJobId;

/** Ordered edge endpoints that must exist in the required graph. */
export const CI_REQUIRED_ORDERING_EDGES = [
  { from: "static-export", to: "integration" },
  { from: "static-export", to: "budget" },
] as const satisfies readonly {
  readonly from: CiRequiredJobId;
  readonly to: CiRequiredJobId;
}[];

/**
 * Stable Actions artifact identity for the trusted static-export `out/` handoff
 * (Wave CI-2). Producer uploads after `make build`; consumers download and must
 * not run a second full export.
 */
export const CI_STATIC_EXPORT_ARTIFACT_NAME = "static-export-out" as const;

/** Workspace path the artifact restores for consumer gates. */
export const CI_STATIC_EXPORT_ARTIFACT_PATH = "out" as const;

/** Jobs that download and run gates against the trusted static-export artifact. */
export const CI_STATIC_EXPORT_ARTIFACT_CONSUMER_JOB_IDS = [
  "integration",
  "budget",
] as const satisfies readonly CiRequiredJobId[];

/**
 * Make targets that constitute a full static-export rebuild. Consumer jobs must
 * not invoke these after Wave CI-2 (they consume the Actions artifact instead).
 */
export const CI_STATIC_EXPORT_FORBIDDEN_CONSUMER_MAKE_TARGETS = [
  "build",
  "build-export",
] as const;

/**
 * Wave CI-2 trusted static-export artifact handoff contract.
 * Distinct from `needs: static-export` ordering: consumers depend on the
 * producer job *and* must reuse its uploaded `out/`, not rebuild locally.
 */
export const CI_STATIC_EXPORT_ARTIFACT_HANDOFF = {
  artifactName: CI_STATIC_EXPORT_ARTIFACT_NAME,
  path: CI_STATIC_EXPORT_ARTIFACT_PATH,
  producerJobId: "static-export",
  consumerJobIds: CI_STATIC_EXPORT_ARTIFACT_CONSUMER_JOB_IDS,
  forbiddenConsumerMakeTargets:
    CI_STATIC_EXPORT_FORBIDDEN_CONSUMER_MAKE_TARGETS,
} as const;

/** Make targets owned by the job graph (excludes per-job `setup`). */
export function ciRequiredJobGraphMakeTargets(): readonly string[] {
  return CI_REQUIRED_SUITE_JOBS.flatMap((job) => [...job.makeTargets]);
}

export function getCiRequiredJob(
  jobId: CiRequiredJobId,
): CiRequiredJobGraphNode {
  const job = CI_REQUIRED_JOB_GRAPH.find((node) => node.id === jobId);
  if (!job) {
    throw new Error(`Unknown CI required job id: ${jobId}`);
  }
  return job;
}

export function ciRequiredJobNeeds(
  jobId: CiRequiredJobId,
): readonly CiRequiredJobId[] {
  return getCiRequiredJob(jobId).needs;
}

/**
 * Ordering-only: true when the job has a `needs` edge on `static-export`.
 * Does not imply the job rebuilds `out/` locally.
 */
export function ciJobDependsOnStaticExportJob(jobId: CiRequiredJobId): boolean {
  return ciRequiredJobNeeds(jobId).includes("static-export");
}

/**
 * Artifact consumption: true when the job is contracted to download and use the
 * trusted static-export Actions artifact (Wave CI-2).
 */
export function ciJobConsumesStaticExportArtifact(
  jobId: CiRequiredJobId,
): boolean {
  return (
    CI_STATIC_EXPORT_ARTIFACT_HANDOFF.consumerJobIds as readonly string[]
  ).includes(jobId);
}

/**
 * True when the job is forbidden from running a second full static export.
 * Wave CI-2: every artifact consumer must return true; peer/producer jobs that
 * do not consume the artifact return false (they either produce via `build` or
 * never touch `out/`).
 */
export function ciJobForbidsLocalStaticExportRebuild(
  jobId: CiRequiredJobId,
): boolean {
  return ciJobConsumesStaticExportArtifact(jobId);
}

/**
 * Distinguishes CI-1-style “depends on static-export, rebuild out/ locally”
 * from CI-2 “depends on static-export, consume the trusted artifact”.
 * Returns true only for the forbidden rebuild-locally posture.
 */
export function ciJobMustRebuildStaticExportLocally(
  jobId: CiRequiredJobId,
): boolean {
  return (
    ciJobDependsOnStaticExportJob(jobId) &&
    !ciJobConsumesStaticExportArtifact(jobId)
  );
}
