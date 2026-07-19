/** Search dialog copy used by the generic documentation shell. */
export type SearchMessages = {
  open: string;
  placeholder: string;
  close: string;
  idle: string;
  noResults: string;
  loading: string;
  error: string;
  retry: string;
  shortcut: string;
  resultPath: string;
};

/** Primary navigation labels for the generic documentation shell. */
export type NavMessages = {
  home: string;
  search: string;
  menu: string;
  guides: string;
  docs: string;
  architecture: string;
  topology: string;
  blog: string;
  glossary: string;
  timeline: string;
  tags: string;
  /** W15 topology: References family destination label. */
  references: string;
  /** W15 topology: Factories family destination label. */
  factories: string;
  /** W15 topology: Workers family destination label. */
  workers: string;
  /** W15 topology: Workstations family destination label. */
  workstations: string;
};

/** Language selector copy for the generic documentation shell. */
export type LanguageMessages = {
  open: string;
  selectorLabel: string;
  unavailable: string;
  locales: Record<string, string>;
};

/** Sidebar and layout chrome copy for the generic documentation shell. */
export type ShellLayoutMessages = {
  sidebarTitle: string;
  sidebarDescription: string;
  onThisPage: string;
  openingSummary: string;
};

/**
 * Locale-aware docs explorer labels for collection folders and subgroup
 * separators. Page link titles come from page message catalogs instead.
 * Literal CLI/API/MCP identifiers stay untranslated across locales.
 */
export type ExplorerFolderMessages = {
  guides: string;
  concepts: string;
  techniques: string;
  documentation: string;
  references: string;
  factories: string;
  workers: string;
  workstations: string;
};

export type ExplorerConceptsGroupMessages = {
  harnesses: string;
  "industrial-engineering": string;
  "model-inference": string;
};

export type ExplorerDocumentationGroupMessages = {
  "system-feature-set": string;
  interfaces: string;
  "packaged-factories": string;
  "factory-configuration": string;
  "system-operations": string;
  "internal-architecture": string;
  "additional-references": string;
};

/** Nested Program documentation secondary folder labels (Workers, Observability, …). */
export type ExplorerDocumentationSecondaryMessages = {
  workers: string;
  workstations: string;
  factories: string;
  resources: string;
  observability: string;
};

export type ExplorerMessages = {
  folders: ExplorerFolderMessages;
  conceptsGroups: ExplorerConceptsGroupMessages;
  documentationGroups: ExplorerDocumentationGroupMessages;
  documentationSecondaries: ExplorerDocumentationSecondaryMessages;
};

/**
 * W17 Factory-reference chrome: filter, status, badge, empty/error, a11y, and
 * inventory chrome. Literal contract tokens (API / CLI / MCP family ids, method
 * names, tool names, command paths) stay untranslated in catalogs.
 */
export type ReferenceChromeFilterMessages = {
  queryPlaceholder: string;
  lifecycleLabel: string;
  visibilityLabel: string;
  allLifecycles: string;
  allVisibility: string;
  clearFilters: string;
  showingOf: string;
  schemaQueryPlaceholder: string;
  schemaQueryLabel: string;
  schemaNoMatchesTitle: string;
  schemaNoMatchesMessage: string;
  clear: string;
};

export type ReferenceChromeStatusMessages = {
  loadingTitle: string;
  loadingMessage: string;
  emptyTitle: string;
  emptyMessage: string;
  invalidTitle: string;
  invalidMessage: string;
  unsupportedTitle: string;
  unsupportedMessage: string;
};

export type ReferenceChromeBadgeMessages = {
  family: string;
  package: string;
  packageVersion: string;
  sourceArtifact: string;
  sourceCommit: string;
  lifecycle: string;
  visibility: string;
  contractSource: string;
  packageVersionNotPublished: string;
  notPublishedOnProjection: string;
  familyWithLabel: string;
};

export type ReferenceChromeFamilyMessages = {
  api: string;
  schema: string;
  cli: string;
  mcp: string;
  javascript: string;
  events: string;
};

export type ReferenceChromeLifecycleStateMessages = {
  active: string;
  deprecated: string;
  removed: string;
};

export type ReferenceChromeLifecycleSummaryMessages = {
  since: string;
  deprecated: string;
  removed: string;
  successor: string;
};

export type ReferenceChromeVisibilityStateMessages = {
  public: string;
  internal: string;
};

export type ReferenceChromeA11yMessages = {
  copyAnchorLink: string;
  anchorLinkCopied: string;
};

export type ReferenceChromeExampleMessages = {
  authored: string;
  generated: string;
  exampleIndexed: string;
};

export type ReferenceChromeInventoryFamilyMessages = {
  filterLegend: string;
  queryLabel: string;
  queryPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  errorDescription: string;
  filterEmpty: string;
  countOne: string;
  countMany: string;
};

export type ReferenceChromeInventoryMessages = {
  cli: ReferenceChromeInventoryFamilyMessages;
  mcp: ReferenceChromeInventoryFamilyMessages;
  javascript: ReferenceChromeInventoryFamilyMessages;
};

export type ReferenceChromeMessages = {
  filter: ReferenceChromeFilterMessages;
  status: ReferenceChromeStatusMessages;
  badge: ReferenceChromeBadgeMessages;
  families: ReferenceChromeFamilyMessages;
  lifecycleStates: ReferenceChromeLifecycleStateMessages;
  lifecycleSummary: ReferenceChromeLifecycleSummaryMessages;
  visibilityStates: ReferenceChromeVisibilityStateMessages;
  a11y: ReferenceChromeA11yMessages;
  examples: ReferenceChromeExampleMessages;
  inventory: ReferenceChromeInventoryMessages;
};

/**
 * Shell-level UI messages: search, navigation, language selector, layout chrome,
 * docs explorer folder/subgroup labels, and Factory-reference chrome.
 * Reusable across generic documentation shells without retired Atlas topology/timeline copy.
 */
export type ShellMessages = {
  search: SearchMessages;
  nav: NavMessages;
  language: LanguageMessages;
  shell: ShellLayoutMessages;
  explorer: ExplorerMessages;
  referenceChrome: ReferenceChromeMessages;
};

/** Shared section-index copy shape for docs collection landing pages. */
export type SectionIndexMessages = {
  title: string;
  description: string;
  listLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyHomeLink: string;
};

/**
 * Factories family index copy: shared section-index fields plus the
 * isolation-first overview and schema-summary labels used by the
 * factories-owned /docs/factories composition.
 */
export type FactoriesIndexMessages = SectionIndexMessages & {
  overviewTitle: string;
  overviewBody: string;
  schemaSummaryTitle: string;
  schemaSummaryBody: string;
  fullFactorySchemaLink: string;
  fullFactoryApiLink: string;
};

/** Docs home page copy. */
export type HomeMessages = {
  title: string;
  subtitle: string;
  intro: string;
  installSectionTitle: string;
  installMacosLinuxLabel: string;
  installWindowsLabel: string;
  installMacosLinuxCommand: string;
  installWindowsCommand: string;
  runSectionTitle: string;
  runCommandLabel: string;
  runCommand: string;
  whySectionTitle: string;
  whyBody: string;
  featuresSectionTitle: string;
  featuresIntro: string;
  featureHarnesses: string;
  featureLoop: string;
  featureReview: string;
  featurePlanner: string;
  featureCrons: string;
  featureEventStreams: string;
  browseSectionTitle: string;
  guidesLinkTitle: string;
  guidesLinkDescription: string;
  docsLinkTitle: string;
  docsLinkDescription: string;
  glossaryLinkTitle: string;
  glossaryLinkDescription: string;
  blogLinkTitle: string;
  blogLinkDescription: string;
  onThisPageInstall: string;
  onThisPageRun: string;
  onThisPageWhy: string;
  onThisPageFeatures: string;
  onThisPageBrowse: string;
};

/** Browse hub and quick-route copy for the docs index. */
export type BrowseIndexMessages = {
  title: string;
  description: string;
  quickRoutesTitle: string;
  quickRoutesDescription: string;
  searchRouteDescription: string;
  glossaryRouteDescription: string;
  architectureRouteDescription: string;
  tagsRouteDescription: string;
  conceptsSectionTitle: string;
  conceptsSectionDescription: string;
  conceptsSectionLinkLabel: string;
  guidesSectionTitle: string;
  guidesSectionDescription: string;
  guidesSectionLinkLabel: string;
  techniquesSectionTitle: string;
  techniquesSectionDescription: string;
  techniquesSectionLinkLabel: string;
  documentationSectionTitle: string;
  documentationSectionDescription: string;
  documentationSectionLinkLabel: string;
  glossarySectionTitle: string;
  glossarySectionDescription: string;
  glossarySectionLinkLabel: string;
  referencesSectionTitle: string;
  referencesSectionDescription: string;
  referencesSectionLinkLabel: string;
  factoriesSectionTitle: string;
  factoriesSectionDescription: string;
  factoriesSectionLinkLabel: string;
  workersSectionTitle: string;
  workersSectionDescription: string;
  workersSectionLinkLabel: string;
  workstationsSectionTitle: string;
  workstationsSectionDescription: string;
  workstationsSectionLinkLabel: string;
};

/** Dedicated search entry page copy within the docs surface. */
export type SearchEntryMessages = {
  title: string;
  description: string;
  canonicalNote: string;
  tagFilterDescription: string;
  classificationScopeDescription: string;
  emptySuggestionTerm: string;
  emptySuggestionLinkLabel: string;
  emptySuggestionPrefix: string;
  emptySuggestionMiddle: string;
  emptySuggestionSuffix: string;
};

/** Tags index and tag landing copy for docs navigation surfaces. */
export type TagsIndexMessages = {
  title: string;
  description: string;
  listLabel: string;
};

export type TagLandingMessages = {
  listLabel: string;
  searchHandoff: string;
  searchEntryLink: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyHomeLink: string;
  emptyTagsLink: string;
};

/**
 * Generic docs UI messages: home, browse/index hubs, glossary/architecture
 * section indexes, and page-kind labels.
 */
export type DocsMessages = {
  searchEntry: SearchEntryMessages;
  home: HomeMessages;
  browseIndex: BrowseIndexMessages;
  glossaryIndex: SectionIndexMessages;
  architectureIndex: SectionIndexMessages;
  blogIndex: SectionIndexMessages;
  pageKind: Record<string, string>;
};

/** Factory collection index landing pages (guides, concepts, techniques, documentation, and W05 direct route families). */
export type FactoryCollectionIndexMessages = {
  conceptsIndex: SectionIndexMessages;
  guidesIndex: SectionIndexMessages;
  techniquesIndex: SectionIndexMessages;
  documentationIndex: SectionIndexMessages;
  referencesIndex: SectionIndexMessages;
  factoriesIndex: FactoriesIndexMessages;
  workersIndex: SectionIndexMessages;
  workstationsIndex: SectionIndexMessages;
};

/** Tag index, landing, and category labels for factory docs surfaces. */
export type FactoryTagMessages = {
  tagsIndex: TagsIndexMessages;
  tagLanding: TagLandingMessages;
  tagCategories: Record<string, string>;
};

/**
 * Factory docs surface messages: collection indexes and tag surfaces.
 * Excludes generic shell search, nav, language, and layout chrome.
 */
export type FactoryDomainMessages = FactoryCollectionIndexMessages &
  FactoryTagMessages;

/**
 * Top-level message groups retained for current {@link UiMessages} consumers.
 * Used by compatibility tests to verify the composed boundary shape matches
 * the shipped `common.json` contract without migrating consumers.
 */
export const UI_MESSAGES_COMPATIBILITY_KEYS = [
  "search",
  "nav",
  "language",
  "searchEntry",
  "shell",
  "explorer",
  "referenceChrome",
  "home",
  "browseIndex",
  "conceptsIndex",
  "guidesIndex",
  "techniquesIndex",
  "documentationIndex",
  "referencesIndex",
  "factoriesIndex",
  "workersIndex",
  "workstationsIndex",
  "glossaryIndex",
  "architectureIndex",
  "blogIndex",
  "tagsIndex",
  "tagLanding",
  "tagCategories",
  "pageKind",
] as const;

export type UiMessagesCompatibilityKey =
  (typeof UI_MESSAGES_COMPATIBILITY_KEYS)[number];

/**
 * Compatibility surface composing shell, docs, and factory domain message boundaries.
 * Preserves the top-level shape consumed by layout, search, navigation, browse,
 * tags, and page-kind helpers.
 */
export type UiMessagesCompatibility = ShellMessages &
  DocsMessages &
  FactoryDomainMessages;

/** Full shipped UI messages for current consumers. Alias of {@link UiMessagesCompatibility}. */
export type UiMessages = UiMessagesCompatibility;

type _AssertUiMessagesCompatibilityKeys =
  UiMessagesCompatibilityKey extends keyof UiMessagesCompatibility
    ? keyof UiMessagesCompatibility extends UiMessagesCompatibilityKey
      ? true
      : never
    : never;

export function formatPageKind(messages: UiMessages, kind: string): string {
  return messages.pageKind[kind] ?? kind;
}
