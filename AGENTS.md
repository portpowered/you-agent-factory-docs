# you-agent-factory docs

This project is a static documentation site for the
[you-agent-factory](https://github.com/portpowered/you-agent-factory) CLI and
agent-factory workflow system.

Readers use this site to install and run the CLI, follow use-case guides, look up
concepts and techniques, compare approaches, and read news/blog posts — from a
clear, practical perspective.

This is **not** the retired Model Atlas / Learn Language Models attention-reference
product. It is also not a benchmark leaderboard or a paper-download mirror.

## Customer stories

1. **Install and run** — A customer wants to install you-agent-factory and run a
   named workflow (for example `you run --named @goal/blah`). The docs explain
   install, first run, and how the factory keeps long-running agent work
   persistent.

2. **Use-case guidance** — A customer wants to use the factory for loops, Cursor
   dynamic workflows, or write-review loops. Guides walk through those paths
   without requiring the reader to reverse-engineer the runtime.

3. **Concepts and techniques** — A customer looks up harness, loop, worktree,
   compaction, ralph, writer-reviewer, planner-executor, and related ideas.
   Concept and technique pages explain each idea in isolation and link related
   docs.

4. **Comparisons and listicles** — A customer wants comparisons of agent
   factories, examinations of factory/docs workflows, or curated link lists.
   Blog and comparison surfaces cover that reading mode.

5. **News / blog** — A customer follows product and ecosystem writing from the
   site blog index.

## What this is not

- Not a website for evaluating performance on benchmarks.
- Not a way to download technical papers (though pages may link out to them).
- Not an LLM attention / model-atlas reference sheet.

## Conceptually

The site helps customers search across CLI docs surfaces: guides, concepts,
techniques, documentation (configuration, harness support, CLI, MCP, API), and
blog/comparisons.

Rewrite-era content collections are `guides`, `concepts`, `techniques`, and
`documentation`, plus glossary and blog surfaces. See
[documentation-site-pages-needed.md](./docs/documentation-site-pages-needed.md)
for the page inventory.

## Architecture overall

The architecture is a statically rendered Next.js App Router site composed with
Fumadocs, React Flow, Recharts, Tailwind, shadcn/ui, and a defined system data
model.

## Build system

The overall system that builds and drives long-running agent work is called
`you`. This is an agent factory workflow system that keeps work persistent over
long periods of time.

The only one who should touch it is the PLANNER. You MUST NOT use `you` unless
you are the planner.

Figure out how `you` works by running `you -h` and `you docs agents`. Do not run
`you` directly to start the workflow runtime unless you are the planner.

## Planner and rewrite entrypoints

Planners and agents MUST start from the live customer ask and the rewrite working
set (`docs/temp/` is gitignored local planner state; create or refresh these
paths in a checkout when doing rewrite planning):

- [docs/temp/customer-ask.md](./docs/temp/customer-ask.md) — live customer ask
- [docs/temp/big-docs](./docs/temp/big-docs) — durable rewrite planning artifacts

Committed customer-ask inventory (also required for planners):

- [documentation site pages](./docs/documentation-site-pages-needed.md)
- [architecture-checklist](./docs/architectural-checklist.md)

## Writing code

When writing code, standardize and minimize complexity:

- [design-skills](./docs/design-skills.md)
- [code-standards](./docs/code-standards.md)
- [review-standards](./docs/review-standards.md)

## Writing docs

Keep docs fresh and cross-linked: related pages should point at each other so
readers can move from a guide to the concepts and techniques it depends on.

Follow the appropriate documents when writing docs.

### Guides

- [writing-guide](./docs/guide-to-writing-pages.md)
- [disaggregating-papers](./docs/disaggregating-papers.md)

### Standards

Mandatory references for canonical page authoring and review. Read the
appropriate components when writing pages:

- [writing-guide](./docs/guide-to-writing-pages.md)
- [documentation template](./docs/documentation-template.md)
- [writing standards](./factory/docs/standards/docs-writing-standards.md) —
  layperson tone, isolation-first pages, no page-meta prose, required
  graphs/equations when the concept needs them, symbol-only math definitions, no
  reader-shortcut callouts
- [graphing standards](./factory/docs/standards/graphing-standards.md) — single
  primary graph, readable node theme, zoom/pan

## Generally relevant files

Read these when writing site or content work:

- [site fundamentals](./docs/site-fundamentals.md)
- [data model](./docs/data-model.md)
- [architecture](./docs/architecture.md)

## Tags

Tags and collection groups (guides, concepts, techniques, documentation, blog,
etc.) should stay isolated and flexible. Do not collapse unrelated surfaces into
one group just because a better group name is not defined yet — add the right
group when needed.
