import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  DOCS_SECTIONS,
  REGISTRY_COLLECTIONS,
} from "@/lib/content/content-paths";
import {
  ontologyParticipantKindSchema,
  registryKindSchema,
} from "@/lib/content/registry-core";
import { pageKindSchema } from "@/lib/content/schemas";

/**
 * Retired Atlas public route families. Reintroducing these as live product
 * destinations fails the denylist audit.
 */
export const RETIRED_PUBLIC_ROUTE_FAMILIES = [
  "/docs/models",
  "/docs/modules",
  "/docs/papers",
  "/docs/training",
  "/docs/systems",
] as const;

export type RetiredPublicRouteFamily =
  (typeof RETIRED_PUBLIC_ROUTE_FAMILIES)[number];

/**
 * Retired page/registry product kinds. Live kind inventories must not include
 * these. Citation metadata `citationType: "paper"` is out of scope.
 */
export const RETIRED_PAGE_REGISTRY_KINDS = [
  "model",
  "module",
  "paper",
  "training-regime",
  "system",
] as const;

export type RetiredPageRegistryKind =
  (typeof RETIRED_PAGE_REGISTRY_KINDS)[number];

/** Retired docs section / registry collection directory ids. */
export const RETIRED_COLLECTION_SECTION_IDS = [
  "models",
  "modules",
  "papers",
  "training",
  "training-regimes",
  "systems",
] as const;

export type RetiredCollectionSectionId =
  (typeof RETIRED_COLLECTION_SECTION_IDS)[number];

/**
 * Owned file/directory paths deleted with AI content infrastructure.
 * Existence on disk is a denylist failure (reintroduction).
 */
export const RETIRED_AI_CONTENT_OWNED_PATHS = [
  "src/features/ai",
  "src/lib/navigation/ai-docs-sidebar-adapter.ts",
  "src/lib/navigation/ai-docs-sidebar-adapter.test.ts",
  "src/lib/content/model-page.ts",
  "src/lib/content/model-page-load.ts",
  "src/lib/content/module-page.ts",
  "src/lib/content/module-page-load.ts",
  "src/lib/content/module-shell-render.tsx",
  "src/lib/content/paper-page.ts",
  "src/lib/content/paper-page-load.ts",
  "src/lib/content/training-regime-page.ts",
  "src/lib/content/training-regime-page-load.ts",
  "src/lib/content/system-page.ts",
  "src/lib/content/system-page-load.ts",
  "src/lib/content/system-shell-render.tsx",
  "src/lib/content/compile-module-mdx.ts",
  "src/lib/content/module-comparison-table.ts",
  "src/lib/content/module-test-helpers.ts",
  "src/lib/content/metadata-labels.ts",
  "src/lib/content/page-release-metadata.ts",
  "src/content/docs/models",
  "src/content/docs/modules",
  "src/content/docs/papers",
  "src/content/docs/training",
  "src/content/docs/systems",
  "src/content/registry/models",
  "src/content/registry/modules",
  "src/content/registry/papers",
  "src/content/registry/training-regimes",
  "src/content/registry/systems",
  "docs/templates/model.mdx",
  "docs/templates/module.mdx",
  "docs/templates/paper.mdx",
  "docs/templates/training-regime.mdx",
  "docs/templates/system.mdx",
  "src/lib/content/__generate-fixtures__",
  "src/features/docs/components/TopologyBrowsePage.tsx",
  "src/features/docs/components/StaticExportBrowsePage.tsx",
  "src/lib/content/topology-browse.ts",
  "src/lib/content/topology-navigation.ts",
  "src/lib/content/topology-tree-entries.ts",
  "src/lib/content/topology-selector-compatibility.ts",
  "src/lib/content/topology-selector-resolution.ts",
  "src/lib/content/ontology-classification-selectors.ts",
  "src/app/(site)/docs/models",
  "src/app/(site)/docs/modules",
  "src/app/(site)/docs/papers",
  "src/app/(site)/docs/training",
  "src/app/(site)/docs/systems",
  "src/app/[locale]/docs/models",
  "src/app/[locale]/docs/modules",
  "src/app/[locale]/docs/papers",
  "src/app/[locale]/docs/training",
  "src/app/[locale]/docs/systems",
] as const;

export type RetiredAiContentOwnedPath =
  (typeof RETIRED_AI_CONTENT_OWNED_PATHS)[number];

export type RetiredAiContentDenylistFindingKind =
  | "retired-owned-path"
  | "retired-kind"
  | "retired-route-family"
  | "retired-collection-section";

export type RetiredAiContentDenylistFinding = {
  kind: RetiredAiContentDenylistFindingKind;
  matchedText: string;
  path: string;
  snippet: string;
};

export type RetiredAiContentDenylistResult = {
  findings: readonly RetiredAiContentDenylistFinding[];
  ok: boolean;
  scannedOwnedPaths: readonly string[];
  scannedKindInventories: readonly string[];
  scannedRouteInventories: readonly string[];
};

const RETIRED_KIND_SET = new Set<string>(RETIRED_PAGE_REGISTRY_KINDS);
const RETIRED_ROUTE_SET = new Set<string>(RETIRED_PUBLIC_ROUTE_FAMILIES);
const RETIRED_COLLECTION_SET = new Set<string>(RETIRED_COLLECTION_SECTION_IDS);

/**
 * Genuine factory provider / external-model configuration wording.
 * These mentions must not be treated as Atlas content infrastructure.
 */
const FACTORY_PROVIDER_MODEL_EXCEPTION_PATTERN =
  /\b(?:external[- ]models?|model[- ]providers?|supported models?(?:\s+providers?)?|worker-model-provider|default-worker-model-provider|--default-worker-model-provider)\b/i;

/**
 * Exclusion / retirement wording that may mention retired routes or kinds
 * without presenting them as live product surfaces.
 */
const EXCLUSION_CONTEXT_PATTERN =
  /\b(?:not|never|retired|exclude|exclusion|denylist|atlas-era|do not|don't|not required|no longer|demoted|must not|should not|deleted|reintroduction|what this is not)\b/i;

const CONTEXT_WINDOW_LINES = 2;

const ROUTE_FAMILY_PATTERN =
  /(?:^|[^/\w])(\/docs\/(?:models|modules|papers|training|systems)(?:\/[\w-]+)*)/gi;

const PRODUCT_KIND_PATTERN = new RegExp(
  String.raw`(?:\bkind\s*[:=]\s*["']|\bpage kinds?\b[^.\n]{0,40}|\blive (?:page|registry) kinds?\b[^.\n]{0,40})(${RETIRED_PAGE_REGISTRY_KINDS.join("|")})\b`,
  "gi",
);

function zodEnumOptions(schema: {
  options?: readonly string[];
  enum?: Record<string, string>;
}): readonly string[] {
  if (Array.isArray(schema.options)) {
    return schema.options;
  }
  if (schema.enum && typeof schema.enum === "object") {
    return Object.values(schema.enum);
  }
  return [];
}

export function isFactoryProviderModelExceptionContext(
  context: string,
): boolean {
  return FACTORY_PROVIDER_MODEL_EXCEPTION_PATTERN.test(context);
}

export function isRetiredAiContentExclusionContext(context: string): boolean {
  return (
    EXCLUSION_CONTEXT_PATTERN.test(context) ||
    isFactoryProviderModelExceptionContext(context)
  );
}

function buildContextWindow(
  lines: readonly string[],
  lineIndex: number,
): string {
  const start = Math.max(0, lineIndex - CONTEXT_WINDOW_LINES);
  const end = Math.min(lines.length, lineIndex + CONTEXT_WINDOW_LINES + 1);
  return lines.slice(start, end).join("\n");
}

/**
 * Fail when a denylisted owned path is present (reintroduced).
 */
export function auditRetiredOwnedPaths(
  entries: readonly { exists: boolean; path: string }[],
): readonly RetiredAiContentDenylistFinding[] {
  const findings: RetiredAiContentDenylistFinding[] = [];
  for (const entry of entries) {
    if (!entry.exists) {
      continue;
    }
    findings.push({
      kind: "retired-owned-path",
      matchedText: entry.path,
      path: entry.path,
      snippet: `Denylisted AI content path is present: ${entry.path}`,
    });
  }
  return findings;
}

/**
 * Fail when a live kind inventory includes retired Atlas product kinds.
 */
export function auditRetiredKindInventory(
  inventoryName: string,
  kinds: readonly string[],
): readonly RetiredAiContentDenylistFinding[] {
  const findings: RetiredAiContentDenylistFinding[] = [];
  for (const kind of kinds) {
    if (!RETIRED_KIND_SET.has(kind)) {
      continue;
    }
    findings.push({
      kind: "retired-kind",
      matchedText: kind,
      path: inventoryName,
      snippet: `Live kind inventory includes retired kind "${kind}"`,
    });
  }
  return findings;
}

/**
 * Fail when a live route inventory includes retired public route families.
 */
export function auditRetiredRouteInventory(
  inventoryName: string,
  routes: readonly string[],
): readonly RetiredAiContentDenylistFinding[] {
  const findings: RetiredAiContentDenylistFinding[] = [];
  for (const route of routes) {
    const normalized = route.replace(/\/+$/, "") || route;
    const isRetired =
      RETIRED_ROUTE_SET.has(normalized) ||
      [...RETIRED_ROUTE_SET].some(
        (family) =>
          normalized === family || normalized.startsWith(`${family}/`),
      );
    if (!isRetired) {
      continue;
    }
    findings.push({
      kind: "retired-route-family",
      matchedText: route,
      path: inventoryName,
      snippet: `Live route inventory includes retired route family "${route}"`,
    });
  }
  return findings;
}

/**
 * Fail when docs/registry section inventories include retired Atlas ids.
 */
export function auditRetiredCollectionSectionInventory(
  inventoryName: string,
  sectionIds: readonly string[],
): readonly RetiredAiContentDenylistFinding[] {
  const findings: RetiredAiContentDenylistFinding[] = [];
  for (const sectionId of sectionIds) {
    if (!RETIRED_COLLECTION_SET.has(sectionId)) {
      continue;
    }
    findings.push({
      kind: "retired-collection-section",
      matchedText: sectionId,
      path: inventoryName,
      snippet: `Live collection/section inventory includes retired id "${sectionId}"`,
    });
  }
  return findings;
}

/**
 * Scan prose/config content for retired route/kind product teaching.
 * Factory provider/model configuration and explicit exclusion wording pass.
 */
export function scanRetiredAiContentDenylistContent(
  path: string,
  content: string,
): readonly RetiredAiContentDenylistFinding[] {
  const lines = content.split(/\r?\n/);
  const findings: RetiredAiContentDenylistFinding[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const context = buildContextWindow(lines, index);
    if (isRetiredAiContentExclusionContext(context)) {
      continue;
    }

    ROUTE_FAMILY_PATTERN.lastIndex = 0;
    let routeMatch = ROUTE_FAMILY_PATTERN.exec(line);
    while (routeMatch) {
      const matchedText = routeMatch[1] ?? routeMatch[0];
      findings.push({
        kind: "retired-route-family",
        matchedText,
        path,
        snippet: line.trim(),
      });
      routeMatch = ROUTE_FAMILY_PATTERN.exec(line);
    }

    PRODUCT_KIND_PATTERN.lastIndex = 0;
    let kindMatch = PRODUCT_KIND_PATTERN.exec(line);
    while (kindMatch) {
      const matchedText = kindMatch[1] ?? kindMatch[0];
      findings.push({
        kind: "retired-kind",
        matchedText,
        path,
        snippet: line.trim(),
      });
      kindMatch = PRODUCT_KIND_PATTERN.exec(line);
    }
  }

  return findings;
}

export function collectLiveKindInventories(): ReadonlyArray<{
  name: string;
  kinds: readonly string[];
}> {
  return [
    { name: "pageKindSchema", kinds: zodEnumOptions(pageKindSchema) },
    { name: "registryKindSchema", kinds: zodEnumOptions(registryKindSchema) },
    {
      name: "ontologyParticipantKindSchema",
      kinds: zodEnumOptions(ontologyParticipantKindSchema),
    },
  ];
}

export function collectLiveCollectionSectionInventories(): ReadonlyArray<{
  name: string;
  sectionIds: readonly string[];
}> {
  return [
    { name: "DOCS_SECTIONS", sectionIds: [...DOCS_SECTIONS] },
    { name: "REGISTRY_COLLECTIONS", sectionIds: [...REGISTRY_COLLECTIONS] },
  ];
}

export function collectRetiredAiContentInfrastructureDenylist(options: {
  exists?: (absolutePath: string) => boolean;
  kindInventories?: ReadonlyArray<{
    name: string;
    kinds: readonly string[];
  }>;
  collectionSectionInventories?: ReadonlyArray<{
    name: string;
    sectionIds: readonly string[];
  }>;
  ownedPaths?: readonly string[];
  repoRoot: string;
  routeInventories?: ReadonlyArray<{
    name: string;
    routes: readonly string[];
  }>;
  contentFixtures?: ReadonlyArray<{ path: string; content: string }>;
}): RetiredAiContentDenylistResult {
  const exists =
    options.exists ?? ((absolutePath: string) => existsSync(absolutePath));
  const ownedPaths = options.ownedPaths ?? [...RETIRED_AI_CONTENT_OWNED_PATHS];
  const kindInventories =
    options.kindInventories ?? collectLiveKindInventories();
  const collectionSectionInventories =
    options.collectionSectionInventories ??
    collectLiveCollectionSectionInventories();
  const routeInventories = options.routeInventories ?? [];
  const contentFixtures = options.contentFixtures ?? [];

  const findings: RetiredAiContentDenylistFinding[] = [];
  const scannedOwnedPaths: string[] = [];
  const scannedKindInventories: string[] = [];
  const scannedRouteInventories: string[] = [];

  findings.push(
    ...auditRetiredOwnedPaths(
      ownedPaths.map((relativePath) => {
        scannedOwnedPaths.push(relativePath);
        return {
          path: relativePath,
          exists: exists(join(options.repoRoot, relativePath)),
        };
      }),
    ),
  );

  for (const inventory of kindInventories) {
    scannedKindInventories.push(inventory.name);
    findings.push(
      ...auditRetiredKindInventory(inventory.name, inventory.kinds),
    );
  }

  for (const inventory of collectionSectionInventories) {
    scannedKindInventories.push(inventory.name);
    findings.push(
      ...auditRetiredCollectionSectionInventory(
        inventory.name,
        inventory.sectionIds,
      ),
    );
  }

  for (const inventory of routeInventories) {
    scannedRouteInventories.push(inventory.name);
    findings.push(
      ...auditRetiredRouteInventory(inventory.name, inventory.routes),
    );
  }

  for (const fixture of contentFixtures) {
    scannedRouteInventories.push(fixture.path);
    findings.push(
      ...scanRetiredAiContentDenylistContent(fixture.path, fixture.content),
    );
  }

  return {
    findings,
    ok: findings.length === 0,
    scannedOwnedPaths,
    scannedKindInventories,
    scannedRouteInventories,
  };
}

export function formatRetiredAiContentInfrastructureDenylist(
  result: RetiredAiContentDenylistResult,
): string {
  const lines = [
    "Retired AI content infrastructure denylist audit",
    `Owned paths checked: ${result.scannedOwnedPaths.length}`,
    `Kind/section inventories checked: ${result.scannedKindInventories.length}`,
    `Route inventories / content fixtures checked: ${result.scannedRouteInventories.length}`,
    `Status: ${result.ok ? "pass" : "fail"}`,
  ];

  if (result.findings.length === 0) {
    lines.push(
      "No retired route, kind, or owned-path reintroductions found.",
      "Factory provider/model configuration exceptions remain allowed.",
    );
    return `${lines.join("\n")}\n`;
  }

  lines.push(`Findings: ${result.findings.length}`);
  for (const finding of result.findings) {
    lines.push(
      `- [${finding.kind}] ${finding.path}: ${finding.matchedText} — ${finding.snippet}`,
    );
  }

  return `${lines.join("\n")}\n`;
}
