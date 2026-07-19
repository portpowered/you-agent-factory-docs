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
    "system-feature-set": "System feature set",
    interfaces: "Interfaces",
    "packaged-factories": "Packaged factories",
    "factory-configuration": "Factory Configuration",
    "system-operations": "System Operations",
    "internal-architecture": "Internal Architecture",
    "additional-references": "Additional references",
  },
} as const;

/**
 * Nested secondaries under Program documentation top groups that need a third
 * explorer level. Groups absent here list pages directly under the top group.
 */
export const DOCUMENTATION_SIDEBAR_SECONDARY_LABELS = {
  "factory-configuration": {
    workers: "Workers",
    workstations: "Workstations",
    factories: "Factories",
    resources: "Resources",
  },
  "system-operations": {
    observability: "Observability",
  },
} as const;

/**
 * Flat English defaults for `explorer.documentationSecondaries` catalogs.
 * Keys must stay aligned with nested `DOCUMENTATION_SIDEBAR_SECONDARY_LABELS`
 * values (Workers/Workstations/Factories collide with top-level explorer
 * folders by design; Resources and Observability are secondary-only).
 */
export const DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS = {
  workers:
    DOCUMENTATION_SIDEBAR_SECONDARY_LABELS["factory-configuration"].workers,
  workstations:
    DOCUMENTATION_SIDEBAR_SECONDARY_LABELS["factory-configuration"]
      .workstations,
  factories:
    DOCUMENTATION_SIDEBAR_SECONDARY_LABELS["factory-configuration"].factories,
  resources:
    DOCUMENTATION_SIDEBAR_SECONDARY_LABELS["factory-configuration"].resources,
  observability:
    DOCUMENTATION_SIDEBAR_SECONDARY_LABELS["system-operations"].observability,
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

type DocumentationMembershipWithoutSecondary = {
  readonly group: Exclude<
    DocumentationTopGroupId,
    DocumentationSidebarSecondaryGroupId
  >;
};

type DocumentationMembershipWithSecondary = {
  readonly [Group in DocumentationSidebarSecondaryGroupId]: {
    readonly group: Group;
    readonly secondary: DocumentationSidebarSecondaryId<Group>;
  };
}[DocumentationSidebarSecondaryGroupId];

export type DocumentationSidebarMembership =
  | DocumentationMembershipWithoutSecondary
  | DocumentationMembershipWithSecondary;

/**
 * Explicit three-level Program documentation explorer membership by page slug.
 * FAQ is a top-level explorer page and is intentionally omitted here.
 * Groups with declared secondaries assign exactly one secondary per slug;
 * other groups place pages directly under the top group.
 */
export const FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG = {
  "dynamic-workflows": { group: "system-feature-set" },
  "harness-support": { group: "system-feature-set" },
  "replays-records": { group: "system-feature-set" },
  "submitting-work": { group: "system-feature-set" },
  cli: { group: "interfaces" },
  "cli-command-index": { group: "interfaces" },
  "api-doc": { group: "interfaces" },
  mcp: { group: "interfaces" },
  "packaged-factories": { group: "packaged-factories" },
  "packaged-documents": { group: "packaged-factories" },
  workers: { group: "factory-configuration", secondary: "workers" },
  "poller-workers": { group: "factory-configuration", secondary: "workers" },
  "script-workers": { group: "factory-configuration", secondary: "workers" },
  "agent-workers": { group: "factory-configuration", secondary: "workers" },
  "inference-workers": {
    group: "factory-configuration",
    secondary: "workers",
  },
  "mock-workers": { group: "factory-configuration", secondary: "workers" },
  workstations: {
    group: "factory-configuration",
    secondary: "workstations",
  },
  configuration: {
    group: "factory-configuration",
    secondary: "factories",
  },
  "factory-session": {
    group: "factory-configuration",
    secondary: "factories",
  },
  "global-configuration-factories": {
    group: "factory-configuration",
    secondary: "factories",
  },
  resources: { group: "factory-configuration", secondary: "resources" },
  "throttling-and-limits": {
    group: "factory-configuration",
    secondary: "resources",
  },
  logs: { group: "system-operations", secondary: "observability" },
  metrics: { group: "system-operations", secondary: "observability" },
  "architecture-of-system": { group: "internal-architecture" },
  petri: { group: "internal-architecture" },
  "what-is-you-agent-factory": { group: "additional-references" },
  install: { group: "additional-references" },
  "contributing-to-these-docs": { group: "additional-references" },
  "dashboard-ui-overview": { group: "additional-references" },
  "security-trust-boundaries": { group: "additional-references" },
  troubleshooting: { group: "additional-references" },
} as const satisfies Record<string, DocumentationSidebarMembership>;

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
