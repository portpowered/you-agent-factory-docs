# Guide Template Authoring Guide

Use `guide.mdx` as the production page structure. Put localized reader-facing text in `messages/<locale>.json` using the keys from `guide.messages.en.json`. Put page-specific visual references in `assets.json` using `guide.assets.json` when a later page needs media.

Follow [docs writing standards](../../factory/docs/standards/docs-writing-standards.md) for layperson tone and isolation-first writing.

## Required Content

* `title`: canonical guide name.
* `description`: short search and metadata description.
* `openingSummary`: optional lead copy when the page benefits from it. If used, keep it to one concise block and prefer it over legacy split summary keys.

## Sections

* `whatItIs`: define the guide topic without assuming the reader already knows the surrounding workflow.
* `whenToUse`: explain when this guide applies and what outcome it helps the reader reach.
* `stepsOrWorkflow`: walk through the concrete steps or workflow the reader should follow.
* `commonPitfalls`: call out mistakes, edge cases, or failure modes readers hit when applying the guide.
* `related`, `tags`, `references`: localized section titles only; rendered content is registry-backed.

## Assets

* Baseline guide templates ship with an empty `assets.json`. Add graph, image, or table assets only when a later authored page needs them to teach the workflow.

## Baseline exclusions

* No `callouts.readerShortcut` in the guide template or converged pages.
* No separate `problemStatement` / `coreIdea` keys in new starter bundles. If lead copy is needed, use `openingSummary`.
* No in-body `# <T k="title" />` heading; the docs shell renders the page title once.
* No authoring instructions in production MDX; keep them in this `.content.md` sidecar.

## Registry Expectations

Canonical taxonomy authoring for guides should start with
`primaryClassificationId`, optional `secondaryClassificationIds`, and
`relationships`. Use [the ontology convergence plan](../temp/ontology-classification-topology-convergence-plan.md)
for the staged deprecation matrix.

The guide registry record should still include useful `tags`, aliases, citations,
and curated `relatedIds` only when derived relationships are insufficient.
Placeholder registry ids use the `guide.` namespace (for example
`guide.example-guide`).
