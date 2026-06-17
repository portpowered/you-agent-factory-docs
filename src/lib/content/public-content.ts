export const SUPPORTED_PUBLIC_CONTENT_KINDS = [
  "docs",
  "blog",
  "glossary",
  "comparison",
  "reference",
] as const;

export type PublicContentKind = (typeof SUPPORTED_PUBLIC_CONTENT_KINDS)[number];

export type PublicContentEntry = {
  canonicalId: string;
  kind: PublicContentKind;
  locale: string;
  slug: string;
  title: string;
};

export type PublicContentGraph = {
  entries: PublicContentEntry[];
};

export const PUBLIC_CONTENT_GRAPH_FIXTURE: PublicContentGraph = {
  entries: [
    {
      canonicalId: "docs.quickstart",
      kind: "docs",
      locale: "en",
      slug: "quickstart",
      title: "Quickstart",
    },
    {
      canonicalId: "blog.agent-review-loops",
      kind: "blog",
      locale: "en",
      slug: "agent-review-loops",
      title: "Agent Review Loops",
    },
    {
      canonicalId: "glossary.canonical-record",
      kind: "glossary",
      locale: "en",
      slug: "canonical-record",
      title: "Canonical Record",
    },
    {
      canonicalId: "comparison.openai-vs-anthropic",
      kind: "comparison",
      locale: "en",
      slug: "openai-vs-anthropic",
      title: "OpenAI vs Anthropic for Agent Workflows",
    },
    {
      canonicalId: "reference.factory-json",
      kind: "reference",
      locale: "en",
      slug: "factory-json",
      title: "factory.json Reference",
    },
  ],
};

export function getPublicContentGraph(): PublicContentGraph {
  return PUBLIC_CONTENT_GRAPH_FIXTURE;
}
