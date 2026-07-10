# Architecture

## Purpose

This document describes how content files, registry data, localized messages,
asset references, search indexes, website components, markdown structure, and
validation scripts work together for **you-agent-factory docs**.

The site is a static-first Next.js App Router application using Fumadocs for MDX
documentation, Orama for search, React Flow and Recharts (via `factory-ui`) when
a page needs a graph or chart, Tailwind and shadcn/ui for interface components,
and Bun/Biome for the local toolchain.

This is the documentation site for the you-agent-factory CLI and agent-factory
workflow system — guides, concepts, techniques, documentation (including CLI,
harness support, configuration, MCP, and API), glossary, blog, and search. It is
not the retired Model Atlas / Model Reference product. Atlas-era package trees,
PDF set contracts, and recursive module-graph atlas machinery are not the
primary architecture for this product.

## System Overview

```txt
Shared MDX page structure         Machine-readable JSON registry
src/content/docs/**/page.mdx      src/content/registry
src/content/blog/**/page.mdx             |
       |                                |
       v                                v
Colocated messages                Registry validation
messages/<locale>.json            scripts/validate-registry.ts
       |                                |
       v                                v
Colocated asset config            Fumadocs source + registry loaders
assets.json                       source.config.ts
       |                           src/lib/content
       +------------+-------------------+
                    |
                    v
        localized page model and search documents
                    |
        +-----------+------------+
        |                        |
        v                        v
  rendered pages            Orama search index
  src/app/(site)/docs       src/app/api/search
  src/app/(site)/blog       src/features/docs/search
        |                        |
        +-----------+------------+
                    |
                    v
             website experience
             docs, blog, search, cards,
             optional graphs/charts
```

Primary factory collections under `src/content/docs` are `guides`, `concepts`,
`techniques`, `documentation`, and `glossary`, plus `blog` as a separate
narrative surface. See [data-model.md](./data-model.md) for the storage contract
and [site-fundamentals.md](./site-fundamentals.md) for the product shell.

## Content Layers

### MDX Page Structure

MDX files define page structure. They contain frontmatter, component order,
registry references, message keys, asset IDs, citations, and structural
cross-links.

Canonical docs pages should not contain raw user-visible prose. Section titles,
section bodies, callout text, graph labels, chart captions, image alt text, code
schemas, comparison table values, and other display values resolve through
colocated messages, registry records, or asset config. Blog posts are the
exception because they are narrative documents rather than reusable reference
templates.

Template authoring guidance lives in sidecar files under `docs/templates`. The
production `*.mdx` template defines structure; `<kind>.content.md` explains how
to write the page; `<kind>.messages.en.json` provides the starter default-locale
message shape; `<kind>.assets.json` provides the starter asset config. Generated
docs pages should not copy authoring guidance into `page.mdx`.

Factory docs pages live under:

```txt
src/content/docs/
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
    cli/
    harness-support/
    configuration/
  glossary/
```

Blog posts live under:

```txt
src/content/blog/
  comparing-agent-factories/
    page.mdx
    messages/
      en.json
    assets.json
```

MDX frontmatter links page structure to structured data through `registryId`.
Localized display metadata and body text come from colocated message files.
Concrete image, graph, chart, and media values come from colocated asset config
when a page needs them (`assets.json` may be `{}`).

### Localized Messages

Page-specific localized values live next to the page:

```txt
src/content/docs/documentation/cli/
  page.mdx
  messages/
    en.json
    vi.json
```

Message files provide localized titles, descriptions, summaries, section
headings, section bodies, callouts, captions, and alt text. Shared UI chrome
uses common message files outside the page tree.

### Asset Config

Structured files reference asset IDs rather than concrete file paths or graph
values. Colocated `assets.json` files resolve those IDs when media is present:

```txt
src/content/docs/guides/getting-started/
  assets.json
  assets/
    getting-started-hero.png
```

Many factory pages ship an empty `assets.json` (`{}`) until they need media.
Asset config resolves images, generated images, graph IDs, chart IDs, captions,
alt text keys, dimensions, and other display values. Components consume resolved
assets, not raw string paths scattered through MDX.

### JSON Registry

Registry JSON files are the structured source of truth for search metadata,
semantic relationships, factory records, optional graph/table data, related
links, and validation.

Primary factory registry folders:

```txt
src/content/registry/
  guides/
  concepts/
  techniques/
  documentation/
  citations/
  tags/
  classifications/
  graphs/
  tables/
```

Factory-facing record kinds for new product pages are `guide`, `concept`,
`technique`, and `documentation` (for example `guide.getting-started`,
`concept.harness`, `technique.ralph`, `documentation.cli`,
`documentation.harness-support`). Glossary pages use frontmatter
`kind: "glossary"` with a backing `concept.<slug>` record.

The registry stores stable IDs, slugs, aliases, tags, relationships, citations,
and type-specific fields. It should be easy for agents to generate and easy for
humans to review in diffs. Legacy Atlas entity folders may still exist during
migration; they are not the primary product inventory for new factory pages.

### TypeScript Schemas

TypeScript schema files define the registry contract:

```txt
src/lib/content/schemas.ts
src/lib/content/registry.ts
src/lib/content/messages.ts
src/lib/content/assets.ts
```

The schemas validate JSON records, message files, and asset config. They provide
inferred types to components, loaders, optional graph/chart renderers, and
search builders. Zod or an equivalent TypeScript-first schema library should be
used.

### First-Class Factory Surfaces

Architecture treats these documentation surfaces as first-class, not secondary
to Atlas entity pages:

* **CLI workflows** — install, run named workflows, sessions, submitting work,
  and related documentation pages under `documentation/` and guides under
  `guides/`.
* **Harness support** — harness matrix and support docs (for example
  `documentation.harness-support`) that explain which harnesses the factory
  supports.
* **Factory records** — registry-backed `guide.*`, `concept.*`, `technique.*`,
  and `documentation.*` records that drive search, related links, and
  validation for the product collections.

## Build-Time Flow

### 1. Load Content

Fumadocs loads MDX page structures from `src/content/docs`. Blog loading may use
the same source pattern or a separate collection, but should reuse the same MDX
component mapping for code, math, callouts, tables, citations, and diagrams.

The content loaders read page structure, colocated messages, colocated asset
config, and registry records, then build lookup maps:

```txt
id -> record
slug -> record
tag -> tag record
registryId -> page
page -> messages by locale
page -> asset config
record id -> related records
record id -> citations
```

### 2. Validate Registry Data

`scripts/validate-registry.ts` / `make validate-data` validates the registry
before the site builds.

It should verify:

* JSON shape matches the TypeScript/Zod schema.
* IDs and slugs are unique.
* File paths match record kind.
* Relationship IDs resolve.
* Tags resolve to tag records.
* Published docs pages have valid `registryId` values where required.
* Published registry records have matching canonical MDX pages unless marked
  data-only.
* Published pages have default-locale message files.
* Required message keys exist for the page template.
* Canonical docs MDX does not contain raw user-visible prose outside approved
  structural components.
* Asset references resolve to concrete config values when assets are declared.
* Asset alt text and caption keys resolve through messages.
* Referenced graph or table records are valid when used.

### 3. Validate Links

`scripts/validate-links.ts` / `make linkcheck` uses the Fumadocs Validate Links
integration with `next-validate-link`.

It checks:

* Next.js routes.
* Fumadocs docs routes.
* Blog routes.
* Relative MDX links.
* Heading anchors.
* Custom MDX components with `href` props.

### 4. Build Search Documents

Search documents are derived from MDX page structure, localized messages, asset
metadata, and registry records.

MDX structure contributes:

* route URL
* frontmatter tags
* registry references
* component structure

Localized messages contribute:

* title
* description
* headings
* body text
* captions
* alt text when useful for discovery

Registry topology contributes:

* primary and secondary classification membership
* ancestor and root classification ancestry for ontology-backed pages
* related topology ids and relationship types used for filtering and reranking

Search scope and reranking should consume that same topology runtime directly.
Classification scope resolution may bind to primary, secondary, ancestor, or
root classifications, then prefer exact classification matches first,
descendants second, and direct ontology relationships ahead of generic sibling
matches when the shared peer policy says the relationship outranks siblings.

Registry records contribute:

* stable `registryId`
* aliases
* canonical tags
* page kind (`guide`, `concept`, `technique`, `documentation`, and related)
* classification membership when present
* relationship IDs
* citation IDs

Asset config contributes when present:

* graph IDs
* image IDs
* chart IDs
* captions and alt text through message keys

The result is a normalized search document:

```txt
MDX page structure + locale messages + asset config + registry record
  -> SearchDocument -> Orama index
```

Orama handles retrieval. The registry remains the authority for relationships.

## Runtime Flow

### Page Rendering

Route files in `src/app` should compose data loaders and feature components:

```txt
src/app/(site)/page.tsx
src/app/(site)/docs/[[...slug]]/page.tsx
src/app/(site)/blog/page.tsx
src/app/(site)/blog/[slug]/page.tsx
src/app/(site)/search/page.tsx
src/app/(site)/tags/...
```

The route layer should stay thin. It loads validated page structure, locale
messages, resolved assets, and registry records, then passes a localized page
model to feature components.

### Docs Components

`src/features/docs` owns docs-specific presentation:

* MDX component mappings
* table of contents
* callouts
* citations
* related links
* search dialog and search page
* docs cards and index lists
* previous/next navigation
* page-local teaching components (for example harness support matrix)

Docs components consume validated localized page data, resolved assets, and
registry data. They should not parse registry JSON, read message files directly,
resolve asset paths manually, or infer relationships from raw prose.

### Blog Components

`src/features/blog` owns blog-specific presentation:

* blog index
* post layout
* post cards
* author metadata
* date metadata
* tag lists
* related docs

Blog posts should link back to canonical docs pages for stable definitions.

### Factory UI (Optional Graphs And Charts)

`src/features/factory-ui` owns thin host wrappers for shared graph, chart, and
data-display primitives used when a factory page needs a teaching diagram or
comparison chart.

Factory UI components:

* re-export package graph/chart primitives for rewrite-era pages
* do not own Atlas model/module viewers or recursive module-atlas contracts
* are optional — many factory pages render without graphs or charts

There is no mandatory `src/features/models` Atlas viewer package-tree contract
for this product. When a page needs a graph, React Flow receives graph data that
has already been validated and normalized; visual quality comes from semantic
node/edge styles and readable layout, not from React Flow defaults alone.

## Search Architecture

Search uses Fumadocs Orama as the default engine.

The search stack has three layers:

```txt
1. Orama full-text retrieval
2. Registry-derived facets and filters
3. Registry relationship enrichment
```

### Full-Text Retrieval

Orama indexes:

* titles
* descriptions
* headings
* body text
* aliases
* tag names
* tag aliases

This supports normal user queries like `getting started`, `ralph`,
`harness support`, `worktree`, and `you run --named`.

### Tags And Facets

Tags are a general search mechanism. They are controlled registry records and
appear in both MDX frontmatter and JSON registry records.

Search UI filters should be built from registry fields relevant to factory
docs:

* page kind (`guide`, `concept`, `technique`, `documentation`, blog, …)
* tags
* classification membership when present

The search dialog may use Fumadocs tag filtering for simple filters, and
registry-derived client filtering for richer facets.

Tag pages provide a browsing surface for broad topics:

```txt
/tags
/tags/<slug>
```

Tag pages derive their lists from registry data and MDX frontmatter. They should
group results by page kind so a reader can scan guides, concepts, techniques,
documentation pages, glossary entries, and blog posts associated with the same
tag.

### Semantic Relationships

Relationship fields such as `relatedIds`, typed ontology edges, and
classification membership may be indexed into Orama for result enrichment.

However, relationship truth stays in the registry. Multi-hop questions should be
answered by registry traversal first, then search can retrieve or rank candidate
pages.

Example:

```txt
User query:
  techniques related to write-review loops

Registry traversal:
  guide.write-review-loops -> related technique / concept records

Search ranking:
  rank matching technique and concept pages by text, aliases, tags, and summaries
```

### Derived Related Documents

Related-document sections are derived from taxonomy, tags, and typed registry
fields. They answer questions like:

```txt
If I am reading Getting Started, what nearby guides and docs should I open next?
```

The registry should not require every page to manually list every nearby page.
Instead, related resources are derived from ontology-first sources in this
order:

* direct ontology relationships
* same-classification siblings
* shared-parent classification peers

Compatibility-only fallbacks may still exist for records without usable
ontology peer data, but they are not the default contract. Those fallback
inputs may include:

* `conceptType` (for concept-backed pages)
* `tags`
* `relatedIds`

Page components render those relationships as grouped sections when data
exists:

```txt
Direct relationships
Same classification
Shared parent classification
Shared tag
Curated related links
```

`relatedIds` remains an override for high-value links that cannot be derived
from ontology or classification data. Factory pages often start with empty
`relatedIds` and empty tags; curated MDX links remain valid while ontology
coverage grows.

MDX can introduce the section, but the component should read the registry and
derive the current related documents.

## Optional Graphs, Charts, And Tables

Graphs, charts, and tables are optional teaching assets for factory docs. They
are not a mandatory recursive module-atlas contract for every page.

When a page needs a diagram, harness matrix, or comparison chart:

* declare a page-local asset in `assets.json`, or
* point at a reusable registry graph/table record when the structure is shared,
  or
* use a page-local teaching component (for example the harness support matrix)

Web graph rendering uses React Flow through `src/features/factory-ui` when a
graph asset is present. Chart rendering uses the factory-ui chart wrappers when
a chart asset is present.

Validation should fail when a referenced graph ID, table ID, chart ID, or print
renderer configuration cannot be resolved. Pages with empty `assets.json` do not
require graphs, charts, or tables.

Print/PDF export paths and recursive module-graph atlas contracts from the
retired Model Atlas product are not the primary architecture for factory docs.
If print helpers remain in the toolchain as stubs or migration leftovers, they
are not required package-tree or content contracts for new factory pages.

## CI And Quality Gates

Production build output is guarded against Turbopack NFT whole-project
filesystem tracing warnings; see
[turbopack-nft-tracing-warning-closure.md](./turbopack-nft-tracing-warning-closure.md)
for detector locations, guarded pattern families, and maintenance notes.

The root `make ci` command should run:

```txt
make lint
make typecheck
make test
make coverage
make validate-data
make linkcheck
make build
```

Contributor verification for architecture and authoring work should use current
paths:

* `make validate-data` — registry, messages, assets, and page-bundle correctness
* `make linkcheck` — internal docs and route links
* `bun run check:retired-product-docs` — owned architecture/authoring docs do
  not reintroduce retired product names or retired public route families
  (exclusion/denylist wording is allowed)
* `bun run audit:retired-ai-content-infrastructure` — deleted Atlas content
  infrastructure (retired routes, kinds, owned paths) is not reintroduced;
  factory provider / external-model configuration wording remains allowed
* `make typecheck` / `make lint` / tests — code quality
* browser verification of published factory routes (for example
  `/docs/guides/getting-started` or `/docs/documentation/cli`)

Required tool ownership:

* Biome owns linting and formatting; CI should run Biome in check mode rather
  than write mode.
* Bun owns tests and coverage.
* TypeScript owns type checking.
* Fumadocs and `next-validate-link` own docs link validation.
* Registry validation owns JSON data correctness.

## Design Principle

Do not let runtime components discover meaning by scraping prose or raw file
paths.

The registry defines meaning. MDX defines structure. Messages provide localized
values. Asset config resolves concrete media and optional graph/chart
references. Search indexes the resolved page model. Components render validated
data.
