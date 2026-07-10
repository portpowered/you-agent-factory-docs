# This is a guide to writing pages

1. Given a request to write a page, choose the factory collection that matches
   the ask: `guides`, `concepts`, `techniques`, `documentation`, `glossary`, or
   `blog`.
2. Check that the page conforms to the matching rewrite-era template under
   `docs/templates/` (`guide`, `technique`, `documentation`, `concept`,
   `glossary`, or `blog-post`). See
   [documentation-template.md](./documentation-template.md).
3. Check the codebase for similar published pages in that collection (for
   example other guides under `src/content/docs/guides/` or documentation pages
   under `src/content/docs/documentation/`).
4. Add a new page under `src/content/docs/<collection>/<slug>/` (or
   `src/content/blog/<slug>/` for blog posts) that follows the matching template
   structure, registry id namespace, messages, and assets.
4.0. Ensure the page can stand on its own, avoids page-meta prose, and follows
   the [docs-writing-standards](../factory/docs/standards/docs-writing-standards.md).
4.1. Structure page content with tags and related links so readers can move
   between nearby factory topics (CLI, harness, loops, worktrees, techniques).
4.2. Add a graph, chart, diagram, or table only when it teaches the factory
   topic better than prose. Many shipped pages correctly use an empty
   `assets.json`.
4.3. If the topic is mathematically or structurally heavy (for example a
   workflow loop, token flow, or comparison matrix), add the equations, graphs,
   or tables needed to teach it clearly—and update nearby related pages only
   when the comparison itself is part of the teaching contract.

## Review preflight for ordinary page branches

Before opening a pull request for a routine canonical page branch:

1. Run `make validate-data` after the page bundle, registry record, messages,
   and assets are aligned. This is the primary derived page-bundle validation
   proof for ordinary content-only pages. It covers registry alignment,
   default-locale messages, tags, citations, and local assets without adding
   per-page tests that only re-check those relationships.
2. Run `bun run audit:canonical-page-surface` before review, after
   `make validate-data` passes, to confirm the branch stayed on the owned page
   surface and did not pick up shared hotspot churn such as shared tests,
   generated runtime artifacts, or broad registry or helper edits.

Maintainer references for the full contracts (do not duplicate them here):

- [content-page-generation-workflow-relevant-files](./internal/processes/content-page-generation-workflow-relevant-files.md)
- [derived-page-validation-relevant-files](./internal/processes/derived-page-validation-relevant-files.md)

See [CONTRIBUTING local validation](./contributors/CONTRIBUTING.md#local-validation)
for the full fast content loop including `make linkcheck`.

## Page-local scope versus shared hotspot redirects

Routine canonical page branches should stay **page-local** unless the requested
behavior genuinely requires shared infrastructure changes.

Do not hide shared helper edits, generated artifact churn, shared test suites,
broad validator updates, or registry-manifest rewrites inside an ordinary page
slice. When `bun run audit:canonical-page-surface` reports
`redirect-to-throughput-prd`, or when shared hotspot work is the real task,
redirect to or create a broader throughput/conflict-reduction PRD instead of
folding it into a routine page PR.

| Stay page-local | Redirect to a throughput lane |
| --- | --- |
| One page bundle, matching primary registry record, and page-specific graph/table assets | Broad shared test or validator churn, generated runtime artifacts committed as authored output, registry-manifest rewrites, or multiple shared hotspot categories at once |

Full owned-surface contract (do not duplicate here):

- [canonical-page-surface-budget-relevant-files](./internal/processes/canonical-page-surface-budget-relevant-files.md)
- [CONTRIBUTING — routine canonical-page PR surface budget](./contributors/CONTRIBUTING.md#routine-canonical-page-pr-surface-budget)
- [content-page-generation-workflow-relevant-files](./internal/processes/content-page-generation-workflow-relevant-files.md#page-local-scope-versus-shared-hotspot-redirects)

Keep changes narrow and reviewer-verifiable per [code standards](./code-standards.md)
and [review standards](./review-standards.md).

### PR-head mergeability (process executors)

When page PRD stories are complete but the remaining blocker is PR-head
mergeability, use the existing process workstation mergeability phase—not a
second policy. Run `bun run watch:active-pr-mergeability` to diagnose active
lane mergeability, follow
[factory/workstations/process/AGENTS.md](../factory/workstations/process/AGENTS.md)
rules 5.2.1–5.2.5, and attempt the smallest disciplined fix before returning
continue. Full command routing:
[content-page-generation-workflow-relevant-files](./internal/processes/content-page-generation-workflow-relevant-files.md#pr-head-mergeability-for-page-branches-process-executors).

## Choosing a factory page kind

| Ask | Collection | Template | Example registry id |
| --- | --- | --- | --- |
| Install, first run, or a concrete workflow walkthrough | `guides` | `guide.mdx` | `guide.getting-started` |
| A named idea readers look up in isolation (harness, loop, worktree) | `concepts` | `concept.mdx` | `concept.worktree` |
| A reusable agent-factory pattern (ralph, writer-reviewer, planner-executor) | `techniques` | `technique.mdx` | `technique.ralph` |
| CLI, configuration, harness support, MCP, API, or other reference | `documentation` | `documentation.mdx` | `documentation.cli` |
| A short term definition that shares the concept registry shape | `glossary` | `glossary.mdx` | `concept.<slug>` |
| Time-specific product or ecosystem writing | `blog` | `blog-post.mdx` | related via `relatedDocIds` |

Examples:

1. A reader needs to install and run a named workflow → write a **guide**.
2. A reader looks up what a worktree is → write a **concept** (or glossary entry
   when the ask is a short term definition).
3. A reader wants the ralph loop pattern → write a **technique**.
4. A reader needs harness capability lookup → write a **documentation** page
   (and use a matrix or diagram only when it teaches the reference surface).

## Adding graphs

You must ensure to follow the [graphing-standards](./graphing-standards.md).

If the concept, technique, or documentation topic is structurally heavy, add the
equations, graphs, charts, or diagrams needed to teach it clearly. Prefer one
primary teaching visual over decorative extras.

When adding a new graph:

0. Be sure what the graph should teach. Sometimes the best presentation is a
   flow of factory steps, sometimes a comparison matrix, sometimes a token or
   worktree diagram. Empty `assets.json` is correct when prose is enough.

#### General

- Default isolated concepts (for example harness, loop, worktree) should use a
  singular teaching graph when a graph is needed.
- Nearby techniques or documentation comparisons (for example ralph vs
  writer-reviewer, or harness support across tools) may use a comparator or
  matrix when the comparison itself is the teaching point.

#### Node graphs

1. Keep shared node roles aligned across related pages when readers will compare
   them (for example planner, worker, and review roles across technique pages).
2. Graph nodes should not overlap with text blocks.

### Function charts

For function or metric charts:

1. Always model from a clear origin or baseline.
2. Always show labels for x/y.
3. Always have a title.
4. Always present a legend denoting what each series is.

## Adding algorithms

Please ensure that the algorithms are reflective of the factory workflow or
technique being taught.

## Types of pages

We define factory teaching pages as generally as follows:

1. a baseline
2. a variant
3. generic

### Baselines

Baseline pages define a standard idea or workflow in isolation. In this product,
examples include the harness concept, the loop concept, or the getting-started
guide.

They do not force comparisons to every nearby page; they exist independently.

### Variants

Variant pages modify or specialize a baseline idea. Technique pages often behave
this way: ralph, writer-reviewer, and planner-executor are specialized loop or
role patterns.

These pages tend to have:

1. a comparison between the technique and a nearby baseline or sibling technique
2. text still written in isolation, with small affordances toward the thing it
   improves on
3. optional comparison graphs or matrices only when the difference is hard to
   teach in prose

### Generic

Generic pages are neither baselines nor variants. They are one-off reference or
narrative surfaces where no variant family is expected.

Examples:

1. CLI reference documentation
2. configuration documentation
3. a blog post about a release or ecosystem change

## Code/Documentation separation

In as much as possible, make as few code changes as possible when adding new
docs. Sometimes code is necessary, but it is preferable to have zero test/code
changes for ordinary content-only pages.

When code must reference a page bundle path, use
`getDocsPageDir(section, slug)` from `src/lib/content/content-paths.ts` instead
of adding a page-specific exported constant. Shared roots and section roots in
that helper remain the right surface for tree-wide or section-wide operations.
See
[content-page-generation-workflow-relevant-files](./internal/processes/content-page-generation-workflow-relevant-files.md).

Ordinary content-only published page bundles do not need new per-page tests for
registry alignment, messages, tags, citations, or local assets. Run
`make validate-data` for scanner-backed derived validation instead. See
[derived-page-validation-relevant-files](./internal/processes/derived-page-validation-relevant-files.md).
Add per-page tests only when the page introduces special rendering, graph/table
runtime behavior, search/discovery wiring, page-generation workflow behavior,
or a focused regression guard that cannot be expressed as a derived bundle
invariant.
