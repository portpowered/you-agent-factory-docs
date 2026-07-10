# Data Model

## Purpose

The data model is the source of truth for factory docs content: guides, concepts,
techniques, documentation pages, glossary entries, tags, citations, and optional
graph or table teaching assets.

This site is **you-agent-factory docs**, not the retired Model Atlas / Model
Reference product. Atlas entity inventories (models, modules, papers, training
regimes, systems) may still exist in the codebase during migration, but they are
not the primary product contract for new factory pages.

The website has three content layers:

1. MDX pages under `src/content/docs` and `src/content/blog` define page
   structure, component order, and references to registry records, message keys,
   and asset IDs.
2. JSON registry records under `src/content/registry` contain the structured data
   used by search, related links, filters, and validation.
3. Colocated message and asset config files next to each page provide localized
   text and concrete asset values.

Every important published docs page should link to a registry record through a
stable `registryId`. The registry is authoritative for relationships and search
facets; prose and display assets should not be scraped to infer core meaning.

## Storage Layout

Primary factory collections and supporting registry folders:

```txt
src/content/
  docs/
    guides/
      getting-started/
        page.mdx
        messages/
          en.json
          vi.json
        assets.json
    concepts/
    techniques/
    documentation/
    glossary/
  blog/
    example-post/
      page.mdx
      messages/
        en.json
      assets.json
  registry/
    guides/
    concepts/
    techniques/
    documentation/
    citations/
    tags/
    graphs/
    tables/
src/lib/content/
  schemas.ts
  registry.ts
  messages.ts
  assets.ts
scripts/
  validate-registry.ts
```

Registry files are JSON. TypeScript defines schemas and inferred types.
Validation should use Zod or an equivalent TypeScript-first schema library.

Primary docs collections for the product are `guides`, `concepts`,
`techniques`, `documentation`, and `glossary`, plus `blog` as a separate
narrative surface. See
[documentation-site-pages-needed.md](./documentation-site-pages-needed.md) for
the page inventory and [site-fundamentals.md](./site-fundamentals.md) for the
shell frame.

## Common Record Fields

Every registry record has these fields:

```ts
type RegistryKind =
  | "guide"
  | "concept"
  | "technique"
  | "documentation"
  | "classification"
  | "citation"
  | "tag"
  | "graph"
  | "model"
  | "module"
  | "paper"
  | "training-regime"
  | "system"
  | "dataset"
  | "hardware"
  | "organization";

type RegistryStatus = "draft" | "published" | "archived";

type BaseRecord = {
  id: string;
  slug: string;
  kind: RegistryKind;
  defaultTitleKey: string;
  defaultSummaryKey: string;
  aliases: string[];
  tags: string[];
  relatedIds: string[];
  citationIds: string[];
  status: RegistryStatus;
  createdAt: string;
  updatedAt: string;
};
```

Factory-facing kinds for new product pages are `guide`, `concept`,
`technique`, and `documentation`. Glossary pages use frontmatter
`kind: "glossary"` with a backing `concept.<slug>` registry record. Remaining
kinds such as `model`, `module`, and `paper` are legacy Atlas inventory, not the
default authoring path.

Rules:

* `id` is stable, kebab-case, and namespaced by kind, such as
  `guide.getting-started`, `concept.worktree`, `technique.ralph`, or
  `documentation.cli`.
* `slug` is route-safe and does not include the route prefix.
* `defaultTitleKey` points to the localized title in the relevant page or
  registry message file.
* `defaultSummaryKey` points to the localized short summary suitable for search
  results and cards.
* `aliases` includes abbreviations, spelling variants, and common names, such as
  `Quickstart`, `ralph`, or `you CLI`.
* `tags` are controlled search metadata, not casual labels.
* `relatedIds` is an optional curated override for high-value links that cannot
  be derived from shared tags or typed relationships.
* `citationIds` points to citation records that support factual claims.

## Classification Contract

Classification records are ontology-first and use canonical dotted ids under the
`classification.*` namespace when a page or record participates in ontology
membership.

Examples relevant to factory content:

* `classification.concept`
* `classification.concept.systems`
* `classification.guide`
* `classification.technique`

Rules:

* `parentClassificationId` is the explicit hierarchy edge. Tree shape must not
  be inferred from string prefixes alone.
* Content records should prefer canonical `primaryClassificationId` and
  `secondaryClassificationIds` values when a slice has migrated.
* Temporary compatibility for legacy flat ids must be expressed explicitly on
  the classification record through `legacyIds`; do not treat legacy ids as the
  canonical contract.
* Runtime consumers should canonicalize legacy ids through
  `resolveClassificationId(...)` when needed.
* New factory content should not introduce fresh legacy flat ids.

## Page Model

MDX pages define structure and references. Canonical docs pages should not
contain raw user-visible prose. They should reference localized text through
message keys and reference media, graphs, charts, code schemas, and tables
through asset IDs or registry-backed components when those teaching assets are
useful. Blog posts may contain raw MDX prose because they are narrative content.

Published factory docs pages should include:

```yaml
---
kind: guide
registryId: guide.getting-started
messageNamespace: local
assetNamespace: local
tags: []
status: published
updatedAt: 2026-07-09
---
```

Other factory examples:

* `kind: concept` with `registryId: concept.worktree`
* `kind: technique` with `registryId: technique.ralph`
* `kind: documentation` with `registryId: documentation.cli`
* `kind: glossary` with `registryId: concept.<slug>` (glossary route, concept
  registry record)

Frontmatter rules:

* `registryId` must resolve to an existing registry record for published
  canonical docs pages that explain a factory entity.
* `kind` must match the registry record kind when `registryId` is present,
  except glossary pages, which use frontmatter `kind: "glossary"` with a
  `concept.*` registry id.
* `messageNamespace: local` means localized values resolve from the colocated
  `messages/<locale>.json` files next to the page.
* `assetNamespace: local` means asset references resolve from the colocated
  `assets.json` file next to the page.
* `tags` must resolve to tag records when present.
* MDX pages should reference localized strings through translation components
  such as `T`, not hard-code user-facing body copy.
* Section headings should resolve through message keys, for example
  `<Section id="what-it-is" titleKey="sections.whatItIs.title">`.
* Code schemas, comparison tables, diagrams, charts, and images should resolve
  from `assetId` values or registry-backed components rather than inline MDX
  values when used.
* MDX pages may include structural links and components, but canonical related
  links should come from registry relationships when practical.

Rewrite-era template authoring files live under `docs/templates`:

```txt
guide.mdx
technique.mdx
documentation.mdx
concept.mdx
glossary.mdx
blog-post.mdx
```

Each kind also has sidecars:

```txt
<kind>.content.md
<kind>.messages.en.json
<kind>.assets.json
```

The `.mdx` file is production page structure. The `.content.md` file explains how
to fill the page and should not be copied into `src/content/docs`. The
`.messages.en.json` and `.assets.json` files are starter shapes for colocated
page files.

Use these factory templates as the default authoring path. Atlas authoring
templates (model, module, paper, training-regime, system) are removed from the
maintained inventory.

The frontmatter schema for docs pages is:

```ts
type PageFrontmatter = {
  kind:
    | "guide"
    | "concept"
    | "technique"
    | "documentation"
    | "glossary"
    | "model"
    | "module"
    | "paper"
    | "training-regime"
    | "system";
  registryId: string;
  messageNamespace: "local" | string;
  assetNamespace: "local" | string;
  tags: string[];
  aliases?: string[];
  status: RegistryStatus;
  updatedAt: string;
};
```

Blog posts have separate frontmatter:

```yaml
---
messageNamespace: local
assetNamespace: local
publishedAt: 2026-07-09
updatedAt: 2026-07-09
authors:
  - site-team
tags:
  - foundations
relatedDocIds:
  - guide.getting-started
  - documentation.cli
status: published
---
```

## Factory Record Shapes

Guide, technique, and documentation records are base records with optional
release metadata and ontology membership:

```ts
type GuideRecord = BaseRecord & {
  kind: "guide";
  primaryClassificationId?: string;
  secondaryClassificationIds?: string[];
  relationships?: Array<{
    relationshipType: string;
    targetId: string;
  }>;
};

type TechniqueRecord = BaseRecord & {
  kind: "technique";
  primaryClassificationId?: string;
  secondaryClassificationIds?: string[];
  relationships?: Array<{
    relationshipType: string;
    targetId: string;
  }>;
};

type DocumentationRecord = BaseRecord & {
  kind: "documentation";
  primaryClassificationId?: string;
  secondaryClassificationIds?: string[];
  relationships?: Array<{
    relationshipType: string;
    targetId: string;
  }>;
};
```

Concept records (also used by glossary pages) add concept-specific fields:

```ts
type ConceptRecord = BaseRecord & {
  kind: "concept";
  conceptType:
    | "architecture"
    | "math"
    | "training"
    | "inference"
    | "systems"
    | "evaluation"
    | "general";
  prerequisiteIds: string[];
  explainsIds: string[];
};
```

Examples of live factory ids:

* `guide.getting-started`
* `guide.using-you-agent-factory-for-loops`
* `concept.harness`, `concept.loop`, `concept.worktree`
* `technique.ralph`, `technique.planner-executor`, `technique.writer-reviewer`
* `documentation.cli`, `documentation.harness-support`, `documentation.configuration`

## Localized Messages

Localized page values live next to the page they serve:

```txt
src/content/docs/guides/getting-started/
  page.mdx
  messages/
    en.json
    vi.json
  assets.json
```

Example message file:

```json
{
  "title": "Getting Started",
  "description": "Install you-agent-factory, start a factory, and submit your first work.",
  "openingSummary": "This quickstart walks install, first factory start, and first submit so you can run the CLI end to end.",
  "sections": {
    "whatItIs": {
      "title": "What It Is",
      "body": "Getting started is the short path from installing the CLI to submitting your first work against a running factory."
    },
    "whenToUse": {
      "title": "When To Use",
      "body": "Use this guide when you are installing for the first time or verifying the install → run → submit loop on a new machine."
    }
  }
}
```

Message rules:

* The default locale message file is required for every published page.
* Message files are content values, not structure. They should not define
  component order, registry IDs, graph IDs, or relationship rules.
* Message keys should be stable because MDX pages and components reference them.
* Long localized body sections may use MDX-capable strings or a controlled
  rich-text format once the renderer supports it.
* Shared UI strings live in global common message files, but page-specific text
  lives next to the page.

Message files should satisfy this general shape:

```ts
type PageMessages = {
  title: string;
  description: string;
  openingSummary?: string;
  problemStatement?: string;
  coreIdea?: string;
  sections?: Record<
    string,
    {
      title: string;
      body?: string;
    }
  >;
  callouts?: Record<string, { title?: string; body: string }>;
  assets?: Record<string, { alt?: string; caption?: string }>;
};
```

## Asset References

Structured files should reference assets by ID. Concrete asset values are
resolved from config files.

Many factory pages ship an empty `assets.json` (`{}`) until they need media.
Tables and graphs are optional teaching tools: use them when they clarify a
workflow, harness matrix, or concept — not as mandatory recursive atlas
machinery for every page.

Example colocated page asset config when media is useful:

```json
{
  "hero": {
    "type": "image",
    "src": "./assets/getting-started-hero.png",
    "altKey": "assets.hero.alt"
  },
  "workflowOverview": {
    "type": "graph",
    "graphId": "graph.getting-started-workflow",
    "webRenderer": "react-flow",
    "printRenderer": "mermaid"
  },
  "harnessMatrix": {
    "type": "table",
    "tableId": "table.harness-support",
    "captionKey": "assets.harnessMatrix.caption"
  }
}
```

Asset rules:

* MDX pages and registry records reference asset IDs such as `hero` or
  `workflowOverview`.
* `src/lib/content/assets.ts` resolves asset IDs into concrete values such as
  image paths, graph IDs, chart config, alt text keys, and dimensions.
* Localized asset text, such as alt text and captions, resolves through page
  messages using keys like `assets.hero.alt`.
* Reusable graph or table records live in the registry when they describe shared
  structure; page-local images, charts, diagrams, code schemas, and comparison
  tables are declared in colocated `assets.json`.
* Validation fails when an asset ID, graph ID, chart ID, table ID, schema ID,
  file path, alt text key, or caption key cannot be resolved.

Asset config should satisfy this general shape:

```ts
type PageAssetConfig = Record<string, PageAsset>;

type PageAsset =
  | {
      type: "image";
      src: string;
      altKey: string;
      captionKey?: string;
      width?: number;
      height?: number;
    }
  | {
      type: "graph";
      graphId: string;
      webRenderer: "react-flow";
      printRenderer: "vertical-svg" | "mermaid" | "image";
      printFallbackAssetId?: string;
      altKey?: string;
      captionKey?: string;
    }
  | {
      type: "chart";
      chartId: string;
      altKey?: string;
      captionKey?: string;
    }
  | {
      type: "table";
      tableId: string;
      captionKey?: string;
    }
  | {
      type: "code-schema";
      schemaId: string;
      language?: string;
      captionKey?: string;
    };
```

## Tag Model

Tags are a general search mechanism and a controlled vocabulary. They power
search recall, result filters, related-page suggestions, and topic browsing.

```ts
type TagRecord = BaseRecord & {
  kind: "tag";
  category:
    | "architecture"
    | "module-type"
    | "training"
    | "inference"
    | "systems"
    | "modality"
    | "paper-topic"
    | "model-family"
    | "difficulty";
  parentTagId?: string;
  searchBoost?: number;
  landingPage:
    | "search"
    | "generated-tag-page"
    | "custom-doc-page";
  customPageId?: string;
};
```

Tag rules:

* Tags are stored as registry records under `src/content/registry/tags`.
* Every tag used by MDX frontmatter or registry records must exist as a tag
  record.
* Tags should be lowercase kebab-case in JSON, such as `foundations`,
  `inference`, or `alignment`.
* Tags should include aliases when users commonly search another phrase.
* Tags may form a shallow hierarchy through `parentTagId`.
* Search UI filters should use tag records for labels, categories, and ordering.
* Tags are not replacements for typed fields or collection kind. A guide is
  still a guide; tags help discovery across page kinds.
* Each tag should have a browsable destination. By default this is
  `/tags/<slug>` or `/search?tag=<slug>`.
* Tag pages enumerate published docs pages, blog posts, and registry-backed
  records associated with the tag, grouped by kind when useful.

## Derived Related Documents

Related-document sections should derive peers from shared ontology relationships
and classification membership when present, then fall back to shared tags and
curated `relatedIds`.

Primary peer sources, in order:

* direct ontology relationships
* sibling records in the same classification branch
* records that only share the same parent classification
* shared tags
* curated `relatedIds` overrides

Relationship precedence over generic classification siblings includes
`variant`, `part-of`, and `explains` when those relationships exist.

Policy rules:

* Shared tags remain a broad discovery signal and should rank below ontology
  relationships and classification membership when those exist.
* `relatedIds` remains a curated escape hatch for exceptions taxonomy and
  ontology still cannot express cleanly.
* Related UI should label why records appear using explainable reasons when
  practical.
* Factory pages often start with empty `relatedIds` and empty tags; curated
  links and structural MDX links are still valid while ontology coverage grows.

## Citation Record

```ts
type CitationRecord = BaseRecord & {
  kind: "citation";
  citationType:
    | "paper"
    | "blog"
    | "documentation"
    | "repository"
    | "dataset"
    | "other";
  authors: string[];
  title: string;
  year?: number;
  url: string;
  accessedAt?: string;
  mla: string;
};
```

Citation rules:

* Technical claims in published pages should point to citation records when
  citations are required for the claim.
* Citation records should provide MLA text for page references.
* External URLs should be stable canonical sources when possible, such as
  official docs, project repositories, or publisher pages.

## Optional Graphs And Tables

Graphs and tables are optional teaching assets for factory docs. They are not a
mandatory recursive module-atlas contract for every page.

When a page needs a diagram or comparison matrix:

* declare a page-local asset in `assets.json`, or
* point at a reusable registry graph/table record when the structure is shared

Web graph rendering uses React Flow as the interaction engine when a graph asset
is present. Visual consistency comes from semantic node and edge styles plus a
readable layout, not from React Flow defaults alone.

Validation should fail when a referenced graph ID, table ID, node registry ID,
or print renderer configuration cannot be resolved. Pages with empty
`assets.json` do not require graphs or tables.

## Search Index Contract

The search index is derived from MDX pages plus registry records. A normalized
search document should include:

```ts
type SearchDocument = {
  id: string;
  registryId?: string;
  url: string;
  kind: string;
  title: string;
  description: string;
  bodyText: string;
  headings: string[];
  aliases: string[];
  tags: string[];
  relatedIds: string[];
  facets: {
    kind: string;
    tags: string[];
    primaryClassificationId?: string;
    primaryClassificationSlug?: string;
    classificationIds?: string[];
    classificationSlugs?: string[];
    ancestorClassificationIds?: string[];
    ancestorClassificationSlugs?: string[];
    rootClassificationIds?: string[];
    rootClassificationSlugs?: string[];
    relatedTopologyIds?: string[];
    relationshipTypes?: string[];
  };
  topology: {
    primaryClassificationId?: string;
    secondaryClassificationIds: string[];
    classificationIds?: string[];
    ancestorClassificationIds?: string[];
    rootClassificationIds?: string[];
    relatedTopologyIds?: string[];
  };
};
```

Search rules:

* Full-text search indexes title, description, headings, body text, aliases, and
  tag aliases.
* Facets come from registry fields and tag records, not from prose scraping.
* Ontology-backed pages should publish classification ancestry and related
  topology ids as facets for grouping, filtering, and reranking when present.
* Tags are always indexed as both searchable text and filterable facets.
* Factory kinds (`guide`, `concept`, `technique`, `documentation`, glossary via
  concept records, and blog) are first-class search surfaces.
* Orama handles retrieval. The registry handles canonical relationships and
  related-link generation.

## Validation Rules

`scripts/validate-registry.ts` / `make validate-data` should fail when:

* A JSON record does not match its TypeScript/Zod schema.
* A file path does not match its `kind` and `id`.
* Two records share the same `id` or conflicting `slug`.
* A relationship ID does not resolve to an existing record.
* A tag reference does not resolve to a tag record.
* A published canonical MDX page has no `registryId`.
* A published canonical MDX page has no default-locale message file.
* A shared MDX page references a message key that does not exist in the default
  locale.
* A shared MDX page references an asset ID that does not exist in colocated
  `assets.json`.
* A canonical docs MDX page contains raw user-visible prose outside approved
  structural wrappers, message components, or registry-backed components.
* An asset config references a missing file, graph ID, chart ID, table ID,
  schema ID, alt text key, or caption key.
* A published registry record has no matching MDX page unless it is marked
  data-only.
* A published technical record has no citation where citations are required.
* A record uses an alias or tag spelling that conflicts with an existing
  canonical tag or entity.

Contributor validation for this surface should use current commands such as
`make validate-data`, `make linkcheck`, `make typecheck`, `make lint`, and tests,
plus browser verification of published factory routes (for example
`/docs/guides/getting-started` or `/docs/documentation/cli`).

The root `make ci` command should include registry validation once the
application scaffold exists.
