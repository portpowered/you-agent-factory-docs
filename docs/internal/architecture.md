# You Agent Factory Website Plan

## 1. Problem Statement and Solution

### 1.1 Problem Statement

Engineering teams increasingly want to use AI agents for recurring development work, but they do not yet have a clear way to design, run, compare, document, and improve agent workflows.

Customers have several related problems:

1. **They want to use agents more, but lack orchestration tools.**
   They can use individual agents or coding assistants, but coordinating multiple agents into repeatable workflows is still unclear.

2. **They want to learn agent orchestration, but lack a clear guide.**
   There are few practical examples that explain how to structure workflows, choose patterns, validate outputs, and decide where humans should approve work.

3. **They want to compare orchestrators, but lack a neutral shopping surface.**
   Agent harnesses, workflow engines, automation platforms, and orchestration frameworks are difficult to compare because they use different language and emphasize different capabilities.

4. **They want documentation, but existing docs are fragmented or opaque.**
   Many tools document APIs or examples, but do not clearly explain operating models, tradeoffs, failure modes, workflow design, or best practices.

5. **They want reliable agent workflows, but lack best practices.**
   Teams need guidance for testing, review loops, cost control, latency, throughput, bottlenecks, rollback, logging, replay, and human approval.

6. **They want help and examples, but lack a single place to go.**
   Support knowledge is scattered across repos, blog posts, social media, docs, and private conversations.

7. **They want stories and references, but discovery is hard.**
   Good ideas about agent orchestration, loop engineering, dynamic workflows, and process design exist, but are not collected in one useful place.

### 1.2 Solution

Build the **You Agent Factory website**: a public documentation, learning, and product-marketing site for You Agent Factory.

The site should help users:

* understand what You Agent Factory is
* understand why agent orchestration matters
* install and run You Agent Factory
* learn orchestration patterns and concepts
* compare You Agent Factory to adjacent tools
* read practical use cases
* inspect configuration examples
* find best practices
* discover references, essays, and external links
* navigate docs in a way that is useful to both humans and AI agents

The website should be hosted on GitHub Pages and should serve as the primary guide for You Agent Factory.

### 1.3 Product Positioning

You Agent Factory should be positioned as:

> An open-source, engineering-native platform for turning recurring development work into reusable, inspectable AI agent workflows.

The site should emphasize:

* engineering-native workflows
* local-first usage
* open-source adoption
* file/config-driven setup
* agent-harness agnosticism
* human approval gates
* inspectable workflow graphs
* logs and replays
* reusable workflow templates
* practical process improvement

The site should avoid claiming that You Agent Factory:

* replaces engineers
* automates everything
* removes the need for process
* eliminates review
* guarantees correctness
* is a generic Zapier replacement
* is only a no-code workflow builder

## 2. Target UX

### 2.1 User Journey

The target user journey should be simple:

1. A user lands on the homepage.
2. Within 30 seconds, they understand what You Agent Factory does.
3. They see examples of workflows they recognize.
4. They click into installation or quickstart.
5. They install the tool.
6. They run one example workflow.
7. They inspect the workflow structure, logs, config, and outputs.
8. They modify or create a workflow.
9. They return to docs, use cases, concepts, or comparisons as needed.

### 2.2 Homepage UX

The homepage should answer:

1. What is this?
2. Who is it for?
3. What problem does it solve?
4. What can I build with it?
5. How is it different from existing tools?
6. How do I try it?

Homepage sections:

1. Hero

   * tagline
   * short explanation
   * GitHub CTA
   * Get Started CTA

2. Problem

   * agents are powerful
   * one-off usage does not scale
   * teams need reusable workflows

3. Solution

   * define workflows
   * connect agents, tools, files, repos, and approval gates
   * inspect every step

4. Example workflows

   * PR Review Factory
   * Release Readiness Factory
   * Incident Follow-up Factory
   * Data Question Factory
   * Runbook Maintenance Factory

5. How it works

   * configure
   * run
   * inspect
   * approve
   * reuse

6. Why You Agent Factory

   * local-first
   * open source
   * engineering-native
   * harness-agnostic
   * file/config-driven
   * auditable

7. Final CTA

   * View on GitHub
   * Start Quickstart
   * Read Concepts

### 2.3 Documentation UX

The docs should support three reading modes:

1. **Task mode**
   “I want to install, configure, or run something.”

2. **Concept mode**
   “I want to understand how agent orchestration works.”

3. **Reference mode**
   “I need exact CLI, config, schema, or API details.”

Docs should include:

* global header
* left-side documentation navigation
* in-page table of contents
* breadcrumbs
* previous / next navigation
* search
* keyboard-accessible navigation
* code examples
* diagrams
* callouts
* warnings
* raw markdown access for agent reads

### 2.4 Localization UX

Localization should be message/config-based, not route-based.

The site should not require locale-specific route trees such as:

```txt
/en/docs/installation
/fr/docs/installation
/ja/docs/installation
```

Instead, pages should keep stable routes such as:

```txt
/docs/installation
```

User-facing strings should be resolved from a message configuration layer.

Content should also support localized page variants for all public content types, including:

* docs
* blog posts
* glossary pages
* comparison pages
* reference pages

The system should distinguish between:

* **message localization** for shared UI text, navigation labels, CTA labels, ARIA labels, empty states, and error states
* **content localization** for page bodies and metadata through parallel localized content variants tied to one canonical page identity

The localization system should support:

* localized component text
* localized navigation labels
* localized CTA labels
* localized ARIA labels
* localized empty states
* localized error states
* localized dates and numbers
* fallback to a default locale
* validation for missing keys

This should feel closer to Android/Kotlin-style string resources than separate duplicated page trees.

Localized variants should share a stable canonical identity even when the rendered content differs by locale.

### 2.5 Responsive UX

Responsive behavior should be implemented through shared hooks and design tokens.

Components should not scatter raw media queries or direct `window.matchMedia` calls throughout the codebase.

The UX should support:

* desktop documentation layout
* tablet layout
* mobile navigation
* collapsible sidebars
* responsive diagrams
* responsive charts
* reduced-motion preferences
* keyboard navigation
* accessible focus states

### 2.6 Quality UX

The site should feel fast, accessible, and reliable.

Quality expectations:

* pages load quickly
* navigation is predictable
* search works well
* content is easy to scan
* code examples are copyable
* diagrams are readable
* layout does not shift unexpectedly
* keyboard navigation works
* screen-reader labels are present
* Lighthouse checks pass in CI
* README explains the project immediately with a one-line description before deeper detail
* contributors and CI can use the same top-level `make` entrypoints without environment-specific branching
* code coverage for component packages stays at or above 90 percent in CI where package-level enforcement is practical
* successful changes can flow through a fully automated continuous deployment path

## 3. Technology Choices

### 3.1 Core Platform

Use:

* **React** for UI
* **Next.js** for routing and static site generation
* **GitHub Pages** for hosting
* **Fumadocs** as the documentation baseline
* **MDX** for documentation and content pages
* **Tailwind CSS** for styling
* **shadcn/ui** for base components
* **Bun** for package management and build scripts
* **Biome** for formatting and linting
* **Orama** for search
* **TypeScript** across the codebase

Static hosting constraints:

* the site must build as a fully static export
* architecture should assume no required server-side runtime on GitHub Pages
* content, search index generation, sitemap generation, and metadata generation should happen at build time
* routes, assets, and internal links should be compatible with GitHub Pages base-path behavior
* features that require request-time server logic should be explicitly out of scope unless replaced with a static equivalent

### 3.2 Visualization

Use:

* **Mermaid** for simple diagrams in documentation
* **React Flow** for workflow and agent graph diagrams
* **Recharts** for charts
* custom chart wrappers for reusable styling, labels, accessibility, and responsive behavior

Supported chart types:

* line charts
* bar charts
* statistical process control charts
* cumulative distribution charts
* normal distribution charts
* throughput charts
* latency charts
* failure-rate charts
* cost-over-time charts

### 3.3 UI Component Libraries

Use:

* **shadcn/ui** as the base component system
* **Magic UI** selectively for landing-page polish
* **Performative UI** selectively where useful

Component usage should be controlled. The site should not become a mixture of ungoverned visual systems.

### 3.4 Analytics and SEO

Use:

* Google Analytics
* click tracking for CTAs
* search usage tracking
* install CTA tracking
* SEO metadata
* Open Graph metadata
* sitemap generation
* robots.txt

### 3.5 Testing and Validation

Use:

* **bun test** for unit and component test execution
* **React Testing Library** for component tests
* **Playwright** for end-to-end tests
* **axe-core / jest-axe** for accessibility validation
* **Lighthouse CI** for performance, SEO, accessibility, and best-practice checks
* bundle-size checks
* content validation scripts
* localization validation scripts
* search validation scripts
* CI-enforced code coverage thresholds with a 90 percent minimum for component packages where package-level enforcement is practical

Execution expectations:

* the repository should expose a small set of top-level `make` targets for local development and CI
* CI should invoke the same `make` targets that contributors run locally
* `make` targets should not require separate CI-only behavior flags to succeed in automation
* `make test` should run through `bun test`
* deployment should run automatically after required checks pass on changes to `main`

## 4. Implementation Details

### 4.1 Package Structure

```txt
src/
  app/
    page.tsx
    docs/
    blog/
    references/
    glossary/
    comparisons/

  content/
    docs/
      getting-started/
      cli/
      configuration/
      workflows/
      use-cases/
      concepts/
    blog/
    glossary/
    comparisons/
    references/

  components/
    ui/
    layout/
    content/
    charts/
    diagrams/

  hooks/
    media/
    layout/
    accessibility/
    localization/
    analytics/

  localization/
    config/
    messages/
    components/
    hooks/
    lib/

  types/
    media.ts
    layout.ts
    localization.ts
    navigation.ts
    analytics.ts
    content.ts
    search.ts

  lib/
    content/
    search/
    seo/
    analytics/
    config/
    markdown/
    routes/
    validation/

tests/
  unit/
  components/
  accessibility/
  localization/
  content/
  search/
  performance/
  e2e/

docs/
  internal/
    architecture.md
    data-models.md
    content-model.md
    design-system.md
    localization.md
    testing-strategy.md
    deployment.md

.github/
  workflows/
    ci.yml
    deploy.yml
    lighthouse.yml

scripts/
  validate-content.ts
  validate-localization.ts
  validate-search.ts
  validate-accessibility.ts
  validate-performance.ts
  generate-search-index.ts
  generate-sitemap.ts

public/
  images/
  schemas/

factory/

README.md
LICENSE
CONTRIBUTORS.md
```

Implementation shape:

* keep the initial architecture centered on `content/`, `components/`, `hooks/`, `localization/`, and `lib/`
* treat this as the core system shape for v1
* defer heavier feature-layer factoring until repeated patterns appear in the codebase
* aspirational subsystems such as richer charts, complex diagrams, and expanded analytics can be added later without forcing early folder complexity

Repository entrypoint expectations:

* `README.md` should begin with a single-sentence description of what the project is
* the opening README section should then expand into install, quickstart, and deeper reference material as needed
* a root `Makefile` should provide the standard automation entrypoints used by both developers and CI
* those entrypoints should cover at least `make setup`, `make check`, `make test`, and `make build`, plus deploy-relevant checks where applicable

### 4.2 Shared Hooks

Shared responsive, browser, layout, accessibility, localization, and analytics behavior should live under `src/hooks`.

Media and responsive hooks:

```txt
src/hooks/media/
  useMediaQuery.ts
  useBreakpoint.ts
  useReducedMotion.ts
  usePrefersColorScheme.ts
  useIsTouchDevice.ts
```

Layout hooks:

```txt
src/hooks/layout/
  useSidebarState.ts
  useInPageNav.ts
  useScrollSpy.ts
  useHeaderHeight.ts
```

Accessibility hooks:

```txt
src/hooks/accessibility/
  useFocusTrap.ts
  useKeyboardShortcut.ts
  useAriaLive.ts
```

Localization hooks:

```txt
src/hooks/localization/
  useMessages.ts
  useLocale.ts
  useLocalizedDate.ts
  useLocalizedNumber.ts
```

Analytics hooks:

```txt
src/hooks/analytics/
  useTrackEvent.ts
  useTrackCtaClick.ts
  useTrackSearch.ts
```

Rules:

* hooks must be typed
* hooks must be tested
* hooks must be SSR-safe
* hooks should avoid direct DOM access unless necessary
* hooks should provide stable defaults before hydration
* components should depend on hooks instead of browser APIs directly
* breakpoints should come from shared design tokens

### 4.3 Shared Types

Shared types should live under `src/types`.

```txt
src/types/
  media.ts
  layout.ts
  localization.ts
  navigation.ts
  analytics.ts
  content.ts
  search.ts
```

Type definitions should cover:

* locales
* message keys
* content metadata
* navigation entries
* search documents
* analytics events
* breakpoints
* chart configuration
* diagram configuration

### 4.4 Localization Architecture

Localization should use a message registry.

Example structure:

```txt
src/localization/
  config/
    locales.ts
    default-locale.ts
  messages/
    en.ts
    fr.ts
    ja.ts
    es.ts
  components/
    LocalizationProvider.tsx
  hooks/
    useMessages.ts
    useLocale.ts
    useLocalizedDate.ts
    useLocalizedNumber.ts
  lib/
    resolve-message.ts
    validate-messages.ts
    fallback-message.ts
```

Public content should also support parallel localized variants under stable canonical page identities.

Example structure:

```txt
src/content/
  docs/
    installation/
      en.mdx
      fr.mdx
      ja.mdx
  blog/
    scripts-vs-agents/
      en.mdx
      ja.mdx
  glossary/
    orchestrator/
      en.mdx
      fr.mdx
  comparisons/
    vs-n8n/
      en.mdx
  references/
    loop-engineering/
      en.mdx
```

Example message file:

```ts
export const en = {
  common: {
    githubCta: "View on GitHub",
    getStarted: "Get started",
    searchPlaceholder: "Search documentation",
    nextPage: "Next page",
    previousPage: "Previous page",
  },
  landing: {
    heroTitle: "Turn engineering work into reusable AI workflows",
    heroSubtitle:
      "You Agent Factory helps engineering teams define, inspect, and reuse agent workflows.",
  },
  docs: {
    installation: {
      title: "Installation",
      description:
        "Install You Agent Factory locally and run your first workflow.",
    },
  },
} as const;
```

Localization rules:

* components should not hardcode user-facing text
* navigation labels should use message keys
* CTA labels should use message keys
* form labels should use message keys
* ARIA labels should use message keys
* empty states should use message keys
* error states should use message keys
* date and number formatting should use localization helpers
* CI should fail when required keys are missing
* missing translations should fall back to the default locale
* localized content variants should map back to one canonical page identity
* every localized content page should declare or derive a locale
* page metadata should be localizable per variant
* the site should allow untranslated locales to omit a content variant without breaking the canonical page record
* component localization and content localization should use separate validation paths

### 4.5 Content and Search Data Model

Search should index normalized content records instead of indexing raw files directly.

The system should separate:

* a **canonical content record** shared across locales
* a **localized search document** generated per locale-specific content variant

Example types:

```ts
type ContentKind =
  | "doc"
  | "blog"
  | "glossary"
  | "reference"
  | "comparison"
  | "landing";

type CanonicalContentRecord = {
  id: string;
  kind: ContentKind;
  slug: string;
  section: string;
  tags: string[];
  status: "published" | "draft" | "internal" | "hidden";
  order?: number;
  canonicalLocale: string;
  availableLocales: string[];
  searchPriority?: number;
  navigationTitle: string;
};

type LocalizedSearchDocument = {
  id: string;
  canonicalId: string;
  locale: string;
  kind: ContentKind;
  url: string;
  title: string;
  description: string;
  headings: string[];
  body: string;
  tags: string[];
  aliases?: string[];
  section: string;
  searchPriority: number;
};
```

Recommended frontmatter fields:

```txt
id
kind
locale
title
description
tags
section
status
order
search.include
search.priority
aliases
lastReviewedAt
```

Rules:

* every public content page should produce one canonical content record
* every localized page variant should produce one localized search document
* search visibility should come from structured metadata, not file location alone
* `draft`, `internal`, `hidden`, and `search.include: false` pages should be excluded from the public index
* localized variants should share the same canonical page id
* title, description, headings, aliases, tags, and body text should all be available to the indexer
* comparison and reference pages should support freshness metadata such as `lastReviewedAt`

Indexing pipeline:

1. parse frontmatter and derive canonical metadata
2. build canonical content records
3. discover localized variants for each canonical page
4. render MDX to searchable plain text
5. extract headings, title, description, tags, aliases, and body text
6. emit localized search documents
7. build the Orama index from normalized localized documents

Search behavior:

* search should default to the active locale
* docs should rank above blog posts for task-oriented queries by default
* glossary aliases should rank strongly for exact or near-exact term matches
* comparison pages should index comparison dimensions as structured keywords in addition to prose
* optionally fall back to canonical-locale results when no strong results exist in the active locale

### 4.6 Design System

The design system should define:

* colors
* typography
* spacing
* sizing
* border radius
* shadows
* breakpoints
* motion tokens
* chart color rules
* focus styles
* semantic status styles

Base components:

* button
* link
* header
* footer
* sidebar
* breadcrumb
* card
* callout
* table
* tabs
* accordion
* search input
* code block
* file tree
* keyboard shortcut
* spinner
* icon

### 4.7 Navigation System

Navigation should include:

* global header
* GitHub CTA in the header
* left documentation navigation
* in-page navigation
* breadcrumbs
* previous / next page controls
* nav index page
* cross-document navigator

Navigation should be generated from content metadata where possible.

Navigation rules:

* navigation generation should use canonical content records and locale-aware page variants
* navigation labels may come from message localization or localized content metadata depending on page type
* previous / next navigation should stay within the active locale when a localized variant exists
* missing localized variants should degrade gracefully to canonical-locale navigation rules

### 4.8 Search System

Search should support:

* text search
* tag search
* alias search
* search result previews
* keyboard shortcut
* indexed docs
* indexed blog posts
* indexed glossary pages
* indexed comparison pages
* search validation tests

Search should exclude:

* internal docs
* draft pages
* private notes
* hidden pages

Search ranking should consider:

* content kind
* title matches
* alias matches
* heading matches
* tag matches
* description matches
* body matches
* manual search priority

### 4.9 Testing Structure

Tests should be organized by what they enforce.

```txt
tests/
  unit/
  components/
  accessibility/
  localization/
  content/
  search/
  performance/
  e2e/
```

#### Unit Tests

Validate:

* hooks
* utilities
* message resolution
* route generation
* search index generation
* date and number formatting
* canonical record generation
* localized variant discovery

#### Component Tests

Validate:

* component rendering
* keyboard behavior
* responsive states
* localization usage
* ARIA labels
* empty states
* error states

Component coverage expectations:

* CI should enforce at least 90 percent code coverage for component packages where package-level enforcement is practical
* coverage reporting should make regressions obvious at pull request time
* missing the threshold should block merge and therefore block deployment

#### Accessibility Tests

Validate:

* axe checks
* heading hierarchy
* focus states
* keyboard navigation
* ARIA labels
* skip links
* menu behavior
* dialog focus trapping
* color contrast where possible

#### Localization Tests

Validate:

* required keys exist
* all locales match the default locale shape
* missing keys fail CI
* fallback behavior works
* ARIA labels are localized
* navigation labels are localized
* CTA labels are localized
* obvious hardcoded user-facing strings are rejected
* localized content variants resolve to the correct canonical ids

#### Content Tests

Validate:

* every page has title metadata
* every page has description metadata
* every page has valid navigation metadata
* internal links resolve
* external links are checked or explicitly ignored
* code blocks specify language where appropriate
* heading levels do not skip incorrectly
* glossary links resolve
* comparison pages follow a shared schema
* localized content variants declare valid locale metadata
* canonical ids are unique across the content graph

#### Search Tests

Validate:

* index builds
* all public docs are indexed
* hidden pages are excluded
* tags are indexed
* aliases are indexed
* common queries return expected pages
* search result URLs resolve
* active-locale filtering works

#### Performance Tests

Validate:

* Lighthouse performance threshold
* Lighthouse accessibility threshold
* Lighthouse SEO threshold
* Lighthouse best-practices threshold
* JavaScript bundle budget
* search index size budget
* image optimization
* layout shift threshold
* largest contentful paint threshold

Suggested thresholds:

```txt
Lighthouse performance: >= 90
Lighthouse accessibility: >= 95
Lighthouse SEO: >= 95
Lighthouse best practices: >= 90
```

#### End-to-End Tests

Validate core flows:

1. user lands on homepage and clicks GitHub CTA
2. user opens docs and navigates to installation
3. user searches for CLI and opens the CLI guide
4. user navigates previous / next between docs pages
5. user switches locale and sees localized component text
6. user opens mobile navigation
7. user uses keyboard navigation through header, search, and docs menu
8. user views a code example
9. user views a diagram
10. user opens a use-case page from the landing page

## 5. Content Details

### 5.1 Core Documentation Pages

Required docs:

1. Introduction
2. Installation
3. Quickstart
4. CLI Guide
5. Configuration Guide
6. Workflow Guide
7. Agent Patterns
8. Human Approval Gates
9. Logs, Replays, and Debugging
10. MCP Installation
11. Deployment
12. FAQ
13. Glossary

### 5.2 Use Case Pages

Required use cases:

1. PR Review Factory
2. Release Readiness Factory
3. Incident Follow-up Factory
4. Data Question Factory
5. Runbook Maintenance Factory
6. Coder / Reviewer Pattern
7. Fully Automated Worktree Merge
8. Dynamic Workflows
9. Browser Backend / Chrome Automation
10. Local Demo / “Just Test It Out”

### 5.3 Concept Pages

Required concepts:

1. What is an agent factory?
2. What is agent orchestration?
3. What is an agentic harness?
4. Strong orchestrator vs. weak executor
5. Generator / discriminator pattern
6. Coder / reviewer pattern
7. Dynamic workflows
8. Fusion
9. Leaderboards
10. Kanban for agent workflows
11. Poka-yoke for agent systems
12. Industrial engineering for agent orchestration
13. Bottlenecks, queues, and throughput
14. Cascading failure in agent systems
15. Guardrails, validation, and infection control

### 5.4 Blog Pages

Initial blog posts:

1. **5000 Commits Later: Agent Factory Pitfalls and Consequences**

   * learnings and practices
   * cost/speed tradeoffs
   * throughput and bottlenecks
   * guards and infection control
   * planning difficulty
   * loopback iteration
   * validation and confirmation
   * contracts and interfaces

2. **Scripts > Agents: On Cascading Failure**

   * why deterministic scripts still matter
   * expected value and failure cost
   * maximal throughput
   * Deming-style process thinking
   * when agents increase lead time

3. **Infinite Agents, Infinite Bottlenecks**

   * scaling agent workflows
   * merge queues
   * worktree bottlenecks
   * traffic shaping
   * queue collapse
   * coordination overhead

4. **Agent Factories: A Case Study in Manga Translation**

   * current system challenges
   * promises of orchestration
   * human review loops
   * future problems

### 5.5 Reference Pages

References should collect:

1. Addy Osmani posts on loop engineering
2. Thariq posts on dynamic workflows
3. OpenAI / Ryan Lopopolo references
4. related GitHub repos
5. related essays
6. related talks
7. related examples
8. related agent orchestration tools

### 5.6 Comparison Pages

Comparison pages:

1. You Agent Factory vs. n8n
2. You Agent Factory vs. Zapier / Make
3. You Agent Factory vs. LangGraph
4. You Agent Factory vs. CrewAI
5. You Agent Factory vs. Cursor / Codex / Claude Code
6. You Agent Factory vs. internal scripts

Comparison dimensions:

* local-first support
* open source
* engineering-native workflow support
* CLI support
* file/config support
* agent harness support
* human approval gates
* logs and replays
* deployment complexity
* cost visibility
* workflow graph support
* team collaboration
* hosted option
* security and auditability

### 5.7 Launch Content Minimum

The first launch should include:

1. Landing page
2. What is You Agent Factory?
3. Installation guide
4. Quickstart guide
5. CLI guide
6. Configuration guide
7. Workflow concepts
8. PR Review Factory use case
9. Release Readiness Factory use case
10. Coder / Reviewer pattern
11. Logs and replays guide
12. FAQ
13. Glossary starter page
14. One comparison page
15. GitHub CTA
16. Hosted or waitlist CTA, if applicable

The first launch should prioritize:

* a clear homepage
* a successful installation path
* one runnable example workflow
* enough concept material to explain the mental model

Blog breadth, extensive comparison coverage, richer references, and advanced visual components can expand after the core user journey works well.

## 6. Structured Implementation Plan

### Phase 1: Foundation

Goal: create a working static documentation site.

Tasks:

* [ ] create Next.js static site
* [ ] configure GitHub Pages deployment
* [ ] add Bun scripts
* [ ] add TypeScript
* [ ] add Biome
* [ ] add Tailwind CSS
* [ ] add shadcn/ui
* [ ] add Fumadocs
* [ ] add MDX support
* [ ] configure static export constraints for GitHub Pages
* [ ] add base route structure
* [ ] add landing page shell
* [ ] add docs layout shell
* [ ] add global header
* [ ] add footer
* [ ] add GitHub CTA
* [ ] add root `Makefile` with shared local and CI entrypoints
* [ ] wire `make test` to `bun test`
* [ ] write README opening with one-line project description and fast-start links

Done when:

* the site builds
* the site deploys to GitHub Pages
* the site builds as a fully static export
* the homepage and docs shell render
* contributors and CI can invoke the same `make` entrypoints successfully
* README starts with a one-line description followed by the next actions a reader needs

### Phase 2: Design System and Shared Hooks

Goal: create the reusable UI foundation before building many pages.

Tasks:

* [ ] define design tokens
* [ ] define breakpoints
* [ ] add base shadcn components
* [ ] add shared `hooks/` directory
* [ ] add shared `types/` directory
* [ ] add `useMediaQuery`
* [ ] add `useBreakpoint`
* [ ] add `useReducedMotion`
* [ ] add `usePrefersColorScheme`
* [ ] add `useKeyboardShortcut`
* [ ] add `useScrollSpy`
* [ ] add `useInPageNav`
* [ ] add unit tests for shared hooks
* [ ] ensure hooks are SSR-safe

Secondary or aspirational hooks and UI behaviors may be declared in architecture documents early, but should not block implementation of the core user journey.

Done when:

* layout behavior uses shared hooks
* no raw media-query logic is scattered across components
* shared hooks have tests

### Phase 3: Localization Foundation

Goal: establish message-based localization early so components do not hardcode strings.

Tasks:

* [ ] add locale registry
* [ ] add default locale
* [ ] add message files
* [ ] add localization provider
* [ ] add `useMessages`
* [ ] add `useLocale`
* [ ] add `useLocalizedDate`
* [ ] add `useLocalizedNumber`
* [ ] add fallback behavior
* [ ] localize navigation labels
* [ ] localize CTA labels
* [ ] localize ARIA labels
* [ ] add localization validation script
* [ ] add tests for missing translation keys
* [ ] add tests for fallback behavior
* [ ] add tests that detect hardcoded user-facing component text where feasible
* [ ] define localized content variant convention
* [ ] define canonical page ids across localized variants
* [ ] validate locale metadata for content pages

Done when:

* component text resolves through messages
* missing required keys fail CI
* the site can switch component language without changing route trees
* localized content pages can coexist as variant files under one canonical content identity

### Phase 4: Content System and Navigation

Goal: make content easy to add and navigate.

Tasks:

* [ ] define content schema
* [ ] define frontmatter schema
* [ ] define canonical content record type
* [ ] define localized search document type
* [ ] add docs content directories
* [ ] add blog content directories
* [ ] add glossary content directories
* [ ] add comparison content directories
* [ ] generate left navigation from metadata
* [ ] generate in-page table of contents
* [ ] add breadcrumbs
* [ ] add previous / next navigation
* [ ] add raw markdown access
* [ ] add content validation script
* [ ] add broken-link checking
* [ ] add sitemap generation

Done when:

* new pages can be added cheaply
* navigation is generated consistently
* invalid content fails validation
* canonical content records can be generated from all supported public content types

### Phase 5: Search

Goal: make the docs searchable.

Tasks:

* [ ] add Orama search
* [ ] build canonical content record generator
* [ ] generate search index
* [ ] index docs
* [ ] index blog
* [ ] index glossary
* [ ] index comparison pages
* [ ] index references
* [ ] add tag-based search
* [ ] add alias-based search
* [ ] add keyboard shortcut
* [ ] add search result previews
* [ ] add search validation tests
* [ ] ensure hidden/internal pages are excluded
* [ ] default search to active locale
* [ ] define ranking weights by content field and content kind

Done when:

* users can search across public content
* common queries return expected pages
* search index generation is tested
* the public index is generated from normalized localized search documents

### Phase 6: Core Content

Goal: create the minimum useful public website.

Tasks:

* [ ] write landing page
* [ ] write introduction
* [ ] write installation guide
* [ ] write quickstart
* [ ] write CLI guide
* [ ] write configuration guide
* [ ] write workflow concepts page
* [ ] write PR Review Factory use case
* [ ] write Release Readiness Factory use case
* [ ] write logs and replays guide
* [ ] write FAQ
* [ ] write glossary starter page
* [ ] write n8n / Zapier / Make comparison page
* [ ] publish canonical-locale versions first where necessary
* [ ] add localized variants for the highest-priority launch pages

Done when:

* a new user can understand, install, and run one workflow
* the docs answer the first set of obvious questions
* the highest-priority launch path exists in at least one fully supported locale with a clear expansion path for others

### Phase 7: Diagrams, Charts, and Rich Components

Goal: add richer educational and explanatory components.

Tasks:

* [ ] add code block component
* [ ] add code tabs component
* [ ] add callout component
* [ ] add file tree component
* [ ] add Mermaid renderer
* [ ] add React Flow renderer
* [ ] add Recharts wrapper
* [ ] add line chart component
* [ ] add bar chart component
* [ ] add statistical process control chart
* [ ] add cascading failure diagram
* [ ] add workflow transition diagram
* [ ] add responsive behavior through shared hooks
* [ ] add reduced-motion support

Done when:

* docs can explain workflows visually
* charts and diagrams are responsive and accessible

### Phase 8: Quality Gates

Goal: enforce correctness before merge and deployment.

Tasks:

* [ ] add unit tests
* [ ] add component tests
* [ ] add accessibility tests
* [ ] add localization tests
* [ ] add content tests
* [ ] add search tests
* [ ] add Playwright E2E tests
* [ ] enforce 90 percent code coverage in CI for component packages where package-level enforcement is practical
* [ ] add Lighthouse CI
* [ ] add bundle budget checks
* [ ] add image optimization checks
* [ ] add type checks
* [ ] add lint checks
* [ ] add CI workflow
* [ ] require passing CI before merge
* [ ] deploy automatically on changes to `main` after successful required checks

Repository settings such as branch protection should be tracked separately from the code implementation plan.

Done when:

* PRs cannot merge unless tests pass
* accessibility, localization, content, and performance are validated automatically
* code coverage at or above 90 percent is enforced in CI for component packages where package-level enforcement is practical
* deployment is fully automatic on changes to `main` once the required checks pass

### Phase 9: Expansion Content

Goal: build the broader agent orchestration knowledge base.

Tasks:

* [ ] write Scripts > Agents blog post
* [ ] write 5000 Commits Later blog post
* [ ] write Infinite Agents, Infinite Bottlenecks blog post
* [ ] write Manga Translation case study
* [ ] add additional concept pages
* [ ] add additional comparison pages
* [ ] add external reference pages
* [ ] add more workflow templates
* [ ] add hosted/waitlist CTA if applicable

Done when:

* the site becomes useful not only as product docs, but as a broader agent orchestration learning hub

## 7. Definition of Done

The first public version is done when:

1. The site builds statically.
2. The site publishes to GitHub Pages.
3. The homepage explains the product in under 30 seconds.
4. The docs explain installation, quickstart, CLI, configuration, and workflows.
5. A new user can run one example workflow.
6. Search works across public docs.
7. Navigation works across pages and within pages.
8. Localization supports both message/config-based UI text and localized content variants.
9. Shared responsive behavior is implemented through hooks.
10. Components avoid hardcoded user-facing strings.
11. Accessibility tests pass.
12. Localization tests pass.
13. Content validation passes.
14. Search validation passes.
15. Lighthouse checks pass.
16. CI validates build, lint, typecheck, tests, links, content, localization, accessibility, and performance.
17. PRs cannot merge unless checks pass.
18. The site can cheaply add new docs, blogs, references, glossary pages, and localized component text.
19. Public search is generated from structured content metadata and localized search documents rather than raw file discovery.
20. README begins with a one-line description of the project and then expands into the next required details.
21. Contributors and CI use the same top-level `make` commands successfully.
22. CI enforces at least 90 percent component coverage.
23. Deployment is fully automated after required checks succeed.
