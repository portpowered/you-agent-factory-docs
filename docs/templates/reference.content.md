# Reference Template Authoring Guide

Use `reference.mdx` as the production page structure for pages under
`/docs/references/<slug>` (including nested child slugs such as
`/docs/references/<parent>/<child>`). Put localized reader-facing text in
`messages/<locale>.json` using the keys from `reference.messages.en.json`. Put
page-specific visual references in `assets.json` using `reference.assets.json`
when a later page needs media.

Follow [docs writing standards](../../factory/docs/standards/docs-writing-standards.md) for layperson tone and isolation-first writing.

## Route family vs page kind

`references` is a direct public route family. Its frontmatter and registry kind
is `reference`, and placeholder registry ids use the `reference.` namespace (for
example `reference.example-reference`).

Route slug is independent from frontmatter/registry kind. Other direct route
families reuse the `documentation` page kind under a different public prefix:

| Public route family | Content root | Frontmatter / registry kind | Template |
| --- | --- | --- | --- |
| `references` | `src/content/docs/references/` | `reference` | `reference.mdx` |
| `factories` | `src/content/docs/factories/` | `documentation` | `documentation.mdx` |
| `workers` | `src/content/docs/workers/` | `documentation` | `documentation.mdx` |
| `workstations` | `src/content/docs/workstations/` | `documentation` | `documentation.mdx` |

Author factories, workers, and workstations pages with `documentation.mdx`,
`kind: "documentation"`, and `documentation.<slug>` registry ids, while placing
the page bundle under the matching route-family content root. Do not invent
parallel `factory` / `worker` / `workstation` page kinds for those URLs.

## Required Content

* `title`: canonical reference topic name.
* `description`: short search and metadata description.
* `openingSummary`: optional lead copy when the page benefits from it. If used, keep it to one concise block and prefer it over legacy split summary keys.

## Sections

* `whatItCovers`: define the reference surface and what readers can look up here.
* `keyConcepts`: introduce the terms, objects, or schemas the page depends on before usage details.
* `howToUse`: explain how readers apply the reference (lookup patterns, fields, or workflows).
* `limitsAndAssumptions`: state scope boundaries, unsupported cases, and assumptions readers must not miss.
* `related`, `tags`, `references`: localized section titles only; rendered content is registry-backed.

## Nested child slugs

Nested pages under a route family use more than one slug segment after the
family prefix (for example `src/content/docs/workers/agent/variant/`). Keep the
same template and kind contract; only the content path and URL deepen.

## Assets

* Baseline reference templates ship with an empty `assets.json`. Add diagrams or tables only when they teach the reference surface better than prose.

## Baseline exclusions

* No `callouts.readerShortcut` in the reference template or converged pages.
* No separate `problemStatement` / `coreIdea` keys in new starter bundles. If lead copy is needed, use `openingSummary`.
* No in-body `# <T k="title" />` heading; the docs shell renders the page title once.
* No authoring instructions in production MDX; keep them in this `.content.md` sidecar.

## Registry Expectations

Canonical taxonomy authoring for reference pages should start with
`primaryClassificationId`, optional `secondaryClassificationIds`, and
`relationships`. Use [the ontology convergence plan](../temp/ontology-classification-topology-convergence-plan.md)
for the staged deprecation matrix.

The reference registry record should still include useful `tags`, aliases,
citations, and curated `relatedIds` only when derived relationships are
insufficient. Placeholder registry ids use the `reference.` namespace.
