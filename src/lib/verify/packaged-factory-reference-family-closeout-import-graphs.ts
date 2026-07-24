/**
 * Batch 5 packaged-factory reference family closeout — story 004 proofs.
 *
 * Tip-owned evidence that route-local import graphs still hold on the
 * converged tip:
 * - each standard child MDX map reaches only its own packaged recording
 * - parent index cannot reach factory-replay / visualizer / recording modules
 * - landing Youi excludes non-goal recordings, index corpus, raw source
 *   artifacts, and the packaged-factory generator
 * - isolation detectors retain a positive-control / polluted-fixture path
 *
 * Composes Batch 2–4 import-graph collectors and classifiers. Does not
 * redesign ownership surfaces or regenerate the corpus.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  type ChildRecordingImportGraphHit,
  collectChildRecordingImportGraphInputs,
  findForeignPackagedRecordingHits,
  graphIncludesOwnedPackagedRecording,
  ownedPackagedFactoryRecordingFilename,
} from "@/content/docs/references/packaged-factories-index/child-recording-import-graph";
import {
  collectParentImportGraphInputs,
  findForbiddenParentImportGraphHits,
  type ParentImportGraphForbiddenHit,
} from "@/content/docs/references/packaged-factories-index/parent-import-graph";
import {
  collectYouiLandingImportGraphInputs,
  findForbiddenYouiLandingImportGraphHits,
  YOUI_LANDING_ALLOWED_GOAL_RECORDING_BASENAME,
  type YouiLandingImportGraphForbiddenHit,
} from "@/features/landing-page/youi-landing-import-graph";
import {
  DEFAULT_EXPORT_OUT_DIR,
  resolveExportHtmlFilePath,
} from "@/lib/build/export-out-directory";
import { getProjectRoot } from "@/lib/content/content-paths";
import {
  PACKAGED_FACTORY_RECORDING_SLUGS,
  type PackagedFactoryRecordingSlug,
} from "@/lib/packaged-factory-generated-source-corpus/recording-samples-model";

/** Goal recording id observed in exported goal-child / home payloads. */
const CLOSEOUT_EXPORT_GOAL_RECORDING_ID = "packaged-goal-sample" as const;

/** Standard replay children that own a route-local recording on tip. */
export const PACKAGED_FACTORY_CLOSEOUT_STANDARD_CHILD_SLUGS =
  PACKAGED_FACTORY_RECORDING_SLUGS;

export type PackagedFactoryCloseoutChildImportGraphCase = {
  ownedSlug: PackagedFactoryRecordingSlug;
  /** Repo-relative path under `packaged-factories-index/`. */
  relativeEntrypoint: `${PackagedFactoryRecordingSlug}/page-mdx-components.tsx`;
};

/**
 * Ownership entrypoints for the six standard children — each child's page MDX
 * map is the Bun.build root for recording-isolation proofs.
 */
export const PACKAGED_FACTORY_CLOSEOUT_CHILD_IMPORT_GRAPH_CASES: readonly PackagedFactoryCloseoutChildImportGraphCase[] =
  PACKAGED_FACTORY_CLOSEOUT_STANDARD_CHILD_SLUGS.map((ownedSlug) => ({
    ownedSlug,
    relativeEntrypoint: `${ownedSlug}/page-mdx-components.tsx` as const,
  }));

/** Parent index ownership surfaces that must stay replay-free. */
export const PACKAGED_FACTORY_CLOSEOUT_PARENT_OWNERSHIP_ENTRYPOINTS = [
  "page-mdx-components.tsx",
  "PackagedFactoriesIndex.tsx",
] as const;

/** Landing Youi client ownership surfaces that may import only the goal recording. */
export const PACKAGED_FACTORY_CLOSEOUT_YOUI_OWNERSHIP_ENTRYPOINTS = [
  "YouiCompactGoalReplayNearViewport.tsx",
  "YouiCompactGoalReplayIsland.tsx",
] as const;

export type PackagedFactoryCloseoutChildImportGraphEvidence = {
  ownedSlug: PackagedFactoryRecordingSlug;
  ownedRecordingFilename: ReturnType<
    typeof ownedPackagedFactoryRecordingFilename
  >;
  includesOwnedRecording: true;
  foreignHits: readonly ChildRecordingImportGraphHit[];
  inputPathCount: number;
};

export type PackagedFactoryCloseoutParentImportGraphEvidence = {
  entrypoint: (typeof PACKAGED_FACTORY_CLOSEOUT_PARENT_OWNERSHIP_ENTRYPOINTS)[number];
  includesGeneratedIndex: true;
  forbiddenHits: readonly ParentImportGraphForbiddenHit[];
  inputPathCount: number;
};

export type PackagedFactoryCloseoutYouiImportGraphEvidence = {
  entrypoint: (typeof PACKAGED_FACTORY_CLOSEOUT_YOUI_OWNERSHIP_ENTRYPOINTS)[number];
  includesGoalRecording: true;
  includesFactoryReplay: true;
  forbiddenHits: readonly YouiLandingImportGraphForbiddenHit[];
  inputPathCount: number;
};

/** Foreign packaged-recording filenames that must not appear in goal/home payloads. */
export const PACKAGED_FACTORY_CLOSEOUT_FOREIGN_RECORDING_FILENAMES = [
  "subagent.factory-recording.v1.json",
  "fusion.factory-recording.v1.json",
  "review.factory-recording.v1.json",
  "quorum.factory-recording.v1.json",
  "tts.factory-recording.v1.json",
] as const;

/** Home/index corpus markers that must not leak into the landing export payload. */
export const PACKAGED_FACTORY_CLOSEOUT_HOME_FORBIDDEN_PAYLOAD_MARKERS = [
  ...PACKAGED_FACTORY_CLOSEOUT_FOREIGN_RECORDING_FILENAMES,
  "deep-research.source.json",
  "generate-packaged-factories-index",
  "generated/index.json",
] as const;

/** Parent index export must stay free of interactive replay markers. */
export const PACKAGED_FACTORY_CLOSEOUT_PARENT_FORBIDDEN_PAYLOAD_MARKERS = [
  "data-factory-replay",
  "data-factory-recording",
  "src/features/factory-replay/",
] as const;

export type PackagedFactoryCloseoutExportPayloadRouteId =
  | "goal-child"
  | "parent-index"
  | "home-youi";

export type PackagedFactoryCloseoutExportPayloadEvidence = {
  routeId: PackagedFactoryCloseoutExportPayloadRouteId;
  routePath: string;
  htmlPath: string;
  requiredMarkersPresent: readonly string[];
  forbiddenMarkersAbsent: readonly string[];
};

export type PackagedFactoryCloseoutPositiveControlEvidence = {
  parentDetectorObservesReplay: true;
  youiPollutedFixtureObservesForbidden: true;
  youiPollutedMarkers: readonly YouiLandingImportGraphForbiddenHit["marker"][];
};

export type PackagedFactoryCloseoutImportGraphEvidence = {
  children: readonly PackagedFactoryCloseoutChildImportGraphEvidence[];
  parent: readonly PackagedFactoryCloseoutParentImportGraphEvidence[];
  youi: readonly PackagedFactoryCloseoutYouiImportGraphEvidence[];
  positiveControl: PackagedFactoryCloseoutPositiveControlEvidence;
};

export class PackagedFactoryCloseoutImportGraphError extends Error {
  readonly code:
    | "collect-failed"
    | "missing-owned-recording"
    | "foreign-recording"
    | "parent-forbidden"
    | "youi-forbidden"
    | "missing-goal-recording"
    | "missing-factory-replay"
    | "missing-generated-index"
    | "positive-control-failed"
    | "export-payload-leak"
    | "export-payload-missing";

  constructor(
    code: PackagedFactoryCloseoutImportGraphError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoryCloseoutImportGraphError";
    this.code = code;
  }
}

function packagedFactoriesIndexRoot(projectRoot = getProjectRoot()): string {
  return resolve(
    projectRoot,
    "src/content/docs/references/packaged-factories-index",
  );
}

function landingYouiComponentsRoot(projectRoot = getProjectRoot()): string {
  return resolve(projectRoot, "src/features/landing-page/components");
}

function formatCollectFailures(failureMessages: readonly string[]): string {
  return failureMessages.length > 0
    ? failureMessages.join("; ")
    : "unknown collect failure";
}

/**
 * Prove one standard child MDX map reaches only its owned packaged recording.
 */
export async function provePackagedFactoryCloseoutChildImportGraph(
  ownershipCase: PackagedFactoryCloseoutChildImportGraphCase,
  options?: { projectRoot?: string },
): Promise<PackagedFactoryCloseoutChildImportGraphEvidence> {
  const entrypoint = resolve(
    packagedFactoriesIndexRoot(options?.projectRoot),
    ownershipCase.relativeEntrypoint,
  );
  const collected = await collectChildRecordingImportGraphInputs({
    entrypoint,
  });

  if (!collected.success) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "collect-failed",
      `Child import-graph collect failed for ${ownershipCase.ownedSlug}: ${formatCollectFailures(collected.failureMessages)}`,
    );
  }

  if (
    !graphIncludesOwnedPackagedRecording(
      collected.inputPaths,
      ownershipCase.ownedSlug,
    )
  ) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "missing-owned-recording",
      `Expected ${ownershipCase.ownedSlug} child graph to include ${ownedPackagedFactoryRecordingFilename(ownershipCase.ownedSlug)}.`,
    );
  }

  const foreignHits = findForeignPackagedRecordingHits(
    collected.inputPaths,
    ownershipCase.ownedSlug,
  );
  if (foreignHits.length > 0) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "foreign-recording",
      `Child ${ownershipCase.ownedSlug} graph reached foreign recordings: ${foreignHits
        .map((hit) => hit.recordingFilename)
        .join(", ")}.`,
    );
  }

  return {
    ownedSlug: ownershipCase.ownedSlug,
    ownedRecordingFilename: ownedPackagedFactoryRecordingFilename(
      ownershipCase.ownedSlug,
    ),
    includesOwnedRecording: true,
    foreignHits,
    inputPathCount: collected.inputPaths.length,
  };
}

/**
 * Prove every standard child ownership entry reaches only its own recording.
 */
export async function provePackagedFactoryCloseoutStandardChildImportGraphs(options?: {
  projectRoot?: string;
}): Promise<readonly PackagedFactoryCloseoutChildImportGraphEvidence[]> {
  const evidence: PackagedFactoryCloseoutChildImportGraphEvidence[] = [];
  for (const ownershipCase of PACKAGED_FACTORY_CLOSEOUT_CHILD_IMPORT_GRAPH_CASES) {
    evidence.push(
      await provePackagedFactoryCloseoutChildImportGraph(
        ownershipCase,
        options,
      ),
    );
  }
  return evidence;
}

/**
 * Prove one parent index ownership entrypoint stays free of replay / recording
 * modules and still reaches the generated index corpus.
 */
export async function provePackagedFactoryCloseoutParentImportGraph(
  relativeEntrypoint: (typeof PACKAGED_FACTORY_CLOSEOUT_PARENT_OWNERSHIP_ENTRYPOINTS)[number],
  options?: { projectRoot?: string },
): Promise<PackagedFactoryCloseoutParentImportGraphEvidence> {
  const entrypoint = resolve(
    packagedFactoriesIndexRoot(options?.projectRoot),
    relativeEntrypoint,
  );
  const collected = await collectParentImportGraphInputs({ entrypoint });

  if (!collected.success) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "collect-failed",
      `Parent import-graph collect failed for ${relativeEntrypoint}: ${formatCollectFailures(collected.failureMessages)}`,
    );
  }

  if (
    !collected.inputPaths.some((path) =>
      path.replaceAll("\\", "/").includes("generated/index.json"),
    )
  ) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "missing-generated-index",
      `Expected parent ${relativeEntrypoint} graph to include generated/index.json.`,
    );
  }

  const forbiddenHits = findForbiddenParentImportGraphHits(
    collected.inputPaths,
  );
  if (forbiddenHits.length > 0) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "parent-forbidden",
      `Parent ${relativeEntrypoint} graph reached forbidden modules: ${forbiddenHits
        .map((hit) => hit.marker)
        .join(", ")}.`,
    );
  }

  return {
    entrypoint: relativeEntrypoint,
    includesGeneratedIndex: true,
    forbiddenHits,
    inputPathCount: collected.inputPaths.length,
  };
}

/**
 * Prove parent index ownership surfaces cannot reach replay/visualizer modules.
 */
export async function provePackagedFactoryCloseoutParentImportGraphs(options?: {
  projectRoot?: string;
}): Promise<readonly PackagedFactoryCloseoutParentImportGraphEvidence[]> {
  const evidence: PackagedFactoryCloseoutParentImportGraphEvidence[] = [];
  for (const relativeEntrypoint of PACKAGED_FACTORY_CLOSEOUT_PARENT_OWNERSHIP_ENTRYPOINTS) {
    evidence.push(
      await provePackagedFactoryCloseoutParentImportGraph(
        relativeEntrypoint,
        options,
      ),
    );
  }
  return evidence;
}

/**
 * Prove one landing Youi client entrypoint allows the goal recording + shared
 * factory-replay edges and excludes forbidden corpus/generator modules.
 */
export async function provePackagedFactoryCloseoutYouiImportGraph(
  relativeEntrypoint: (typeof PACKAGED_FACTORY_CLOSEOUT_YOUI_OWNERSHIP_ENTRYPOINTS)[number],
  options?: { projectRoot?: string },
): Promise<PackagedFactoryCloseoutYouiImportGraphEvidence> {
  const entrypoint = resolve(
    landingYouiComponentsRoot(options?.projectRoot),
    relativeEntrypoint,
  );
  const collected = await collectYouiLandingImportGraphInputs({ entrypoint });

  if (!collected.success) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "collect-failed",
      `Youi import-graph collect failed for ${relativeEntrypoint}: ${formatCollectFailures(collected.failureMessages)}`,
    );
  }

  if (
    !collected.inputPaths.some((path) =>
      path
        .replaceAll("\\", "/")
        .endsWith(YOUI_LANDING_ALLOWED_GOAL_RECORDING_BASENAME),
    )
  ) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "missing-goal-recording",
      `Expected Youi ${relativeEntrypoint} graph to include ${YOUI_LANDING_ALLOWED_GOAL_RECORDING_BASENAME}.`,
    );
  }

  if (
    !collected.inputPaths.some((path) =>
      path.replaceAll("\\", "/").includes("src/features/factory-replay/"),
    )
  ) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "missing-factory-replay",
      `Expected Youi ${relativeEntrypoint} graph to include src/features/factory-replay/.`,
    );
  }

  const forbiddenHits = findForbiddenYouiLandingImportGraphHits(
    collected.inputPaths,
  );
  if (forbiddenHits.length > 0) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "youi-forbidden",
      `Youi ${relativeEntrypoint} graph reached forbidden modules: ${forbiddenHits
        .map((hit) => hit.marker)
        .join(", ")}.`,
    );
  }

  return {
    entrypoint: relativeEntrypoint,
    includesGoalRecording: true,
    includesFactoryReplay: true,
    forbiddenHits,
    inputPathCount: collected.inputPaths.length,
  };
}

/**
 * Prove landing Youi near-viewport + island ownership graphs stay isolated.
 */
export async function provePackagedFactoryCloseoutYouiImportGraphs(options?: {
  projectRoot?: string;
}): Promise<readonly PackagedFactoryCloseoutYouiImportGraphEvidence[]> {
  const evidence: PackagedFactoryCloseoutYouiImportGraphEvidence[] = [];
  for (const relativeEntrypoint of PACKAGED_FACTORY_CLOSEOUT_YOUI_OWNERSHIP_ENTRYPOINTS) {
    evidence.push(
      await provePackagedFactoryCloseoutYouiImportGraph(
        relativeEntrypoint,
        options,
      ),
    );
  }
  return evidence;
}

/**
 * Prove isolation detectors are not no-ops: parent classifier observes shared
 * factory-replay, and the Youi polluted fixture still surfaces forbidden markers.
 */
export async function provePackagedFactoryCloseoutImportGraphPositiveControls(options?: {
  projectRoot?: string;
}): Promise<PackagedFactoryCloseoutPositiveControlEvidence> {
  const projectRoot = options?.projectRoot ?? getProjectRoot();

  const parentPositive = await collectParentImportGraphInputs({
    entrypoint: resolve(projectRoot, "src/features/factory-replay/index.ts"),
  });
  if (!parentPositive.success) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "positive-control-failed",
      `Parent positive-control collect failed: ${formatCollectFailures(parentPositive.failureMessages)}`,
    );
  }
  const parentHits = findForbiddenParentImportGraphHits(
    parentPositive.inputPaths,
  );
  if (
    !parentHits.some(
      (hit) =>
        hit.marker === "@you-agent-factory/factory-replay" ||
        hit.marker === "src/features/factory-replay/",
    )
  ) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "positive-control-failed",
      "Parent forbidden detector did not observe factory-replay when collecting from src/features/factory-replay/index.ts.",
    );
  }

  const youiPolluted = await collectYouiLandingImportGraphInputs({
    entrypoint: resolve(
      projectRoot,
      "src/features/landing-page/youi-landing-import-graph.polluted-fixture.ts",
    ),
  });
  if (!youiPolluted.success) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "positive-control-failed",
      `Youi polluted-fixture collect failed: ${formatCollectFailures(youiPolluted.failureMessages)}`,
    );
  }
  const youiHits = findForbiddenYouiLandingImportGraphHits(
    youiPolluted.inputPaths,
  );
  const youiMarkers = [
    ...new Set(youiHits.map((hit) => hit.marker)),
  ] as YouiLandingImportGraphForbiddenHit["marker"][];
  const requiredYouiMarkers = [
    "non-goal.factory-recording.v1.json",
    "generated/index.json",
    ".source.json",
  ] as const;
  for (const marker of requiredYouiMarkers) {
    if (!youiMarkers.includes(marker)) {
      throw new PackagedFactoryCloseoutImportGraphError(
        "positive-control-failed",
        `Youi polluted-fixture detector missed required marker ${marker}.`,
      );
    }
  }

  return {
    parentDetectorObservesReplay: true,
    youiPollutedFixtureObservesForbidden: true,
    youiPollutedMarkers: youiMarkers,
  };
}

/**
 * Collects exported HTML plus optionally linked `/_next/static/chunks/*.js`
 * bodies for a route. This is the observable payload readers download — not a
 * Bun.build metafile inventory.
 *
 * Use `includeLinkedChunks: false` for surfaces (parent index) that must stay
 * replay-free in static HTML but may preload shared site chunks that other
 * routes use for factory-replay.
 */
export function collectPackagedFactoryCloseoutExportRoutePayload(options: {
  cwd?: string;
  outDir?: string;
  routePath: string;
  includeLinkedChunks?: boolean;
}): { htmlPath: string; payload: string } {
  const cwd = options.cwd ?? getProjectRoot();
  const outDir = options.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const includeLinkedChunks = options.includeLinkedChunks !== false;
  const htmlPath = resolveExportHtmlFilePath(outDir, options.routePath, cwd);
  if (!existsSync(htmlPath)) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "export-payload-missing",
      `Missing export HTML for ${options.routePath} at ${htmlPath}`,
    );
  }

  const html = readFileSync(htmlPath, "utf8");
  if (!includeLinkedChunks) {
    return { htmlPath, payload: html };
  }

  const absoluteOutDir = resolve(cwd, outDir);
  const scriptSrcs = [
    ...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g),
  ].map((match) => match[1]);

  const chunkBodies: string[] = [];
  for (const src of scriptSrcs) {
    const chunkPath = join(absoluteOutDir, src.slice(1));
    if (!existsSync(chunkPath)) {
      continue;
    }
    chunkBodies.push(readFileSync(chunkPath, "utf8"));
  }

  return {
    htmlPath,
    payload: [html, ...chunkBodies].join("\n"),
  };
}

function assertPayloadMarkers(options: {
  routeId: PackagedFactoryCloseoutExportPayloadRouteId;
  routePath: string;
  htmlPath: string;
  payload: string;
  required: readonly string[];
  forbidden: readonly string[];
}): PackagedFactoryCloseoutExportPayloadEvidence {
  const missingRequired = options.required.filter(
    (marker) => !options.payload.includes(marker),
  );
  if (missingRequired.length > 0) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "export-payload-missing",
      `${options.routeId} export payload missing required marker(s): ${missingRequired.join(", ")}`,
    );
  }

  const leaked = options.forbidden.filter((marker) =>
    options.payload.includes(marker),
  );
  if (leaked.length > 0) {
    throw new PackagedFactoryCloseoutImportGraphError(
      "export-payload-leak",
      `${options.routeId} export payload leaked forbidden marker(s): ${leaked.join(", ")}`,
    );
  }

  return {
    routeId: options.routeId,
    routePath: options.routePath,
    htmlPath: options.htmlPath,
    requiredMarkersPresent: options.required,
    forbiddenMarkersAbsent: options.forbidden,
  };
}

/**
 * Behavioral export-payload exclusion proof for representative family routes.
 * Observes shipped HTML + linked client chunks under trusted `out/`.
 */
export function provePackagedFactoryCloseoutExportPayloadExclusions(options?: {
  cwd?: string;
  outDir?: string;
}): readonly PackagedFactoryCloseoutExportPayloadEvidence[] {
  const cwd = options?.cwd ?? getProjectRoot();
  const outDir = options?.outDir ?? DEFAULT_EXPORT_OUT_DIR;

  const goal = collectPackagedFactoryCloseoutExportRoutePayload({
    cwd,
    outDir,
    routePath: "/docs/references/packaged-factories-index/goal",
  });
  const parent = collectPackagedFactoryCloseoutExportRoutePayload({
    cwd,
    outDir,
    routePath: "/docs/references/packaged-factories-index",
    // Parent must stay replay-free in static HTML; shared site chunks may still
    // carry factory-replay for other routes and are not a parent-page leak.
    includeLinkedChunks: false,
  });
  const home = collectPackagedFactoryCloseoutExportRoutePayload({
    cwd,
    outDir,
    routePath: "/",
  });

  return [
    assertPayloadMarkers({
      routeId: "goal-child",
      routePath: "/docs/references/packaged-factories-index/goal",
      htmlPath: goal.htmlPath,
      payload: goal.payload,
      required: [
        CLOSEOUT_EXPORT_GOAL_RECORDING_ID,
        'data-factory-replay-mode="full"',
      ],
      forbidden: PACKAGED_FACTORY_CLOSEOUT_FOREIGN_RECORDING_FILENAMES,
    }),
    assertPayloadMarkers({
      routeId: "parent-index",
      routePath: "/docs/references/packaged-factories-index",
      htmlPath: parent.htmlPath,
      payload: parent.payload,
      required: [
        "data-packaged-factories-index",
        "data-packaged-factory-definition-code",
      ],
      forbidden: PACKAGED_FACTORY_CLOSEOUT_PARENT_FORBIDDEN_PAYLOAD_MARKERS,
    }),
    assertPayloadMarkers({
      routeId: "home-youi",
      routePath: "/",
      htmlPath: home.htmlPath,
      payload: home.payload,
      required: ["data-youi-showcase", CLOSEOUT_EXPORT_GOAL_RECORDING_ID],
      forbidden: PACKAGED_FACTORY_CLOSEOUT_HOME_FORBIDDEN_PAYLOAD_MARKERS,
    }),
  ];
}

/**
 * Tip-owned closeout proof for route-local import graphs and home/index exclusions.
 */
export async function provePackagedFactoryReferenceFamilyCloseoutImportGraphs(options?: {
  projectRoot?: string;
}): Promise<PackagedFactoryCloseoutImportGraphEvidence> {
  const [children, parent, youi, positiveControl] = await Promise.all([
    provePackagedFactoryCloseoutStandardChildImportGraphs(options),
    provePackagedFactoryCloseoutParentImportGraphs(options),
    provePackagedFactoryCloseoutYouiImportGraphs(options),
    provePackagedFactoryCloseoutImportGraphPositiveControls(options),
  ]);

  return { children, parent, youi, positiveControl };
}
