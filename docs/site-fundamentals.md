# Site Fundamentals

## Product Frame

The site is **you-agent-factory docs**: a documentation site for the
[you-agent-factory](https://github.com/portpowered/you-agent-factory) CLI and
agent-factory workflow system.

Readers use one consistent docs shell to:

* install and run the CLI (for example `you run --named @goal/blah`)
* follow use-case guides (loops, Cursor dynamic workflows, write-review loops)
* look up concepts and techniques (harness, loop, worktree, ralph, planner-executor)
* read documentation surfaces (configuration, harness support, CLI, MCP, API)
* browse the glossary, blog, and search/tag discovery

Every page should feel like a documentation page, including the home page,
guides, concepts, techniques, documentation pages, glossary entries, blog posts,
and search/tag discovery surfaces.

## What this is not

This is **not** the retired Model Atlas / Learn Language Models
attention-reference product (sometimes called Model Reference). Mention those
names only to exclude them.

It is also not:

* a benchmark leaderboard
* a paper-download mirror
* an LLM attention / model-atlas reference sheet

## Page types

Use the same docs shell across these factory surfaces:

| Surface | Role |
| --- | --- |
| Home | Page zero of the docs system: install/run CTA, why the factory exists, and featured links into guides, docs, glossary, and blog |
| Guides | Use-case walkthroughs (getting started, loops, Cursor workflows, write-review loops) |
| Concepts | Isolated idea pages (harness, loop, worktree, compaction, tokens, …) |
| Techniques | Named workflow patterns (ralph, writer-reviewer, planner-executor, …) |
| Documentation | Reference docs (configuration, harness support, CLI, MCP, API, sessions, …) |
| Glossary | Short term entries that point at the backing concept when needed |
| Blog | Product and ecosystem writing, comparisons, and listicles |
| Search / tags | Discovery across the docs shell (header search and tag browsing) |

Primary collections for rewrite-era content are `guides`, `concepts`,
`techniques`, and `documentation`, plus glossary, blog, and the direct public
route families `references`, `factories`, `workers`, and `workstations`. Nested
child slugs are supported under those families. Route slug remains independent
from frontmatter/registry kind. See
[documentation-site-pages-needed.md](./documentation-site-pages-needed.md) for
the page inventory.

## Visual Direction

The design direction is a restrained technical field guide with subtle fantasy
and game-world influence. It should feel like a weathered CLI/workflow handbook,
not a marketing site and not a rainbow dashboard.

Use:

* dark documentation surfaces (near-black factory-dark canvas)
* warm off-white ink for body text
* yellow primary brand accent for focus, links, and primary actions
* cool blue/cyan secondary for supporting interactive highlights
* etched grid, compass, and technical linework as low-contrast background detail

Avoid:

* many saturated colors competing on one page
* bright red as the default primary color
* legacy dull teal primary or pastel coral accent values
* purple gradients
* colorful tag chips by default
* dashboard-like home-page segmentation
* page-local hard-coded brand hex on content pages (consume semantic tokens)

## shadcn Theme Tokens

Use shadcn's semantic token model: components should consume tokens such as
`background`, `foreground`, `primary`, `accent`, `border`, `ring`, and
`sidebar`, rather than hard-coded brand colors.

The default product theme is dark (`factory-dark` from
`@you-agent-factory/components`). Host `:root` shadcn variables must reference
package foundation keys (`--color-af-foundation-*`), not invent a second
palette. Keep the TypeScript contract in
`src/lib/theme/host-semantic-theme-tokens.ts` aligned with `src/app/globals.css`.

```css
:root {
  --radius: 0.5rem;

  /* Base document shell — factory-dark near-black + warm ink */
  --background: var(--color-af-foundation-background);
  --foreground: var(--color-af-foundation-ink);

  /* Cards, panels, popovers, tables, and inline doc figures */
  --card: var(--color-af-foundation-surface);
  --card-foreground: var(--color-af-foundation-ink);
  --popover: var(--color-af-foundation-background-mid);
  --popover-foreground: var(--color-af-foundation-ink);

  /* Yellow brand primary */
  --primary: var(--color-af-foundation-accent);
  --primary-foreground: var(--color-af-foundation-accent-ink);

  /* Cool blue/cyan secondary */
  --secondary: var(--color-af-foundation-secondary-accent);
  --secondary-foreground: var(--color-af-foundation-canvas);

  /* Muted text and inactive UI */
  --muted: var(--color-af-foundation-background-mid);
  --muted-foreground: var(--color-af-foundation-secondary-accent-ink);

  /* Stronger yellow accent for hover/highlight chrome */
  --accent: var(--color-af-foundation-accent-strong);
  --accent-foreground: var(--color-af-foundation-accent-ink);

  /* Destructive state, used sparingly and not as brand color */
  --destructive: var(--color-af-foundation-danger);
  --destructive-foreground: var(--color-af-foundation-canvas);

  /* Hairlines and input states */
  --border: rgb(from var(--color-af-foundation-overlay) r g b / 0.18);
  --input: var(--color-af-foundation-surface);
  --ring: var(--color-af-foundation-accent);

  /* Sidebar shell */
  --sidebar: var(--color-af-foundation-background-start);
  --sidebar-foreground: var(--color-af-foundation-ink);
  --sidebar-primary: var(--color-af-foundation-accent);
  --sidebar-primary-foreground: var(--color-af-foundation-accent-ink);
  --sidebar-accent: var(--color-af-foundation-surface);
  --sidebar-accent-foreground: var(--color-af-foundation-ink);
  --sidebar-border: rgb(from var(--color-af-foundation-overlay) r g b / 0.18);
  --sidebar-ring: var(--color-af-foundation-accent);
}
```

If the app uses shadcn's Tailwind v4 `@theme inline` setup, map these variables
to Tailwind color utilities using the standard shadcn pattern:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}
```

## Color Usage Rules

Default text should be `foreground`, `muted-foreground`, or opacity variants of
those values. Most icons, borders, labels, chips, table text, and cards should
remain monochrome.

Use `primary` for:

* focused inputs
* active top-nav underline
* active right-table-of-contents dot
* selected links when blue focus is more useful than pink emphasis
* one compact affordance inside a section, such as a link arrow

Use `accent` for:

* the home-page brush-stroke header treatment
* sparse title or subtitle emphasis
* selected sidebar state when a warmer editorial highlight is needed
* occasional featured links such as `Browse guides` or `Read the docs`

Do not use `accent` for every tag, badge, icon, and table highlight. Pastel pink
should feel intentional, not decorative noise.

Use `destructive` only for real error/destructive states. Do not use it as a
brand red.

## Home Page Header

The you-agent-factory home page should use a broad irregular brush-stroke header
behind the title and subtitle area. The brush stroke may mix pastel coral,
weathered cream, charcoal ink, and dull teal-gray. It should not be a rectangular
banner or a separate callout card.

The search bar and page sections should follow after the header in normal docs
article flow. Featured links should point at factory destinations (guides, docs,
glossary, blog), not retired atlas collections.

## Typography

```css
--font-heading: "Cormorant Garamond", serif;
--font-body: "Inter", sans-serif;
--font-display: "Bebas Neue", sans-serif;
```

General page, section, sidebar, and navigation headings should be capitalized.
Body text should remain sentence case for readability.

## Layout Rules

Use the same docs shell for every page type:

* top navigation
* left docs sidebar
* central article column
* right `On this page` rail

The home page is page zero of the docs system. It should not become a marketing
landing page or a dashboard with unrelated columns.

Primary nav for the factory product is Home, Guides, Docs, Glossary, and Blog.
Search is a configured route surface for the header trigger, not a duplicate
primary-nav item.
