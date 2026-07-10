# Documentation Template Authoring Guide

Use `documentation.mdx` as the production page structure. Put localized reader-facing text in `messages/<locale>.json` using the keys from `documentation.messages.en.json`. Put page-specific visual references in `assets.json` using `documentation.assets.json` when a later page needs media.

Follow [docs writing standards](../../factory/docs/standards/docs-writing-standards.md) for layperson tone and isolation-first writing.

## Required Content

* `title`: canonical documentation topic name.
* `description`: short search and metadata description.
* `openingSummary`: optional lead copy when the page benefits from it. If used, keep it to one concise block and prefer it over legacy split summary keys.

## Sections

* `whatItCovers`: define the documentation surface and what readers can look up here.
* `keyConcepts`: introduce the terms, objects, or commands the page depends on before usage details.
* `howToUse`: explain how readers apply the documentation (commands, options, workflows, or lookup patterns).
* `limitsAndAssumptions`: state scope boundaries, unsupported cases, and assumptions readers must not miss.
* `related`, `tags`, `references`: localized section titles only; rendered content is registry-backed.

## Assets

* Baseline documentation templates ship with an empty `assets.json`. Add diagrams or tables only when they teach the reference surface better than prose.

## Baseline exclusions

* No `callouts.readerShortcut` in the documentation template or converged pages.
* No separate `problemStatement` / `coreIdea` keys in new starter bundles. If lead copy is needed, use `openingSummary`.
* No in-body `# <T k="title" />` heading; the docs shell renders the page title once.
* No authoring instructions in production MDX; keep them in this `.content.md` sidecar.

## Registry Expectations

Canonical taxonomy authoring for documentation pages should start with
`primaryClassificationId`, optional `secondaryClassificationIds`, and
`relationships`. Use [the ontology convergence plan](../temp/ontology-classification-topology-convergence-plan.md)
for the staged deprecation matrix.

The documentation registry record should still include useful `tags`, aliases,
citations, and curated `relatedIds` only when derived relationships are
insufficient. Placeholder registry ids use the `documentation.` namespace (for
example `documentation.harness-support`).
