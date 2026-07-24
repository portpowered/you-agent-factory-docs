/**
 * Batch 5 packaged-factory reference family closeout — story 002 proofs.
 *
 * Tip-owned evidence that:
 * - companion / JavaScript-only display paths publish exact acquired UTF-8 text
 *   with no derived AST / stages / workers / call-graph interpretation
 * - the deep-research child stays purpose + minimal usage + two required links
 * - the child never mounts replay, visualizer playback, or unabridged raw-source
 *   panels (those stay on the parent-index contract)
 *
 * Composes Batch 2 companion acquisition and Batch 4 deep-research page load
 * surfaces. Does not regenerate the corpus or redesign child/index ownership.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type PackagedFactoryIndexCorpusLike,
  projectPackagedFactoryIndexEntry,
} from "@/content/docs/references/packaged-factories-index/project-packaged-factories-index";
import { getProjectRoot } from "@/lib/content/content-paths";
import { acquireDeepResearchCompanionSource } from "@/lib/packaged-factory-generated-source-corpus/acquire-companion-source";
import {
  DEEP_RESEARCH_CHILD_SLUG,
  DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
  PACKAGED_FACTORY_COMPANION_SOURCE_KIND,
  type PackagedFactoryCompanionSource,
} from "@/lib/packaged-factory-generated-source-corpus/companion-source-model";
import { getPackagedFactoriesIndexGeneratedRoot } from "@/lib/packaged-factory-generated-source-corpus/generate-packaged-factories-index";
import { PACKAGED_FACTORIES_INDEX_COMPANION_ARTIFACT_PATH } from "@/lib/packaged-factory-generated-source-corpus/generated-artifacts-model";
import { hashPackagedFactorySourceText } from "@/lib/packaged-factory-generated-source-corpus/index-corpus-model";
import { PACKAGED_FACTORY_V002_VERSION } from "@/lib/packaged-factory-v002/five-package-pins";

/** Keys allowed on the companion source artifact — no derived graph fields. */
export const PACKAGED_FACTORY_CLOSEOUT_COMPANION_ALLOWED_KEYS = [
  "formatVersion",
  "sourceKind",
  "childSlug",
  "canonicalName",
  "packageVersion",
  "relativePath",
  "sourceText",
  "sourceSha256",
] as const;

/** DOM selectors that would mean the deep-research child grew beyond minimal. */
export const PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_FORBIDDEN_SELECTORS = [
  "[data-factory-replay]",
  "[data-factory-replay-mode]",
  "[data-factory-visualizer]",
  "[data-factory-recording]",
  "[data-packaged-factory-definition]",
  "[data-packaged-factory-definition-code]",
  "[data-packaged-factory-source-kind]",
  "[data-schema-field-expand]",
  "[data-schema-status]",
  "[data-schema-definition-embed]",
] as const;

export const PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS = {
  javascriptRuntime: "/docs/references/javascript-runtime",
  dynamicWorkflows: "/docs/factories/dynamic-workflows",
} as const;

export type PackagedFactoryCloseoutCompanionEvidence = {
  relativePath: typeof DEEP_RESEARCH_COMPANION_RELATIVE_PATH;
  sourceKind: typeof PACKAGED_FACTORY_COMPANION_SOURCE_KIND;
  sourceSha256: string;
  sourceTextLength: number;
  committedMatchesLive: true;
  indexCompanionMatchesArtifact: true;
};

export type PackagedFactoryCloseoutJavascriptOnlyEvidence = {
  childSlug: string;
  definitionText: string;
  kind: "javascript-only";
  sourceKind: "javascript";
};

export type PackagedFactoryCloseoutDeepResearchChildEvidence = {
  pageUrl: "/docs/references/packaged-factories-index/deep-research";
  purposeBody: string;
  usageExample: string;
  javascriptRuntimeHref: string;
  dynamicWorkflowsHref: string;
  forbiddenSelectorHits: readonly string[];
};

export class PackagedFactoryCloseoutDeepResearchError extends Error {
  readonly code:
    | "companion-mismatch"
    | "companion-derived-fields"
    | "javascript-display-mismatch"
    | "deep-research-child-shape"
    | "deep-research-forbidden-surface";

  constructor(
    code: PackagedFactoryCloseoutDeepResearchError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoryCloseoutDeepResearchError";
    this.code = code;
  }
}

type CompanionArtifactLike = {
  sourceKind?: string;
  childSlug?: string;
  relativePath?: string;
  sourceText?: string;
  sourceSha256?: string;
  packageVersion?: string;
  canonicalName?: string;
  formatVersion?: string;
};

/**
 * Fail closed when a companion artifact carries derived interpretation fields
 * or omits the exact raw sourceText / hash contract.
 */
export function assertPackagedFactoryCloseoutCompanionHasNoDerivedFields(
  companion: CompanionArtifactLike,
): void {
  const keys = Object.keys(companion).sort();
  const allowed = [...PACKAGED_FACTORY_CLOSEOUT_COMPANION_ALLOWED_KEYS].sort();
  if (keys.join("\0") !== allowed.join("\0")) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "companion-derived-fields",
      `Companion artifact keys ${JSON.stringify(keys)} diverge from allowed metadata ${JSON.stringify(allowed)}.`,
    );
  }

  for (const forbidden of [
    "stages",
    "workers",
    "callGraph",
    "ast",
    "summary",
    "interpretation",
    "behavioralSummary",
  ] as const) {
    if (Object.hasOwn(companion, forbidden)) {
      throw new PackagedFactoryCloseoutDeepResearchError(
        "companion-derived-fields",
        `Companion artifact must not include derived field "${forbidden}".`,
      );
    }
  }

  if (
    typeof companion.sourceText !== "string" ||
    companion.sourceText.trim().length === 0
  ) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "companion-mismatch",
      "Companion artifact is missing exact non-empty sourceText.",
    );
  }

  const expectedHash = hashPackagedFactorySourceText(companion.sourceText);
  if (companion.sourceSha256 !== expectedHash) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "companion-mismatch",
      "Companion sourceSha256 does not match SHA-256 of sourceText UTF-8 bytes.",
    );
  }
}

/**
 * Fail closed unless projected JavaScript-only definition text equals the
 * acquired source bytes exactly (pass-through, no rewriting).
 */
export function assertPackagedFactoryCloseoutJavascriptOnlyExactDisplay(options: {
  javascriptSourceText: string;
  childSlug?: string;
  canonicalName?: string;
  sourceRelativePath?: string;
}): PackagedFactoryCloseoutJavascriptOnlyEvidence {
  const childSlug = options.childSlug ?? "js-only-closeout";
  const projected = projectPackagedFactoryIndexEntry({
    canonicalName: options.canonicalName ?? `@you/${childSlug}`,
    packagedDescription: null,
    childSlug,
    packageVersion: PACKAGED_FACTORY_V002_VERSION,
    sourceRelativePath:
      options.sourceRelativePath ?? `factories/${childSlug}/workflow.js`,
    javascriptSourceText: options.javascriptSourceText,
  });

  if (projected.kind !== "javascript-only") {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "javascript-display-mismatch",
      `Expected javascript-only projection; got ${projected.kind}.`,
    );
  }
  if (projected.definitionText !== options.javascriptSourceText) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "javascript-display-mismatch",
      "JavaScript-only definitionText diverged from acquired source text.",
    );
  }

  return {
    childSlug,
    definitionText: projected.definitionText,
    kind: "javascript-only",
    sourceKind: "javascript",
  };
}

/**
 * Load committed deep-research.source.json from the generated tree.
 */
export function loadCommittedPackagedFactoryCompanionSource(
  committedRoot: string = getPackagedFactoriesIndexGeneratedRoot(
    getProjectRoot(),
  ),
): PackagedFactoryCompanionSource {
  const contents = readFileSync(
    join(committedRoot, PACKAGED_FACTORIES_INDEX_COMPANION_ARTIFACT_PATH),
    "utf8",
  );
  return JSON.parse(contents) as PackagedFactoryCompanionSource;
}

/**
 * Load companionSource from committed generated/index.json.
 */
export function loadCommittedPackagedFactoriesIndexCompanionSource(
  committedRoot: string = getPackagedFactoriesIndexGeneratedRoot(
    getProjectRoot(),
  ),
): PackagedFactoryCompanionSource {
  const contents = readFileSync(join(committedRoot, "index.json"), "utf8");
  const index = JSON.parse(contents) as {
    companionSource?: PackagedFactoryCompanionSource;
  };
  if (index.companionSource === undefined) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "companion-mismatch",
      "Committed generated/index.json is missing companionSource.",
    );
  }
  return index.companionSource;
}

/**
 * Prove tip companion artifacts match live package acquisition byte-for-byte
 * and carry only straightforward metadata (no derived parsing).
 */
export function provePackagedFactoryCloseoutExactCompanionJavascript(options?: {
  projectRoot?: string;
  consumerDir?: string;
}): PackagedFactoryCloseoutCompanionEvidence {
  const projectRoot = options?.projectRoot ?? getProjectRoot();
  const consumerDir = options?.consumerDir ?? projectRoot;
  const committedRoot = getPackagedFactoriesIndexGeneratedRoot(projectRoot);

  const artifact = loadCommittedPackagedFactoryCompanionSource(committedRoot);
  const indexCompanion =
    loadCommittedPackagedFactoriesIndexCompanionSource(committedRoot);

  assertPackagedFactoryCloseoutCompanionHasNoDerivedFields(artifact);
  assertPackagedFactoryCloseoutCompanionHasNoDerivedFields(indexCompanion);

  if (artifact.sourceText !== indexCompanion.sourceText) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "companion-mismatch",
      "index.json companionSource.sourceText diverges from deep-research.source.json.",
    );
  }
  if (artifact.sourceSha256 !== indexCompanion.sourceSha256) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "companion-mismatch",
      "index.json companionSource.sourceSha256 diverges from deep-research.source.json.",
    );
  }
  if (artifact.relativePath !== DEEP_RESEARCH_COMPANION_RELATIVE_PATH) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "companion-mismatch",
      `Companion relativePath ${artifact.relativePath} !== ${DEEP_RESEARCH_COMPANION_RELATIVE_PATH}.`,
    );
  }
  if (artifact.childSlug !== DEEP_RESEARCH_CHILD_SLUG) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "companion-mismatch",
      `Companion childSlug ${artifact.childSlug} !== ${DEEP_RESEARCH_CHILD_SLUG}.`,
    );
  }
  if (artifact.sourceKind !== PACKAGED_FACTORY_COMPANION_SOURCE_KIND) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "companion-mismatch",
      `Companion sourceKind ${artifact.sourceKind} !== ${PACKAGED_FACTORY_COMPANION_SOURCE_KIND}.`,
    );
  }
  if (artifact.packageVersion !== PACKAGED_FACTORY_V002_VERSION) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "companion-mismatch",
      `Companion packageVersion ${artifact.packageVersion} !== ${PACKAGED_FACTORY_V002_VERSION}.`,
    );
  }

  const live = acquireDeepResearchCompanionSource({ consumerDir });
  if (live.companion.sourceText !== artifact.sourceText) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "companion-mismatch",
      "Live acquired companion JavaScript diverges from committed deep-research.source.json.",
    );
  }
  if (live.companion.sourceSha256 !== artifact.sourceSha256) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "companion-mismatch",
      "Live acquired companion SHA-256 diverges from committed deep-research.source.json.",
    );
  }

  return {
    relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
    sourceKind: PACKAGED_FACTORY_COMPANION_SOURCE_KIND,
    sourceSha256: artifact.sourceSha256,
    sourceTextLength: artifact.sourceText.length,
    committedMatchesLive: true,
    indexCompanionMatchesArtifact: true,
  };
}

export type PackagedFactoryCloseoutDeepResearchChildMessagesLike = {
  sections?: {
    purpose?: { title?: string; body?: string };
    usage?: { title?: string; body?: string };
    whatItCovers?: unknown;
    keyConcepts?: unknown;
    howToUse?: unknown;
    limitsAndAssumptions?: unknown;
  };
  links?: {
    javascriptRuntime?: string;
    dynamicWorkflows?: string;
  };
};

/**
 * Fail closed unless deep-research page messages stay purpose + usage + two
 * required link labels (no teaching-chrome section keys).
 */
export function assertPackagedFactoryCloseoutDeepResearchChildMessages(
  messages: PackagedFactoryCloseoutDeepResearchChildMessagesLike,
): {
  purposeBody: string;
  usageTitle: string;
} {
  const purposeBody = messages.sections?.purpose?.body;
  if (typeof purposeBody !== "string" || purposeBody.trim().length === 0) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "deep-research-child-shape",
      "Deep-research child is missing sections.purpose.body.",
    );
  }
  if (messages.sections?.usage?.title !== "Usage") {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "deep-research-child-shape",
      'Deep-research child must title usage "Usage".',
    );
  }
  if (messages.sections?.usage?.body !== undefined) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "deep-research-child-shape",
      "Deep-research usage must be the MDX fenced example only (no usage.body prose).",
    );
  }
  if (messages.links?.javascriptRuntime !== "JavaScript Runtime") {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "deep-research-child-shape",
      "Deep-research child must expose links.javascriptRuntime label.",
    );
  }
  if (messages.links?.dynamicWorkflows !== "Dynamic Workflows") {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "deep-research-child-shape",
      "Deep-research child must expose links.dynamicWorkflows label.",
    );
  }
  for (const key of [
    "whatItCovers",
    "keyConcepts",
    "howToUse",
    "limitsAndAssumptions",
  ] as const) {
    if (messages.sections?.[key] !== undefined) {
      throw new PackagedFactoryCloseoutDeepResearchError(
        "deep-research-child-shape",
        `Deep-research child must not include teaching section "${key}".`,
      );
    }
  }

  return {
    purposeBody,
    usageTitle: "Usage",
  };
}

/**
 * Fail closed when the rendered deep-research child DOM includes forbidden
 * expansion / replay / raw-source surfaces.
 */
export function assertPackagedFactoryCloseoutDeepResearchChildHasNoForbiddenSurfaces(
  root: ParentNode,
): readonly string[] {
  const hits: string[] = [];
  for (const selector of PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_FORBIDDEN_SELECTORS) {
    if (root.querySelector(selector) !== null) {
      hits.push(selector);
    }
  }
  if (hits.length > 0) {
    throw new PackagedFactoryCloseoutDeepResearchError(
      "deep-research-forbidden-surface",
      `Deep-research child mounted forbidden surfaces: ${hits.join(", ")}.`,
    );
  }
  return hits;
}

/**
 * Tip proof entry for story 002 companion exactness (IO). Child DOM/message
 * proofs live in the colocated test so page load stays in the test layer.
 */
export function provePackagedFactoryReferenceFamilyCloseoutDeepResearch(options?: {
  projectRoot?: string;
  consumerDir?: string;
  javascriptOnlyCorpusEntry?: PackagedFactoryIndexCorpusLike["entries"][number];
}): {
  companion: PackagedFactoryCloseoutCompanionEvidence;
  javascriptOnly: PackagedFactoryCloseoutJavascriptOnlyEvidence;
} {
  const companion = provePackagedFactoryCloseoutExactCompanionJavascript({
    projectRoot: options?.projectRoot,
    consumerDir: options?.consumerDir,
  });

  const jsEntry = options?.javascriptOnlyCorpusEntry;
  const javascriptSourceText =
    jsEntry?.javascriptSourceText ?? companionSourceTextForDisplayProof();
  const javascriptOnly =
    assertPackagedFactoryCloseoutJavascriptOnlyExactDisplay({
      javascriptSourceText,
      childSlug: jsEntry?.childSlug,
      canonicalName: jsEntry?.canonicalName,
      sourceRelativePath: jsEntry?.sourceRelativePath,
    });

  return { companion, javascriptOnly };
}

/**
 * Use committed companion bytes as the JavaScript-only display fixture so the
 * closeout path proves the same acquired source that deep-research ships.
 */
function companionSourceTextForDisplayProof(
  committedRoot: string = getPackagedFactoriesIndexGeneratedRoot(
    getProjectRoot(),
  ),
): string {
  return loadCommittedPackagedFactoryCompanionSource(committedRoot).sourceText;
}
