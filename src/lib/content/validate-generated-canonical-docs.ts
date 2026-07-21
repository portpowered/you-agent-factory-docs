import type { PageAssetConfig, PageKind, PageMessages } from "./schemas";
import {
  splitMdxFrontmatter,
  validateCanonicalMdxProse,
} from "./validate-canonical-mdx-prose";
import type { ValidationError } from "./validate-registry";

const LEGACY_SUMMARY_MESSAGE_KEYS = ["problemStatement", "coreIdea"] as const;

const LEGACY_SUMMARY_MDX_MARKERS = [
  '<T k="problemStatement"',
  '<T k="coreIdea"',
  "callouts.readerShortcut",
  "<GlossaryOpening",
] as const;

const GRAPH_COMPONENT_NAMES = ["ConceptMap"] as const;

type GraphComponentName = (typeof GRAPH_COMPONENT_NAMES)[number];

type GraphPlacementRule = {
  components: readonly GraphComponentName[];
  requiredSectionId?: string;
  forbiddenSectionIds?: readonly string[];
  minPrimaryGraphComponents?: number;
};

const graphPlacementRulesByKind: Partial<Record<PageKind, GraphPlacementRule>> =
  {
    concept: {
      components: ["ConceptMap"],
    },
    glossary: {
      components: ["ConceptMap"],
    },
  };

function isGraphAssetType(type: string): boolean {
  return type === "graph" || type === "attention-variant-graph";
}

function matchesSupportedAssetType(
  _component: GraphComponentName,
  assetType: string,
): boolean {
  return isGraphAssetType(assetType);
}

function extractMdxBody(mdxSource: string): string {
  return splitMdxFrontmatter(mdxSource).body;
}

function sectionSlice(mdxBody: string, sectionId: string): string | undefined {
  const sectionStart = mdxBody.indexOf(`id="${sectionId}"`);
  if (sectionStart < 0) {
    return undefined;
  }
  const nextSectionStart = mdxBody.indexOf("<Section", sectionStart + 1);
  return nextSectionStart >= 0
    ? mdxBody.slice(sectionStart, nextSectionStart)
    : mdxBody.slice(sectionStart);
}

function findGraphComponentMatches(
  mdxBody: string,
  componentName: GraphComponentName,
): RegExpMatchArray[] {
  const pattern = new RegExp(`<${componentName}\\b[\\s\\S]*?\\/?>`, "g");
  return [...mdxBody.matchAll(pattern)];
}

function extractAssetIdFromComponentTag(tag: string): string | undefined {
  const match = tag.match(/\bassetId="([^"]+)"/);
  return match?.[1];
}

const OPENING_SUMMARY_MDX_MARKERS = [
  "<FoldedSummary />",
  '<T k="openingSummary" />',
] as const;

export function validateGeneratedFoldedSummary(options: {
  pagePath: string;
  kind: PageKind;
  mdxSource: string;
  messages: PageMessages;
}): ValidationError[] {
  const { pagePath, mdxSource, messages } = options;
  const mdxBody = extractMdxBody(mdxSource);
  const messagesPath = pagePath.replace(/page\.mdx$/, "messages/en.json");
  const errors: ValidationError[] = [];
  for (const legacyKey of LEGACY_SUMMARY_MESSAGE_KEYS) {
    if (legacyKey in messages && messages[legacyKey as keyof PageMessages]) {
      errors.push({
        code: "legacy-split-summary-message-key",
        message: `${messagesPath}: generated bundles must not use legacy split summary key "${legacyKey}"`,
        path: messagesPath,
      });
    }
  }

  if (
    messages.callouts &&
    typeof messages.callouts === "object" &&
    "readerShortcut" in messages.callouts
  ) {
    errors.push({
      code: "legacy-reader-shortcut-callout",
      message: `${messagesPath}: generated bundles must not include callouts.readerShortcut`,
      path: messagesPath,
    });
  }

  for (const marker of LEGACY_SUMMARY_MDX_MARKERS) {
    if (mdxBody.includes(marker)) {
      errors.push({
        code: "legacy-split-summary-mdx",
        message: `${pagePath}: generated MDX must not include legacy summary marker "${marker}"`,
        path: pagePath,
      });
    }
  }

  if (OPENING_SUMMARY_MDX_MARKERS.some((marker) => mdxBody.includes(marker))) {
    errors.push({
      code: "opening-summary-in-mdx",
      message: `${pagePath}: canonical docs pages must not render openingSummary in MDX`,
      path: pagePath,
    });
  }

  return errors;
}

/**
 * Kind-specific structure checks for generated canonical pages.
 * RelatedDocs / related-section presence is intentionally not required
 * (PF-L-contracts): strip-ready concept/canonical MDX may omit both.
 */
export function validateGeneratedKindSpecificStructure(_options: {
  pagePath: string;
  kind: PageKind;
  mdxSource: string;
}): ValidationError[] {
  return [];
}

/**
 * Model-kind asset caption rules applied only to the retired Model Atlas
 * `model` page kind. No current factory page kind opts in, so this is a
 * no-op today; kept as a stable extension point for `validateGeneratedCanonicalDocs`.
 */
export function validateGeneratedAssetRules(_options: {
  pagePath: string;
  kind: PageKind;
  assets: PageAssetConfig;
  messages: PageMessages;
}): ValidationError[] {
  return [];
}

export function validateGeneratedGraphPlacement(options: {
  pagePath: string;
  kind: PageKind;
  mdxSource: string;
  assets: PageAssetConfig;
}): ValidationError[] {
  const { pagePath, kind, mdxSource, assets } = options;
  const mdxBody = extractMdxBody(mdxSource);
  const assetsPath = pagePath.replace(/page\.mdx$/, "assets.json");
  const rules = graphPlacementRulesByKind[kind];
  if (!rules) {
    return [];
  }

  const errors: ValidationError[] = [];
  const matchedComponents: Array<{
    component: GraphComponentName;
    tag: string;
  }> = [];

  for (const componentName of rules.components) {
    for (const match of findGraphComponentMatches(mdxBody, componentName)) {
      const tag = match[0] ?? "";
      matchedComponents.push({ component: componentName, tag });
    }
  }

  if (rules.minPrimaryGraphComponents !== undefined) {
    const graphCount = matchedComponents.length;
    if (graphCount < rules.minPrimaryGraphComponents) {
      errors.push({
        code: "graph-count-mismatch",
        message: `${pagePath}: ${kind} pages must render at least ${rules.minPrimaryGraphComponents} primary graph component(s); found ${graphCount}`,
        path: pagePath,
      });
    }
  }

  for (const { component, tag } of matchedComponents) {
    const assetId = extractAssetIdFromComponentTag(tag);
    if (!assetId) {
      errors.push({
        code: "graph-missing-asset-id",
        message: `${pagePath}: ${component} must reference a graph through assetId instead of inline graph prose`,
        path: pagePath,
      });
      continue;
    }

    const asset = assets[assetId];
    if (!asset) {
      errors.push({
        code: "graph-unknown-asset-id",
        message: `${pagePath}: ${component} references missing asset id "${assetId}"`,
        path: pagePath,
      });
      continue;
    }

    if (!matchesSupportedAssetType(component, asset.type)) {
      const requiredType = 'type "graph" or "attention-variant-graph"';
      errors.push({
        code: "graph-asset-type-mismatch",
        message: `${assetsPath}: asset "${assetId}" referenced by ${component} must have ${requiredType}`,
        path: assetsPath,
      });
    }
  }

  if (rules.requiredSectionId) {
    const sectionBody = sectionSlice(mdxBody, rules.requiredSectionId);
    if (!sectionBody) {
      errors.push({
        code: "graph-section-missing",
        message: `${pagePath}: expected graph section id="${rules.requiredSectionId}" for ${kind} pages`,
        path: pagePath,
      });
    } else {
      for (const componentName of rules.components) {
        const inSection = findGraphComponentMatches(
          sectionBody,
          componentName,
        ).length;
        if (
          inSection === 0 &&
          matchedComponents.some((entry) => entry.component === componentName)
        ) {
          errors.push({
            code: "graph-wrong-section",
            message: `${pagePath}: ${componentName} must appear inside section id="${rules.requiredSectionId}"`,
            path: pagePath,
          });
        }
      }
    }
  }

  for (const forbiddenSectionId of rules.forbiddenSectionIds ?? []) {
    const forbiddenSection = sectionSlice(mdxBody, forbiddenSectionId);
    if (!forbiddenSection) {
      continue;
    }
    for (const componentName of rules.components) {
      if (
        findGraphComponentMatches(forbiddenSection, componentName).length > 0
      ) {
        errors.push({
          code: "graph-forbidden-section",
          message: `${pagePath}: ${componentName} must not appear inside section id="${forbiddenSectionId}"`,
          path: pagePath,
        });
      }
    }
  }

  return errors;
}

export type ValidateGeneratedCanonicalDocsOptions = {
  pagePath: string;
  kind: PageKind;
  mdxSource: string;
  messages: PageMessages;
  assets: PageAssetConfig;
};

export function validateGeneratedCanonicalDocs(
  options: ValidateGeneratedCanonicalDocsOptions,
): ValidationError[] {
  const { pagePath, kind, mdxSource, messages, assets } = options;

  return [
    ...validateGeneratedFoldedSummary({
      pagePath,
      kind,
      mdxSource,
      messages,
    }),
    ...validateGeneratedGraphPlacement({
      pagePath,
      kind,
      mdxSource,
      assets,
    }),
    ...validateGeneratedKindSpecificStructure({
      pagePath,
      kind,
      mdxSource,
    }),
    ...validateGeneratedAssetRules({
      pagePath,
      kind,
      assets,
      messages,
    }),
    ...validateCanonicalMdxProse({
      pagePath,
      kind,
      mdxSource,
      messages,
      assets,
    }),
  ];
}
