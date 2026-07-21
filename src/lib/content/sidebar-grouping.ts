export const SIDEBAR_GROUPING_PRECEDENCE = [
  "derived-taxonomy",
  "editorial-sidebar-grouping",
] as const;

export const SIDEBAR_GROUP_LABELS = {
  glossary: {
    "model-taxonomy": "Model Taxonomy",
    "sequence-and-attention": "Sequence And Attention",
    "math-and-training": "Math And Training",
    "generation-and-diffusion": "Generation And Diffusion",
  },
  concepts: {
    harnesses: "Harnesses",
    "industrial-engineering": "Industrial engineering",
    "model-inference": "Model inference",
  },
  documentation: {
    orientation: "Orientation",
    capabilities: "Capabilities",
    interfaces: "Interfaces",
    operations: "Operations",
  },
} as const;

/**
 * Nested secondaries under Program documentation top groups that need a third
 * explorer level. Groups absent here list pages directly under the top group.
 *
 * Locked PS-100 IA: Operations nests Configuring (factory config + resources).
 * Former Factory Configuration / System Operations secondaries
 * (Resources-as-group / Observability) are retired.
 */
export const DOCUMENTATION_SIDEBAR_SECONDARY_LABELS = {
  operations: {
    configuring: "Configuring you-agent-factory",
  },
} as const;

/**
 * Flat English defaults for `explorer.documentationSecondaries` catalogs.
 * Keys must stay aligned with nested `DOCUMENTATION_SIDEBAR_SECONDARY_LABELS`
 * values. Configuring is secondary-only under Operations.
 */
export const DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS = {
  configuring: DOCUMENTATION_SIDEBAR_SECONDARY_LABELS.operations.configuring,
} as const;

/**
 * Explicit factory Concepts explorer membership by page slug.
 * Slugs for sibling-authored pages (skills, mcp, tool-calling) are declared
 * so they land in the correct group when published; empty groups are omitted.
 */
export const FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG = {
  compaction: "harnesses",
  loop: "harnesses",
  worktree: "harnesses",
  harness: "harnesses",
  skills: "harnesses",
  mcp: "harnesses",
  "statistical-process-control-graphs": "industrial-engineering",
  "task-queue": "industrial-engineering",
  bottlenecks: "industrial-engineering",
  checklist: "industrial-engineering",
  tokens: "model-inference",
  thinking: "model-inference",
  tool: "model-inference",
  "tool-calling": "model-inference",
} as const satisfies Record<
  string,
  keyof (typeof SIDEBAR_GROUP_LABELS)["concepts"]
>;

export type FactoryConceptsSidebarSlug =
  keyof typeof FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG;

type DocumentationTopGroupId =
  keyof (typeof SIDEBAR_GROUP_LABELS)["documentation"];

type DocumentationSecondaryLabels =
  typeof DOCUMENTATION_SIDEBAR_SECONDARY_LABELS;

export type DocumentationSidebarSecondaryGroupId =
  keyof DocumentationSecondaryLabels;

export type DocumentationSidebarSecondaryId<
  Group extends
    DocumentationSidebarSecondaryGroupId = DocumentationSidebarSecondaryGroupId,
> = keyof DocumentationSecondaryLabels[Group];

/**
 * Direct placement under a Program top group (no nested secondary folder).
 * Allowed even when the top group also declares secondaries — Operations lists
 * Logs / Metrics / Dashboard as direct children beside Configuring.
 */
type DocumentationMembershipDirect = {
  readonly group: DocumentationTopGroupId;
};

type DocumentationMembershipWithSecondary = {
  readonly [Group in DocumentationSidebarSecondaryGroupId]: {
    readonly group: Group;
    readonly secondary: DocumentationSidebarSecondaryId<Group>;
  };
}[DocumentationSidebarSecondaryGroupId];

export type DocumentationSidebarMembership =
  | DocumentationMembershipDirect
  | DocumentationMembershipWithSecondary;

/**
 * Mode A Program capability overviews restored under PS-210 before PS-300 wires
 * explorer membership. Published and canonical, but not explorer destinations
 * until Lane A membership lands — otherwise they fall through as ungrouped
 * leftovers once removed from the W18 move-stub ledger.
 */
export const MODE_A_PROGRAM_OVERVIEW_PENDING_EXPLORER_MEMBERSHIP_SLUGS = [
  "factory-session",
  "dynamic-workflows",
  "packaged-factories",
] as const;

export type ModeAProgramOverviewPendingExplorerMembershipSlug =
  (typeof MODE_A_PROGRAM_OVERVIEW_PENDING_EXPLORER_MEMBERSHIP_SLUGS)[number];

const MODE_A_PROGRAM_OVERVIEW_PENDING_EXPLORER_MEMBERSHIP_SLUG_SET =
  new Set<string>(MODE_A_PROGRAM_OVERVIEW_PENDING_EXPLORER_MEMBERSHIP_SLUGS);

/**
 * True when a Program documentation docsSlug (with or without the
 * `documentation/` prefix) is a Mode A overview waiting on PS-300 explorer
 * membership.
 */
export function isModeAProgramOverviewPendingExplorerMembership(
  docsSlugOrPath: string,
): boolean {
  const normalized = docsSlugOrPath
    .replace(/^\/docs\//, "")
    .replace(/^documentation\//, "");
  return MODE_A_PROGRAM_OVERVIEW_PENDING_EXPLORER_MEMBERSHIP_SLUG_SET.has(
    normalized,
  );
}

/**
 * Published Program documentation slugs that intentionally omit explorer
 * membership until a dedicated IA lane wires them (PS-300 Interfaces for
 * `api`). Keep these out of {@link FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG}
 * and out of the Program documentation explorer tree so page-only lanes can
 * publish without Lane A map edits. Direct URL, section index, and search
 * still work for these pages.
 */
export const DEFERRED_DOCUMENTATION_EXPLORER_MEMBERSHIP_SLUGS = [
  "api",
] as const;

export type DeferredDocumentationExplorerMembershipSlug =
  (typeof DEFERRED_DOCUMENTATION_EXPLORER_MEMBERSHIP_SLUGS)[number];

const DEFERRED_DOCUMENTATION_EXPLORER_MEMBERSHIP_SLUG_SET = new Set<string>(
  DEFERRED_DOCUMENTATION_EXPLORER_MEMBERSHIP_SLUGS,
);

/** True when a documentation slug is published but explorer membership is deferred. */
export function isDeferredDocumentationExplorerMembershipSlug(
  slug: string,
): boolean {
  return DEFERRED_DOCUMENTATION_EXPLORER_MEMBERSHIP_SLUG_SET.has(slug);
}

/**
 * Explicit three-level Program documentation explorer membership by page slug.
 * FAQ is a top-level explorer page and is intentionally omitted here.
 * W18 documentation move-stub slugs (see DOCUMENTATION_ROUTE_MIGRATION_LEDGER)
 * are also omitted — they keep static compatibility HTML but are not explorer
 * destinations. Mode A overviews in
 * `MODE_A_PROGRAM_OVERVIEW_PENDING_EXPLORER_MEMBERSHIP_SLUGS` and deferred
 * membership slugs (see {@link DEFERRED_DOCUMENTATION_EXPLORER_MEMBERSHIP_SLUGS})
 * are likewise omitted until their IA lanes wire them.
 *
 * Locked PS-100 demotions (install, throttling-and-limits, architecture-of-system,
 * petri, troubleshooting, security-trust-boundaries, contributing-to-these-docs)
 * are intentionally omitted from Program membership; later Lane A stories place
 * them under Reference / Internal architecture / Miscellanea / Guides.
 *
 * Factory configuration pages use full `factories/...` docsSlug keys so
 * Operations → Configuring can nest them without route moves (render injection
 * is a later story).
 *
 * Groups with declared secondaries assign exactly one secondary per slug;
 * other groups place pages directly under the top group.
 */
export const FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG = {
  "what-is-you-agent-factory": { group: "orientation" },
  "harness-support": { group: "capabilities" },
  "submitting-work": { group: "capabilities" },
  "replays-records": { group: "capabilities" },
  "packaged-documents": { group: "capabilities" },
  cli: { group: "interfaces" },
  mcp: { group: "interfaces" },
  logs: { group: "operations" },
  metrics: { group: "operations" },
  "dashboard-ui-overview": { group: "operations" },
  resources: { group: "operations", secondary: "configuring" },
  "factories/configuration": {
    group: "operations",
    secondary: "configuring",
  },
  "factories/global-configuration": {
    group: "operations",
    secondary: "configuring",
  },
} as const satisfies Record<string, DocumentationSidebarMembership>;

/**
 * Published documentation slugs intentionally demoted from Program explorer
 * membership under locked PS-100 (still published at existing routes).
 */
export const PROGRAM_DOCUMENTATION_DEMOTED_SLUGS = [
  "install",
  "throttling-and-limits",
  "architecture-of-system",
  "petri",
  "troubleshooting",
  "security-trust-boundaries",
  "contributing-to-these-docs",
] as const;

export type FactoryDocumentationSidebarSlug =
  keyof typeof FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG;

/**
 * Top-group-only view of Program documentation membership for callers that
 * only need the top group id. Prefer
 * `FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG` when secondary placement
 * matters; the documentation sidebar adapter nests secondaries from that map.
 */
export const FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG = Object.fromEntries(
  (
    Object.entries(FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG) as Array<
      [
        FactoryDocumentationSidebarSlug,
        (typeof FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG)[FactoryDocumentationSidebarSlug],
      ]
    >
  ).map(([slug, membership]) => [slug, membership.group]),
) as {
  readonly [Slug in FactoryDocumentationSidebarSlug]: (typeof FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG)[Slug]["group"];
};

export type SidebarGroupingSection = keyof typeof SIDEBAR_GROUP_LABELS;

type SidebarGroupLabelMap = typeof SIDEBAR_GROUP_LABELS;

export type SidebarGroupIdBySection = {
  [Section in SidebarGroupingSection]: keyof SidebarGroupLabelMap[Section];
};

export type SidebarGrouping = Partial<{
  [Section in SidebarGroupingSection]: SidebarGroupIdBySection[Section];
}>;

export const SIDEBAR_GROUPING_SECTIONS_BY_KIND = {
  concept: ["glossary", "concepts"],
} as const;

export type SidebarGroupingKind =
  keyof typeof SIDEBAR_GROUPING_SECTIONS_BY_KIND;

export type SidebarGroupingValidationIssue = {
  path: [section: SidebarGroupingSection | string];
  message: string;
};

type SidebarGroupingRecordByKind = {
  concept: ConceptsSidebarRecord;
};

type GlossarySidebarRecord = {
  primaryClassificationId?: string;
  secondaryClassificationIds?: readonly string[];
  sidebarGrouping?: SidebarGrouping;
};

type ConceptsSidebarRecord = GlossarySidebarRecord & {
  slug?: string;
};

type DocumentationSidebarRecord = {
  slug?: string;
  sidebarGrouping?: SidebarGrouping;
};

export type SidebarGroupingSource =
  (typeof SIDEBAR_GROUPING_PRECEDENCE)[number];

export type SidebarGroupResolution<
  GroupId extends string = string,
  Source extends SidebarGroupingSource = SidebarGroupingSource,
> = {
  groupId: GroupId;
  source: Source;
};

export function getSidebarGroupingSectionsForKind(
  kind: SidebarGroupingKind,
): readonly SidebarGroupingSection[] {
  return SIDEBAR_GROUPING_SECTIONS_BY_KIND[kind];
}

export function getSidebarGroupIdsForSection<
  Section extends SidebarGroupingSection,
>(section: Section): readonly SidebarGroupIdBySection[Section][] {
  return Object.keys(
    SIDEBAR_GROUP_LABELS[section],
  ) as SidebarGroupIdBySection[Section][];
}

export function isSidebarGroupingSection(
  value: string,
): value is SidebarGroupingSection {
  return value in SIDEBAR_GROUP_LABELS;
}

export function getSidebarGroupLabel<Section extends SidebarGroupingSection>(
  section: Section,
  groupId: SidebarGroupIdBySection[Section],
): string {
  return SIDEBAR_GROUP_LABELS[section][groupId] as string;
}

export function isDocumentationSidebarSecondaryGroup(
  groupId: DocumentationTopGroupId,
): groupId is DocumentationSidebarSecondaryGroupId {
  return groupId in DOCUMENTATION_SIDEBAR_SECONDARY_LABELS;
}

export function getDocumentationSidebarSecondaryIdsForGroup<
  Group extends DocumentationSidebarSecondaryGroupId,
>(groupId: Group): readonly DocumentationSidebarSecondaryId<Group>[] {
  return Object.keys(
    DOCUMENTATION_SIDEBAR_SECONDARY_LABELS[groupId],
  ) as DocumentationSidebarSecondaryId<Group>[];
}

export function getDocumentationSidebarSecondaryLabel<
  Group extends DocumentationSidebarSecondaryGroupId,
>(groupId: Group, secondaryId: DocumentationSidebarSecondaryId<Group>): string {
  return DOCUMENTATION_SIDEBAR_SECONDARY_LABELS[groupId][secondaryId] as string;
}

export function getDocumentationSidebarMembership(
  slug: string,
):
  | (typeof FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG)[FactoryDocumentationSidebarSlug]
  | undefined {
  return FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG[
    slug as FactoryDocumentationSidebarSlug
  ];
}

function createSidebarGroupResolution<
  GroupId extends string,
  Source extends SidebarGroupingSource,
>(groupId: GroupId, source: Source): SidebarGroupResolution<GroupId, Source> {
  return {
    groupId,
    source,
  };
}

function getCanonicalClassificationMembership(
  record: Pick<
    GlossarySidebarRecord | ConceptsSidebarRecord,
    "primaryClassificationId" | "secondaryClassificationIds"
  >,
): Set<string> {
  const membership = new Set<string>();

  for (const rawClassificationId of [
    record.primaryClassificationId,
    ...(record.secondaryClassificationIds ?? []),
  ]) {
    if (!rawClassificationId) {
      continue;
    }

    membership.add(rawClassificationId);
  }

  return membership;
}

function resolveOntologyGlossarySidebarGroup(
  record: GlossarySidebarRecord,
):
  | SidebarGroupResolution<
      SidebarGroupIdBySection["glossary"],
      "derived-taxonomy"
    >
  | undefined {
  const membership = getCanonicalClassificationMembership(record);

  if (
    membership.has("classification.concept.math") ||
    membership.has("classification.concept.training") ||
    membership.has("classification.concept.evaluation") ||
    membership.has("classification.concept.architecture.activation")
  ) {
    return createSidebarGroupResolution(
      "math-and-training",
      "derived-taxonomy",
    );
  }

  return undefined;
}

function resolveEditorialGlossarySidebarGroup(
  record: GlossarySidebarRecord,
):
  | SidebarGroupResolution<
      SidebarGroupIdBySection["glossary"],
      "editorial-sidebar-grouping"
    >
  | undefined {
  const editorialGroup = record.sidebarGrouping?.glossary;
  if (editorialGroup) {
    return createSidebarGroupResolution(
      editorialGroup,
      "editorial-sidebar-grouping",
    );
  }

  return createSidebarGroupResolution(
    "model-taxonomy",
    "editorial-sidebar-grouping",
  );
}

export function resolveGlossarySidebarGroupWithSource(
  record: GlossarySidebarRecord,
): SidebarGroupResolution<SidebarGroupIdBySection["glossary"]> | undefined {
  return (
    resolveOntologyGlossarySidebarGroup(record) ??
    resolveEditorialGlossarySidebarGroup(record)
  );
}

function resolveFactoryAssignedConceptsSidebarGroup(
  record: ConceptsSidebarRecord,
):
  | SidebarGroupResolution<
      SidebarGroupIdBySection["concepts"],
      "derived-taxonomy"
    >
  | undefined {
  const slug = record.slug;
  if (!slug) {
    return undefined;
  }

  const groupId =
    FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG[slug as FactoryConceptsSidebarSlug];
  if (!groupId) {
    return undefined;
  }

  return createSidebarGroupResolution(groupId, "derived-taxonomy");
}

function resolveEditorialConceptsSidebarGroup(
  record: ConceptsSidebarRecord,
):
  | SidebarGroupResolution<
      SidebarGroupIdBySection["concepts"],
      "editorial-sidebar-grouping"
    >
  | undefined {
  const editorialGroup = record.sidebarGrouping?.concepts;
  if (!editorialGroup) {
    return undefined;
  }

  return createSidebarGroupResolution(
    editorialGroup,
    "editorial-sidebar-grouping",
  );
}

export function resolveConceptsSidebarGroupWithSource(
  record: ConceptsSidebarRecord,
): SidebarGroupResolution<SidebarGroupIdBySection["concepts"]> | undefined {
  return (
    resolveFactoryAssignedConceptsSidebarGroup(record) ??
    resolveEditorialConceptsSidebarGroup(record)
  );
}

function resolveFactoryAssignedDocumentationSidebarGroup(
  record: DocumentationSidebarRecord,
):
  | SidebarGroupResolution<
      SidebarGroupIdBySection["documentation"],
      "derived-taxonomy"
    >
  | undefined {
  const slug = record.slug;
  if (!slug) {
    return undefined;
  }

  const membership = getDocumentationSidebarMembership(slug);
  if (!membership) {
    return undefined;
  }

  return createSidebarGroupResolution(membership.group, "derived-taxonomy");
}

function resolveEditorialDocumentationSidebarGroup(
  record: DocumentationSidebarRecord,
):
  | SidebarGroupResolution<
      SidebarGroupIdBySection["documentation"],
      "editorial-sidebar-grouping"
    >
  | undefined {
  const editorialGroup = record.sidebarGrouping?.documentation;
  if (!editorialGroup) {
    return undefined;
  }

  return createSidebarGroupResolution(
    editorialGroup,
    "editorial-sidebar-grouping",
  );
}

export function resolveDocumentationSidebarGroupWithSource(
  record: DocumentationSidebarRecord,
):
  | SidebarGroupResolution<SidebarGroupIdBySection["documentation"]>
  | undefined {
  return (
    resolveFactoryAssignedDocumentationSidebarGroup(record) ??
    resolveEditorialDocumentationSidebarGroup(record)
  );
}

export function resolveGlossarySidebarGroup(
  record: GlossarySidebarRecord,
): SidebarGroupIdBySection["glossary"] | undefined {
  return resolveGlossarySidebarGroupWithSource(record)?.groupId;
}

export function resolveConceptsSidebarGroup(
  record: ConceptsSidebarRecord,
): SidebarGroupIdBySection["concepts"] | undefined {
  return resolveConceptsSidebarGroupWithSource(record)?.groupId;
}

export function resolveDocumentationSidebarGroup(
  record: DocumentationSidebarRecord,
): SidebarGroupIdBySection["documentation"] | undefined {
  return resolveDocumentationSidebarGroupWithSource(record)?.groupId;
}

export function validateSidebarGroupingForRecord(
  kind: SidebarGroupingKind,
  recordId: string,
  record: SidebarGroupingRecordByKind[SidebarGroupingKind],
): SidebarGroupingValidationIssue[] {
  const { sidebarGrouping } = record;
  if (!sidebarGrouping) {
    return [];
  }

  const issues: SidebarGroupingValidationIssue[] = [];
  const allowedSections = new Set(getSidebarGroupingSectionsForKind(kind));

  for (const [section, rawValue] of Object.entries(sidebarGrouping)) {
    if (typeof rawValue !== "string") {
      issues.push({
        path: [section],
        message: `Record ${recordId} defines malformed sidebarGrouping.${section}; expected a string subgroup id.`,
      });
      continue;
    }

    if (!isSidebarGroupingSection(section)) {
      issues.push({
        path: [section],
        message: `Record ${recordId} defines unsupported sidebarGrouping section "${section}".`,
      });
      continue;
    }

    if (!allowedSections.has(section)) {
      issues.push({
        path: [section],
        message: `Record ${recordId} cannot define sidebarGrouping.${section}; ${kind} records only support ${Array.from(
          allowedSections,
        ).join(", ")} subgroup metadata.`,
      });
      continue;
    }

    const allowedValues = getSidebarGroupIdsForSection(section);
    if (!allowedValues.includes(rawValue as never)) {
      issues.push({
        path: [section],
        message: `Record ${recordId} defines unsupported sidebarGrouping.${section} value "${rawValue}". Allowed values: ${allowedValues.join(", ")}.`,
      });
    }
  }

  if (issues.length > 0) {
    return issues;
  }

  const redundantOntologyGroup = sectionHasRedundantConceptSidebarGrouping(
    record,
    sidebarGrouping,
  );

  if (redundantOntologyGroup) {
    issues.push({
      path: [redundantOntologyGroup.section],
      message: `Record ${recordId} defines redundant sidebarGrouping.${redundantOntologyGroup.section} = "${redundantOntologyGroup.editorialGroup}". Factory assignment or canonical classification membership already resolves this subgroup to "${redundantOntologyGroup.ontologyGroup}". Remove the editorial override until the placement model needs a true exception.`,
    });
  }

  return issues;
}

function sectionHasRedundantConceptSidebarGrouping(
  record: ConceptsSidebarRecord,
  sidebarGrouping: SidebarGrouping,
):
  | {
      section: "concepts" | "glossary";
      editorialGroup: string;
      ontologyGroup: string;
    }
  | undefined {
  const conceptsEditorialGroup = sidebarGrouping.concepts;
  if (conceptsEditorialGroup) {
    const ontologyGroup = resolveConceptsSidebarGroupWithSource({
      ...record,
      sidebarGrouping: undefined,
    });
    if (ontologyGroup?.groupId === conceptsEditorialGroup) {
      return {
        section: "concepts",
        editorialGroup: conceptsEditorialGroup,
        ontologyGroup: ontologyGroup.groupId,
      };
    }
  }

  const glossaryEditorialGroup = sidebarGrouping.glossary;
  if (glossaryEditorialGroup) {
    const ontologyGroup = resolveGlossarySidebarGroupWithSource({
      ...record,
      sidebarGrouping: undefined,
    });
    if (ontologyGroup?.groupId === glossaryEditorialGroup) {
      return {
        section: "glossary",
        editorialGroup: glossaryEditorialGroup,
        ontologyGroup: ontologyGroup.groupId,
      };
    }
  }

  return undefined;
}
