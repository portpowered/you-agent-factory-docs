# Docs Writing Standards

Reviewer-checkable rules for canonical factory docs pages such as guides,
concepts, techniques, documentation, glossary entries, and related blog posts
that teach you-agent-factory CLI workflows, harness support, and factory
records.

## Usage

Anyone authoring or reviewing canonical docs content **MUST** read this
standard before implementation or review.

Use [general website standards](./general-website-standards.md) alongside this
document for UI, accessibility, responsive behavior, and test expectations.
Use [code review standards](./code-review-standards.md) for review conduct and
blocking/non-blocking classification.
Use [graphing standards](./graphing-standards.md) as a required sub-standard
when a page uses graphs, charts, diagrams, algorithms, or math-heavy teaching
assets.

## Technical writing baseline

Canonical docs pages **MUST** follow established technical-writing best
practices.

Required influences:

- Strunk and White: prefer concise sentences, direct structure, and removal of
  needless words.
- BUGS in Writing: make explanations easy to debug by removing ambiguity, weak
  references, and avoidable confusion.
- Microsoft Writing Style Guide: prefer plain language, clear phrasing, and
  consistent terminology over insider shorthand.

These references guide tone and editing discipline. When they conflict with
site-specific rules, this repository standard wins.

## Unified Review Checklist

Before approval, reviewers **MUST** check each rule below and mark it `PASS` or
`FAIL` in the PR review summary when docs writing is in scope:

1. The page is understandable in isolation and does not define the topic only
   through one architecture slot, one historical example, or one adjacent page.
2. The narrative body stays focused on the concept and contains no self-
   referential page-as-subject framing, site-structure, process, phase, or
   page-meta copy. Mark `FAIL` for openings or body sentences that treat the
   documentation page itself as the subject (see Clarifying Rules).
3. The first sections explain both what the concept is and why it matters in
   plain language for a technical layperson.
4. The title and first narrative mention use the full name before acronyms or
   shorthand.
5. Each section has a distinct job and does not restate the same thesis with
   slightly different wording.
6. Mathematically heavy pages include the equations, notation, or symbolic
   derivations needed to teach the idea accurately.
7. Visually, structurally, or conceptually heavy pages include the best graph,
   diagram, chart, comparison view, or algorithm presentation needed to teach
   the idea accurately, and those assets follow
   [graphing standards](./graphing-standards.md).
8. Math sections keep concise symbol-only definitions directly under equations
   and avoid concept rows such as projections, grouping mechanics, or
   implementation steps.
9. Published pages use customer-facing voice for CLI and factory users: no
   reader-shortcut callouts, no "on this page" framing about the doc itself,
   and no system-bounded factory, planner, or docs-process internals. Mark
   `FAIL` when copy speaks to authors or operators of the docs pipeline
   instead of the product reader (see Clarifying Rules).
10. References and citations are present where factual claims need support, and
    every cited reference is correct. you MUST check the actual doc if its true, or if you know its not true outright just fail it. 
11. Related docs, tags, and citations support discovery, but the page body does
    not depend on hand-held cross-page explanation to make sense.
12. The copy is concise, direct, and conformant with the technical-writing
    baseline in this document.

## Clarifying Rules

### Tone and audience

Write for a technical layperson using the you-agent-factory CLI and agent-factory
workflows — someone who needs clear guidance on install/run, guides, concepts,
techniques, harness support, and related factory topics without reverse-
engineering the runtime.

Rules:

- Use short sentences, concrete nouns, and active voice.
- Prefer reader-visible consequences over unexplained implementation jargon.
- Define terms in ordinary language before narrowing into factory-specific
  usage.
- Expand acronyms on first mention in narrative copy, then use the short form
  after the full name is established.
- Use the fewest words needed for accuracy. Remove filler, throat clearing, and
  repeated "important because" framing.

### No self-referential page-as-subject framing (mandatory)

Published pages **MUST NOT** treat the documentation page itself as the
subject of the teaching copy. The topic is the product concept, command,
workflow, or limit — not the page, the docs site, or the author's framing of
"what this page is for."

Banned patterns (mark `FAIL` when they narrate the doc itself):

- "This page explains…" / "This page covers…" / "This page describes…"
- "This page is…" / "This page does not…" used to define the page's role
- "On this page…" / "Read this page to…" / "Use this page when…" framing that
  points at the document rather than the product behavior
- Lead or limits copy that opens by announcing the page's job in the docs set
  instead of teaching the topic

Allowed exceptions are narrow and intentional:

- Relocated stub notices such as "This page moved…" that exist only to send
  the reader to the new route
- Brief product facts that mention documentation behavior when the fact is
  useful to the reader (for example that a reference surface does not run a
  live request playground), stated without page-role narration

Rewrite self-referential openers into direct product statements. Prefer
"Install the CLI with…" over "This page explains how to install the CLI."

### Customer-facing voice, not internals (mandatory)

Published pages **MUST** speak to the customer using the CLI and factory
product. Assume the reader does not care about system-bounded factory planner
context, docs-process ownership, authoring workflow internals, or how the
documentation site is maintained.

Rules:

- Prefer customer-facing voice: what the reader runs, configures, observes, or
  decides while using you-agent-factory.
- Do not write as if the audience is a planner, docs-site maintainer, or
  factory-process operator unless the page is an intentional contributor
  surface aimed at that audience.
- When a real product limit involves documentation or static hosting behavior,
  state the reader-visible consequence directly (for example "the docs site
  does not run a live request playground") without docs-ownership or
  authoring-pipeline talk.
- Mark `FAIL` for copy that assumes the reader cares about system-bounded
  factory/planner context, phase labels, or docs-process internals instead of
  the product topic.

### Independence and structure

Every canonical page should make sense in isolation before it explains where
the topic appears in a larger factory workflow or system.

Rules:

- Start with the most general true statement about the topic.
- Explain the parent concept before the variant when a page covers a variant.
- Give each section one job, such as definition, mechanism, payoff, tradeoff,
  or comparison.
- Prefer concrete consequences over generic praise words such as "important,"
  "powerful," or "advanced."

### Visuals and formal aids

Use the teaching aid that makes the concept understandable with the least
reader effort.

Rules:

- Include equations when the concept is mathematically heavy.
- Include graphs, diagrams, charts, comparisons, or algorithm presentations
  when the concept is visually, structurally, or relationship-heavy.
- Some pages need both. Do not force prose-only explanation when a visual or
  formal aid would make the idea materially clearer.
- Do not add decorative visuals that repeat the prose without teaching a new
  idea.

### Math discipline

Equations carry the formalism. Symbol definitions carry the glossary. Narrative
sections carry mechanism and tradeoff prose.

Rules:

- Place concise symbol definitions directly under the equation they annotate.
- Keep those definitions to symbols and indices only, such as `Q`, `K`, `V`,
  `H`, `G`, `d`, `h`, `T`, or a group or head index.
- Do not use math-definition rows for concepts such as query projection, value
  projection, grouping mechanics, bucketing, or implementation steps.
- If a concept needs more than one short line, move it into narrative prose.

### Citations and supporting structure

Supporting systems should strengthen the page, not carry its explanation.

Rules:

- Use citations for factual claims.
- Verify that references point to the correct source.
- Use derived related sections, tags, and references instead of hand-maintained
  duplicate lists when possible.
- Do not make the core narrative depend on "read these other pages first."

## Recurring Failures To Avoid

Do not reintroduce these patterns:

- Split summary lines that repeat the same thesis instead of one concise lead
  block
- Concept rows under equations that crowd symbol glossaries
- Reader-shortcut callouts in baseline templates
- Phase, process, or page-meta copy in customer-facing content
- Verbose math definitions instead of short symbol lines
- Unexpanded acronyms such as `MCP` or `CLI` before teaching the full term when
  the short form is not already established for the reader
- Self-referential page-as-subject narration ("This page explains/covers/is…",
  "on this page" framing about the doc itself) instead of teaching the product
  topic directly
- Internal or planner voice in published product pages: system-bounded
  factory/planner/docs-process context, docs-site ownership talk, or
  authoring-pipeline language aimed at maintainers rather than CLI users
- Pages that explain their role in the docs set instead of the concept itself
