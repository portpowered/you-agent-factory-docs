# Technique Template Authoring Guide

Use `technique.mdx` as the production page structure. Put localized reader-facing text in `messages/<locale>.json` using the keys from `technique.messages.en.json`. Put page-specific visual references in `assets.json` using `technique.assets.json` when a later page needs media.

Follow [docs writing standards](../../factory/docs/standards/docs-writing-standards.md) and [graphing-standards](../graphing-standards.md) for layperson tone, isolation-first writing, and optional graph placement.

## Required Content

* `title`: canonical technique name.
* `description`: short search and metadata description.
* `openingSummary`: optional lead copy when the page benefits from it. If used, keep it to one concise block and prefer it over legacy split summary keys.

## Sections

* `whatItIs`: define the technique without assuming the reader already knows the surrounding stack.
* `whyItMatters`: explain what problem the technique solves and why readers should care.
* `howItWorks`: explain the mechanism, loop, or decision process at a high level.
* `comparedToNearbyTechniques`: distinguish nearby techniques readers often mix up.
* `related`, `tags`, `references`: localized section titles only; rendered content is registry-backed.

## Assets

* Baseline technique templates ship with an empty `assets.json`. Add a flow or comparison graph only when visualization teaches the mechanism better than prose.

## Baseline exclusions

* No `callouts.readerShortcut` in the technique template or converged pages.
* No separate `problemStatement` / `coreIdea` keys in new starter bundles. If lead copy is needed, use `openingSummary`.
* No in-body `# <T k="title" />` heading; the docs shell renders the page title once.
* No authoring instructions in production MDX; keep them in this `.content.md` sidecar.

## Registry Expectations

Canonical taxonomy authoring for techniques should start with
`primaryClassificationId`, optional `secondaryClassificationIds`, and
`relationships`. Use [the ontology convergence plan](../temp/ontology-classification-topology-convergence-plan.md)
for the staged deprecation matrix.

The technique registry record should still include useful `tags`, aliases,
citations, and curated `relatedIds` only when derived relationships are
insufficient. Placeholder registry ids use the `technique.` namespace (for
example `technique.example-technique`).
