/**
 * W18 temporary migration ledger and static compatibility mechanism contract.
 *
 * Pure data + policy for `/docs/documentation/*` → family-route moves from
 * plan §10 / W00 baseline inventory. No filesystem or Next redirect IO —
 * later stories ship compatibility HTML and SEO/sitemap wiring against this
 * contract.
 */

import { stripSearchUrlLocalePrefix } from "@/lib/search/factory-search-deleted-records";

/** Open until story 005 closes every row with proven compatibility outcomes. */
export type DocumentationRouteMigrationStatus = "open" | "closed";

export type DocumentationRouteMigrationRow = {
  /** Published inbound URL under `/docs/documentation/*`. */
  oldRoute: `/${string}`;
  /** Canonical family destination after migration. */
  targetRoute: `/${string}`;
  status: DocumentationRouteMigrationStatus;
};

/**
 * Forbidden host/runtime redirect assumptions. Static export cannot rely on
 * these; W18 must use compatibility HTML + Metadata canonical + sitemap
 * exclusion instead.
 */
export const DOCUMENTATION_ROUTE_MIGRATION_FORBIDDEN_REDIRECT_MECHANISMS = [
  "next.config-redirects",
  "host-_redirects",
  "runtime-server-redirects",
] as const;

export type DocumentationRouteMigrationForbiddenRedirectMechanism =
  (typeof DOCUMENTATION_ROUTE_MIGRATION_FORBIDDEN_REDIRECT_MECHANISMS)[number];

/**
 * Static-export-safe compatibility mechanism locked for every §10 row.
 *
 * Each old route must export compatibility HTML that declares the new family
 * canonical. Silent omission of a published §10 old URL from static params /
 * export is forbidden.
 */
export const DOCUMENTATION_ROUTE_STATIC_COMPATIBILITY_MECHANISM = {
  id: "static-compatibility-document-with-metadata-canonical-and-sitemap-exclusion",
  /**
   * Primary reader outcome: static HTML at the old path that identifies and
   * links to the target family route (no live factory host required).
   */
  primaryOutcome: "static-compatibility-document",
  /**
   * SEO pairing: Metadata `alternates.canonical` (and aligned OG url) name the
   * new family path only; sitemap excludes the old path while still serving
   * the compatibility HTML.
   */
  seoPairing: "metadata-canonical-and-sitemap-exclusion",
  requiresExplicitCompatibilityHtml: true,
  requiresNewFamilyCanonicalDeclaration: true,
  forbidsSilentRemovalOfPublishedOldRoute: true,
  forbiddenRedirectMechanisms:
    DOCUMENTATION_ROUTE_MIGRATION_FORBIDDEN_REDIRECT_MECHANISMS,
} as const;

export type DocumentationRouteStaticCompatibilityMechanism =
  typeof DOCUMENTATION_ROUTE_STATIC_COMPATIBILITY_MECHANISM;

/**
 * Temporary ledger for every plan §10 /docs/documentation/* → family mapping.
 * Rows close only when compatibility, canonical, link, sitemap, and important
 * anchor outcomes are proven (story 005).
 */
export const DOCUMENTATION_ROUTE_MIGRATION_LEDGER: readonly DocumentationRouteMigrationRow[] =
  [
    {
      oldRoute: "/docs/documentation/api-doc",
      targetRoute: "/docs/references/api",
      status: "closed",
    },
    {
      oldRoute: "/docs/documentation/cli-command-index",
      targetRoute: "/docs/references/cli",
      status: "closed",
    },
    {
      oldRoute: "/docs/documentation/configuration",
      targetRoute: "/docs/factories/configuration",
      status: "closed",
    },
    {
      oldRoute: "/docs/documentation/global-configuration-factories",
      targetRoute: "/docs/factories/global-configuration",
      status: "closed",
    },
    {
      oldRoute: "/docs/documentation/packaged-factories",
      targetRoute: "/docs/factories/packaged",
      status: "closed",
    },
    {
      oldRoute: "/docs/documentation/dynamic-workflows",
      targetRoute: "/docs/factories/dynamic-workflows",
      status: "closed",
    },
    {
      oldRoute: "/docs/documentation/factory-session",
      targetRoute: "/docs/factories/sessions",
      status: "closed",
    },
    {
      oldRoute: "/docs/documentation/workers",
      targetRoute: "/docs/workers",
      status: "closed",
    },
    {
      oldRoute: "/docs/documentation/agent-workers",
      targetRoute: "/docs/workers/agent",
      status: "closed",
    },
    {
      oldRoute: "/docs/documentation/inference-workers",
      targetRoute: "/docs/workers/inference",
      status: "closed",
    },
    {
      oldRoute: "/docs/documentation/script-workers",
      targetRoute: "/docs/workers/script",
      status: "closed",
    },
    {
      oldRoute: "/docs/documentation/poller-workers",
      targetRoute: "/docs/workers/poller",
      status: "closed",
    },
    {
      oldRoute: "/docs/documentation/mock-workers",
      targetRoute: "/docs/workers/mock",
      status: "closed",
    },
    {
      oldRoute: "/docs/documentation/workstations",
      targetRoute: "/docs/workstations",
      status: "closed",
    },
  ];

/**
 * Important on-target deep-link anchors for §10 family destinations.
 *
 * Prefer the first substantive teaching section on each target. Factories
 * authored child pages use purpose-lead chrome (no `what-it-covers`); keep
 * anchors aligned with those first teaching section ids. Worker/workstation
 * authored pages (and their family indexes) expose `how-to-use` after chrome
 * polish. Projection-first pages (for example the API reference) use their
 * primary content section id (`operations`). The CLI reference inventory-first
 * repair opens on `command-inventory`. Index-only targets without a section id
 * use `{ kind: "none", reason: "index-only-target" }`.
 */
export type DocumentationRouteMigrationImportantAnchor =
  | { kind: "section"; id: string }
  | { kind: "none"; reason: "index-only-target" };

export const DOCUMENTATION_ROUTE_MIGRATION_IMPORTANT_ANCHORS: Readonly<
  Record<`/${string}`, DocumentationRouteMigrationImportantAnchor>
> = {
  "/docs/references/api": { kind: "section", id: "operations" },
  "/docs/references/cli": { kind: "section", id: "command-inventory" },
  "/docs/factories/configuration": {
    kind: "section",
    id: "what-lives-where",
  },
  "/docs/factories/global-configuration": {
    kind: "section",
    id: "operator-model-defaults",
  },
  "/docs/factories/packaged": {
    kind: "section",
    id: "discovery-and-resolution",
  },
  "/docs/factories/dynamic-workflows": {
    kind: "section",
    id: "orchestrator-schema",
  },
  "/docs/factories/sessions": {
    kind: "section",
    id: "factory-relationship",
  },
  "/docs/workers": { kind: "section", id: "how-to-use" },
  "/docs/workers/agent": { kind: "section", id: "how-to-use" },
  "/docs/workers/inference": { kind: "section", id: "how-to-use" },
  "/docs/workers/script": { kind: "section", id: "how-to-use" },
  "/docs/workers/poller": { kind: "section", id: "how-to-use" },
  "/docs/workers/mock": { kind: "section", id: "how-to-use" },
  "/docs/workstations": { kind: "section", id: "how-to-use" },
};

export function resolveDocumentationRouteMigrationImportantAnchor(
  targetRoute: string,
): DocumentationRouteMigrationImportantAnchor | undefined {
  return DOCUMENTATION_ROUTE_MIGRATION_IMPORTANT_ANCHORS[
    targetRoute as `/${string}`
  ];
}

export type DocumentationRouteMigrationLedger =
  typeof DOCUMENTATION_ROUTE_MIGRATION_LEDGER;

export const DOCUMENTATION_ROUTE_MIGRATION_LEDGER_SIZE =
  DOCUMENTATION_ROUTE_MIGRATION_LEDGER.length;

/** Expected §10 inventory size from plan / W00 baseline. */
export const DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT = 14;

export function listDocumentationRouteMigrationRows(): readonly DocumentationRouteMigrationRow[] {
  return DOCUMENTATION_ROUTE_MIGRATION_LEDGER;
}

export function listOpenDocumentationRouteMigrationRows(): DocumentationRouteMigrationRow[] {
  return DOCUMENTATION_ROUTE_MIGRATION_LEDGER.filter(
    (row) => row.status === "open",
  );
}

export function listClosedDocumentationRouteMigrationRows(): DocumentationRouteMigrationRow[] {
  return DOCUMENTATION_ROUTE_MIGRATION_LEDGER.filter(
    (row) => row.status === "closed",
  );
}

export function isDocumentationRouteMigrationLedgerFullyClosed(): boolean {
  return DOCUMENTATION_ROUTE_MIGRATION_LEDGER.every(
    (row) => row.status === "closed",
  );
}

export function findDocumentationRouteMigrationByOldRoute(
  oldRoute: string,
): DocumentationRouteMigrationRow | undefined {
  return DOCUMENTATION_ROUTE_MIGRATION_LEDGER.find(
    (row) => row.oldRoute === oldRoute,
  );
}

export function resolveDocumentationRouteMigrationTarget(
  oldRoute: string,
): string | undefined {
  return findDocumentationRouteMigrationByOldRoute(oldRoute)?.targetRoute;
}

/** Docs catch-all slug segments for a ledger old route (`documentation/...`). */
export function documentationRouteMigrationOldRouteToSlug(
  oldRoute: string,
): string[] | undefined {
  const prefix = "/docs/";
  if (!oldRoute.startsWith(prefix)) {
    return undefined;
  }
  const slug = oldRoute.slice(prefix.length);
  if (!slug || slug.includes("//")) {
    return undefined;
  }
  return slug.split("/");
}

/** True when a catch-all slug is a plan §10 old documentation route. */
export function isDocumentationRouteMigrationOldSlug(
  slug: string[] | undefined,
): boolean {
  if (!slug || slug.length < 2 || slug[0] !== "documentation") {
    return false;
  }
  const oldRoute = `/docs/${slug.join("/")}`;
  return findDocumentationRouteMigrationByOldRoute(oldRoute) !== undefined;
}

/** Every §10 old route as a docs catch-all slug (static params / export proof). */
export function listDocumentationRouteMigrationOldSlugs(): string[][] {
  return DOCUMENTATION_ROUTE_MIGRATION_LEDGER.map((row) => {
    const slug = documentationRouteMigrationOldRouteToSlug(row.oldRoute);
    if (!slug) {
      throw new Error(`Invalid migration oldRoute: ${row.oldRoute}`);
    }
    return slug;
  });
}

/** Every §10 old inbound path (sitemap exclusion / discovery proofs). */
export function listDocumentationRouteMigrationOldRoutes(): readonly `/${string}`[] {
  return DOCUMENTATION_ROUTE_MIGRATION_LEDGER.map((row) => row.oldRoute);
}

/** Every §10 family target path (sitemap inclusion / canonical proofs). */
export function listDocumentationRouteMigrationTargetRoutes(): readonly `/${string}`[] {
  return DOCUMENTATION_ROUTE_MIGRATION_LEDGER.map((row) => row.targetRoute);
}

/**
 * True when `appPath` is a plan §10 old documentation route (locale prefix
 * stripped). Compatibility HTML still ships; the path is non-canonical for
 * sitemap / discovery only.
 */
export function isDocumentationRouteMigrationOldPath(appPath: string): boolean {
  const path = stripSearchUrlLocalePrefix(appPath);
  return findDocumentationRouteMigrationByOldRoute(path) !== undefined;
}

/**
 * Resolves the family canonical path for a §10 old route. Returns `undefined`
 * when `appPath` is not a ledger old route.
 */
export function resolveDocumentationRouteMigrationCanonicalPath(
  appPath: string,
): string | undefined {
  const path = stripSearchUrlLocalePrefix(appPath);
  return resolveDocumentationRouteMigrationTarget(path);
}

/**
 * Docs catch-all slug used for Metadata canonical / hreflang. §10 old slugs
 * remap to their family target slug; other slugs pass through unchanged.
 */
export function resolveDocumentationRouteMigrationCanonicalDocsSlug(
  docsSlug: string,
): string {
  const oldRoute = `/docs/${docsSlug}`;
  const targetRoute = resolveDocumentationRouteMigrationTarget(oldRoute);
  if (!targetRoute) {
    return docsSlug;
  }
  const prefix = "/docs/";
  if (!targetRoute.startsWith(prefix)) {
    throw new Error(`Invalid migration targetRoute: ${targetRoute}`);
  }
  return targetRoute.slice(prefix.length);
}

/** Structural shape accepted by the export-safety predicate (tests + callers). */
export type DocumentationRouteStaticCompatibilityMechanismLike = {
  primaryOutcome: string;
  seoPairing: string;
  requiresExplicitCompatibilityHtml: boolean;
  requiresNewFamilyCanonicalDeclaration: boolean;
  forbidsSilentRemovalOfPublishedOldRoute: boolean;
  forbiddenRedirectMechanisms: readonly string[];
};

/**
 * True when the locked mechanism is static-export-safe: requires compatibility
 * HTML + new canonical, forbids silent removal, and rejects redirect hosts.
 */
export function isDocumentationRouteStaticCompatibilityMechanismExportSafe(
  mechanism: DocumentationRouteStaticCompatibilityMechanismLike = DOCUMENTATION_ROUTE_STATIC_COMPATIBILITY_MECHANISM,
): boolean {
  if (!mechanism.requiresExplicitCompatibilityHtml) {
    return false;
  }
  if (!mechanism.requiresNewFamilyCanonicalDeclaration) {
    return false;
  }
  if (!mechanism.forbidsSilentRemovalOfPublishedOldRoute) {
    return false;
  }
  if (mechanism.primaryOutcome !== "static-compatibility-document") {
    return false;
  }
  if (mechanism.seoPairing !== "metadata-canonical-and-sitemap-exclusion") {
    return false;
  }
  for (const forbidden of DOCUMENTATION_ROUTE_MIGRATION_FORBIDDEN_REDIRECT_MECHANISMS) {
    if (!mechanism.forbiddenRedirectMechanisms.includes(forbidden)) {
      return false;
    }
  }
  return true;
}

/**
 * Preferred published registry identities for §10 migrated destinations.
 * Related-ID graphs and discovery should prefer these over the old
 * `documentation.*` compatibility-page ids.
 *
 * Workers/workstations family indexes use App Router routes without MDX
 * published entries; keep `documentation.workers` /
 * `documentation.workstations` as related ids and remap their hrefs via
 * {@link registryRecordHref} → {@link remapDocumentationRouteMigrationDestinationHref}.
 */
export const DOCUMENTATION_ROUTE_MIGRATION_PREFERRED_REGISTRY_IDS = {
  "documentation.api-doc": "reference.api",
  "documentation.cli-command-index": "reference.cli",
  "documentation.configuration": "documentation.factories-configuration",
  "documentation.global-configuration-factories":
    "documentation.factories-global-configuration",
  "documentation.packaged-factories": "documentation.factories-packaged",
  "documentation.dynamic-workflows":
    "documentation.factories-dynamic-workflows",
  "documentation.factory-session": "documentation.factories-sessions",
  "documentation.agent-workers": "documentation.workers-agent",
  "documentation.inference-workers": "documentation.workers-inference",
  "documentation.script-workers": "documentation.workers-script",
  "documentation.poller-workers": "documentation.workers-poller",
  "documentation.mock-workers": "documentation.workers-mock",
} as const;

export type DocumentationRouteMigrationOldRegistryId =
  keyof typeof DOCUMENTATION_ROUTE_MIGRATION_PREFERRED_REGISTRY_IDS;

export type DocumentationRouteMigrationPreferredRegistryId =
  (typeof DOCUMENTATION_ROUTE_MIGRATION_PREFERRED_REGISTRY_IDS)[DocumentationRouteMigrationOldRegistryId];

/** Old registry ids that still resolve related hrefs via path remap only. */
export const DOCUMENTATION_ROUTE_MIGRATION_HREF_REMAP_ONLY_REGISTRY_IDS = [
  "documentation.workers",
  "documentation.workstations",
] as const;

export type DocumentationRouteMigrationHrefRemapOnlyRegistryId =
  (typeof DOCUMENTATION_ROUTE_MIGRATION_HREF_REMAP_ONLY_REGISTRY_IDS)[number];

export function resolveDocumentationRouteMigrationPreferredRegistryId(
  registryId: string,
): string {
  if (registryId in DOCUMENTATION_ROUTE_MIGRATION_PREFERRED_REGISTRY_IDS) {
    return DOCUMENTATION_ROUTE_MIGRATION_PREFERRED_REGISTRY_IDS[
      registryId as DocumentationRouteMigrationOldRegistryId
    ];
  }
  return registryId;
}

/**
 * Remaps a §10 old documentation destination href to its family target.
 * Non-migration paths pass through unchanged. Locale prefixes are preserved
 * on the remapped family path when present on the input.
 */
export function remapDocumentationRouteMigrationDestinationHref(
  href: string,
): string {
  const path = stripSearchUrlLocalePrefix(href);
  const target = resolveDocumentationRouteMigrationTarget(path);
  if (!target) {
    return href;
  }
  if (path === href) {
    return target;
  }
  const localePrefix = href.slice(0, href.length - path.length);
  return `${localePrefix}${target}`;
}

/** True when a docs URL/slug is a §10 old route that must leave browse. */
export function isDocumentationRouteMigrationOldBrowsePath(
  appPathOrDocsSlug: string,
): boolean {
  if (appPathOrDocsSlug.startsWith("/")) {
    return isDocumentationRouteMigrationOldPath(appPathOrDocsSlug);
  }
  return isDocumentationRouteMigrationOldPath(`/docs/${appPathOrDocsSlug}`);
}
