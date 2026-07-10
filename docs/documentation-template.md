# Documentation Template Contract

Docs pages are shared MDX structures that combine registry-backed React components,
message-key references, and asset references. Localized prose lives in colocated
`messages/<locale>.json` files next to each page.

This site is **you-agent-factory docs**. New product pages start from rewrite-era
factory templates (`guide`, `technique`, `documentation`, `concept`, `glossary`,
and `blog-post`). Atlas authoring templates for model, module, paper,
training-regime, and system are removed from the maintained inventory.

For canonical docs pages, templates should be production-shaped. They should not
contain authoring instructions, placeholder body prose, hard-coded section
headings, raw callout titles, manually written comparison lists, inline schema
examples, or concrete media paths. Those values belong in colocated messages,
registry records, or asset config. The template itself defines order and
component shape only.

Blog templates are the exception. Blog posts may contain raw MDX prose because
they are narrative, time-specific writing rather than reusable reference
structure. Blog posts should still use messages and assets when they need
localization or reusable media.

## Default factory templates

Use the page-kind template that matches the factory collection:

```txt
docs/templates/guide.mdx
docs/templates/technique.mdx
docs/templates/documentation.mdx
docs/templates/concept.mdx
docs/templates/glossary.mdx
docs/templates/blog-post.mdx
```

| Kind | Collection / route | Registry id shape |
| --- | --- | --- |
| `guide` | `/docs/guides/<slug>` | `guide.<slug>` |
| `technique` | `/docs/techniques/<slug>` | `technique.<slug>` |
| `documentation` | `/docs/documentation/<slug>` | `documentation.<slug>` |
| `concept` | `/docs/concepts/<slug>` | `concept.<slug>` |
| `glossary` | `/docs/glossary/<slug>` | `concept.<slug>` (frontmatter `kind: "glossary"`) |
| `blog-post` | `/blog/<slug>` | related docs via `relatedDocIds` |

Factory collections use matching route prefixes under `src/content/docs/`. Those
templates follow the same production-shaped contract: structure in MDX, prose
keys in messages, authoring guidance in `.content.md` sidecars only.

Glossary entries use `glossary.mdx` with colocated content under
`src/content/docs/glossary/<slug>/` and render at `/docs/glossary/<slug>`. They
share the concept registry record shape (`concept.<slug>`) and the same section
structure as concept pages; only frontmatter `kind` and the docs route differ.

Each template has sidecar files:

```txt
docs/templates/<kind>.content.md       # authoring guide, not copied into production pages
docs/templates/<kind>.messages.en.json # starter default-locale message file
docs/templates/<kind>.assets.json      # starter page asset config
```

When creating a canonical docs page, use the `.mdx` file as the page structure,
copy the starter message file to `messages/en.json`, copy the starter asset
config to `assets.json`, and use the `.content.md` guide to fill in the values.
Do not paste `.content.md` prose into `page.mdx`.

For concepts and glossary entries, starter authoring guidance should describe
`primaryClassificationId`, `secondaryClassificationIds`, and `relationships` as
the preferred taxonomy shape when those fields are in use. Legacy fields such as
`conceptType` and `sidebarGrouping` are on the staged deprecation path described
in
[ontology-classification-topology-convergence-plan](./temp/ontology-classification-topology-convergence-plan.md)
and should not be presented as the preferred path for new starter content unless
a current compatibility workflow still requires them.

Guide, technique, and documentation records are base records with optional
ontology membership. Placeholder registry ids use the matching namespace, for
example `guide.getting-started`, `technique.ralph`, or
`documentation.harness-support`.

## Required Pattern

Canonical docs pages should include:

* frontmatter with `kind`, `registryId`, `messageNamespace`, `assetNamespace`,
  `status`, `tags`, `aliases`, and `updatedAt`
* `messageNamespace` and `assetNamespace` references, usually `local`
* optional lead copy in messages when the page benefits from it; if used, prefer
  one concise `openingSummary` key instead of split `problemStatement` /
  `coreIdea` keys (see [writing standards](../factory/docs/standards/docs-writing-standards.md))
* no in-body `# <T k="title" />` heading; the docs shell renders the page title
  once
* registry-backed related docs, tags, and citations where relevant
* page-kind-specific sections from the matching factory template
* derived related documents through `DerivedRelatedDocs` where useful
* references through `CitationList`

The page structure should support a reader who lands on the page directly from
search and should teach the topic without depending on adjacent pages.

* Introductory sections should define the topic in isolation before narrowing
  into one implementation context.
* Section order should move from definition -> value -> mechanism -> comparison
  -> tradeoffs (or the kind-specific equivalent in the template sidecar).
* Avoid templates that force authors to restate the same idea in multiple
  adjacent sections.
* Narrative sections should stay focused on the concept itself, not on the page,
  nearby pages, or the documentation structure.

Production docs pages should render sections through localized section
components, for example:

```mdx
<Section id="what-it-covers" titleKey="sections.whatItCovers.title">
  <T k="sections.whatItCovers.body" />
</Section>
```

When a section needs a graph, chart, diagram, image, or table, reference an
`assetId` instead of writing the value inline. Factory pages commonly use
`PageAsset` or a dedicated teaching component:

```mdx
<PageAsset assetId="tokenFlow" />
<HarnessSupportMatrix />
```

Use real factory registry ids in related, tag, and citation components:

```mdx
<RelatedDocs registryId="documentation.harness-support" />
<TagPillList registryId="concept.worktree" showDescriptions />
<CitationList registryId="guide.getting-started" />
```

### Optional graph and table placement

* Most factory pages ship with an empty `assets.json` (`{}`). Add media only when
  it teaches the workflow, concept, technique, or reference surface better than
  prose.
* **Documentation** pages: place a diagram or matrix in the section that teaches
  the lookup surface (for example a harness support matrix or token-flow
  diagram).
* **Technique** pages: optional flow or comparison graph inside How it works or
  Compared to nearby techniques when visualization clarifies the loop or
  decision process.
* **Concept** and **glossary** pages: optional concept-map or flow graph only
  inside the section that teaches relationships—not as decoration.
* **Guide** pages: optional screenshots or workflow diagrams only when they help
  the reader complete the steps.

Follow [graphing-standards](./graphing-standards.md) when a page does include a
graph. Symbol-only math definitions belong with equations when a factory topic
needs them; see [writing standards](../factory/docs/standards/docs-writing-standards.md).

Blog posts should include:

* frontmatter with `messageNamespace`, `assetNamespace`, `publishedAt`,
  `updatedAt`, `authors`, `tags`, `relatedDocIds`, and `status`
* colocated `messages/<locale>.json` files for narrative context
* colocated `assets.json` when the post uses page-specific images, graphs, or
  media
* links back to canonical factory docs pages (guides, concepts, techniques,
  documentation, glossary)
* related docs through `BlogRelatedDocs`

Blog posts may use `blog-post.content.md` as an outline, but unlike canonical
docs pages they may keep narrative prose in the MDX file when localization is
not required.

## Component Rule

Use MDX components for structured information that comes from the registry or
dedicated factory teaching surfaces:

* related docs and derived related docs
* tag lists
* citations
* optional page assets (graphs, charts, tables, images)
* dedicated reference components such as `HarnessSupportMatrix` when a
  documentation page needs a fixed teaching matrix

Use message components for localized user-facing text. Use asset components or
resolved asset props for page-specific media. Do not hard-code localized body
prose, section headings, callout titles, alt text, captions, inline schemas,
comparison table values, or concrete asset paths directly in shared MDX unless
there is a documented exception.

For pages that include graphs, reference graph assets by `assetId`. Graph node
labels, edge labels, summaries, captions, and alt text should resolve from
colocated messages. Graphs must use the readable node theme and zoom/pan
interaction rules in [graphing-standards](./graphing-standards.md).

Baseline templates must not include `callouts.readerShortcut` unless
[writing standards](../factory/docs/standards/docs-writing-standards.md)
documents a justified exception.

Do not hand-maintain lists of related pages when the same result can be derived
from registry data, tags, taxonomy fields, or `relatedIds` overrides.

## Search Rule

Search depends on frontmatter and registry data. Keep these fields accurate:

* `registryId`
* `kind`
* `tags`
* `aliases`
* page headings

Localized search values come from page messages. Asset captions and alt text
should be indexed only after resolving asset config and message keys.

Tags should be broad browsing and filtering paths. Use tag pages for topic-wide
exploration, such as `/tags/harness` or `/tags/workflows`.

## References

Use citation registry records for technical claims. The rendered page should use
`CitationList` instead of hand-formatting source lists when possible.

## Related docs

* [data-model.md](./data-model.md) — factory collections, registry records, messages, assets
* [guide-to-writing-pages.md](./guide-to-writing-pages.md) — authoring workflow
* [architecture.md](./architecture.md) — how pages load and render
* [site-fundamentals.md](./site-fundamentals.md) — product frame and shell
