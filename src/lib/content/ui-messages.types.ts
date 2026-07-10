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
 * Shell-level UI messages: search, navigation, language selector, and layout chrome.
 * Reusable across generic documentation shells without AI domain topology/timeline copy.
 */
export type ShellMessages = {
  search: SearchMessages;
  nav: NavMessages;
  language: LanguageMessages;
  shell: ShellLayoutMessages;
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
};

/** Dedicated search entry page copy within the docs surface. */
export type SearchEntryMessages = {
  title: string;
  description: string;
  canonicalNote: string;
  tagFilterDescription: string;
  classificationScopeDescription: string;
  emptySuggestionGqa: string;
  emptySuggestionAttentionLinkLabel: string;
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

/** Ontology timeline page copy for the AI domain pack. */
export type TimelinePageMessages = {
  title: string;
  description: string;
  eyebrow: string;
  successSummary: string;
  loadingTitle: string;
  loadingDescription: string;
  errorTitle: string;
  errorDescription: string;
  selectorLabel: string;
  eventCountLabel: string;
  regionLabel: string;
  docsLink: string;
  sourcePrefix: string;
  emptyTitle: string;
  emptyDescription: string;
  activationLink: string;
};

/** Classification labels used by topology browse surfaces. */
export type TopologyBrowseClassificationLabels = {
  activationFunctions: string;
  attentionMechanisms: string;
  feedForwardNetworks: string;
  normalizationLayers: string;
  positionEncodingMethods: string;
  tokenizationMethods: string;
  transformerBlockStructures: string;
};

/** Topology browse page copy for the AI domain pack. */
export type TopologyBrowseMessages = {
  titleTemplate: string;
  descriptionTemplate: string;
  navigationLabelTemplate: string;
  graphMapLabel: string;
  timelineLabel: string;
  classificationLabels: TopologyBrowseClassificationLabels;
  classificationSummaries: TopologyBrowseClassificationLabels;
  classificationSelectorTitle: string;
  classificationSelectorDescription: string;
  classificationSelectorLabel: string;
  selectedClassificationLabel: string;
  selectedModeLabel: string;
  membersTitle: string;
  graphMapDescription: string;
  timelineDescription: string;
  invalidTitle: string;
  invalidDescription: string;
  invalidClassificationLabel: string;
  invalidModeLabel: string;
  missingValue: string;
  emptyTitle: string;
  emptyDescription: string;
  validOptionsTitle: string;
  memberListLabel: string;
  classificationChildrenLabel: string;
  recordChildrenLabel: string;
  directMembersLabel: string;
  totalMembersLabel: string;
};

/** Factory collection index landing pages (guides, concepts, techniques, documentation). */
export type AiCollectionIndexMessages = {
  conceptsIndex: SectionIndexMessages;
  guidesIndex: SectionIndexMessages;
  techniquesIndex: SectionIndexMessages;
  documentationIndex: SectionIndexMessages;
};

/** AI tag index, landing, and category labels for the domain pack. */
export type AiTagMessages = {
  tagsIndex: TagsIndexMessages;
  tagLanding: TagLandingMessages;
  tagCategories: Record<string, string>;
};

/**
 * AI domain UI messages: topology browse, timeline page, collection indexes,
 * and tag surfaces. The retired `/topology` explorer `topologyPrototype`
 * message block is intentionally absent from the public product surface.
 * Excludes generic shell search, nav, language, and layout chrome.
 */
export type AiDomainMessages = AiCollectionIndexMessages &
  AiTagMessages & {
    timelinePage: TimelinePageMessages;
    topologyBrowse: TopologyBrowseMessages;
  };

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
  "timelinePage",
  "shell",
  "home",
  "browseIndex",
  "topologyBrowse",
  "conceptsIndex",
  "guidesIndex",
  "techniquesIndex",
  "documentationIndex",
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
 * Compatibility surface composing shell, docs, and AI domain message boundaries.
 * Preserves the exact top-level shape consumed by existing layout, search,
 * navigation, browse, topology, timeline, tags, and page-kind helpers.
 */
export type UiMessagesCompatibility = ShellMessages &
  DocsMessages &
  AiDomainMessages;

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
