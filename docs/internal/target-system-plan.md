# Target System Plan

## 1. Planning Intent

This document describes the target implementation plan for the You Agent Factory docs site. It focuses on phased delivery, observable outcomes, and reviewer-verifiable completion criteria rather than on architecture detail alone.

## 2. Delivery Principles

The plan should preserve these constraints:

* phases should build toward a usable public docs journey early
* each phase should deliver observable behavior, not only file movement
* architecture should stay sparse until repeated patterns justify new layers
* contributors and CI should use the same top-level `make` entrypoints
* validation should expand alongside user-facing capability

## 3. Phased Plan

### Phase 1: Foundation

Goal: create a working static documentation site.

Primary work:

* create the Next.js static site baseline
* configure GitHub Pages deployment
* add Bun, TypeScript, Biome, Tailwind CSS, shadcn/ui, and MDX support
* add the base route structure, homepage shell, docs shell, header, footer, and GitHub CTA
* add the root `Makefile` entrypoints used by both contributors and CI
* ensure `README.md` begins with a one-line project description and fast-start guidance

Done when:

* the site builds and exports statically
* the deployment path works for GitHub Pages
* the homepage and docs shell render
* contributors and CI can run the same top-level commands successfully

### Phase 2: Design System and Shared Hooks

Goal: create the reusable UI foundation before broader page expansion.

Primary work:

* define design tokens and breakpoints
* add base shadcn components
* add shared hooks and shared types
* introduce responsive, motion, navigation, and disclosure hooks
* keep hooks typed, tested, SSR-safe, and based on shared responsive tokens

Done when:

* layout behavior uses shared hooks
* responsive logic is not scattered through components
* shared hooks have focused regression coverage

### Phase 3: Localization Foundation

Goal: establish message-based localization before component copy spreads.

Primary work:

* add locale registry and default locale handling
* add message files, provider wiring, and localization hooks
* localize navigation labels, CTA labels, and ARIA labels
* add fallback behavior and validation scripts
* define localized content-variant conventions and canonical page identities

Done when:

* component text resolves through the message system
* missing required keys fail validation
* component language can change without route duplication
* localized content variants can coexist under one canonical identity

### Phase 4: Content System and Navigation

Goal: make content easy to add, validate, and navigate.

Primary work:

* define frontmatter and content schemas
* define canonical content records and localized search documents
* add docs, blog, glossary, comparison, and reference content directories
* generate docs navigation, breadcrumbs, in-page navigation, and previous/next controls
* add raw markdown access, sitemap generation, and broken-link validation

Done when:

* new pages can be added cheaply
* navigation is generated consistently from metadata
* invalid content fails validation
* canonical content records can be derived for supported public content

### Phase 5: Search

Goal: make public content searchable through normalized indexed documents.

Primary work:

* add Orama-backed search
* generate canonical content records
* generate localized search documents and the public search index
* index docs, blog, glossary, references, and comparison content
* support tag search, alias search, active-locale behavior, previews, and ranking weights

Done when:

* users can search across public content
* hidden and internal pages are excluded
* common queries return expected results
* search generation is tested from normalized localized documents

### Phase 6: Core Content

Goal: create the minimum useful public site for first-time users.

Primary work:

* write the landing page
* write introduction, installation, quickstart, CLI, configuration, and workflow concept pages
* add the first use cases, FAQ, glossary starter, and at least one comparison page
* publish the canonical-locale versions first, then high-priority localized variants

Done when:

* a new user can understand, install, and run one workflow
* the docs answer the obvious first questions
* the launch path exists in at least one fully supported locale

### Phase 7: Diagrams, Charts, and Rich Components

Goal: improve teaching quality with reusable visual documentation primitives.

Primary work:

* add code block, code tabs, callout, and file tree primitives
* add Mermaid, React Flow, and chart wrappers
* add responsive and reduced-motion behavior through shared hooks

Done when:

* docs can explain workflows visually
* rich primitives are responsive and accessible

### Phase 8: Quality Gates

Goal: enforce correctness before merge and deployment.

Primary work:

* add unit, component, accessibility, localization, content, search, and E2E coverage
* add component coverage enforcement, typecheck, lint, static-export validation, and budget checks
* add Lighthouse CI and bundle or performance thresholds
* require passing CI before merge
* deploy automatically after required checks pass on `main`

Done when:

* required validations block bad merges
* accessibility, localization, content, and performance checks run automatically
* component coverage enforcement is active where practical
* deploy-on-success automation is in place

### Phase 9: Expansion Content

Goal: broaden the site into a larger agent orchestration knowledge base.

Primary work:

* add the planned blog posts
* expand concepts, comparisons, references, and workflow templates
* add hosted or waitlist CTA paths if applicable

Done when:

* the site is useful as both product docs and a broader learning hub

## 4. Cross-Phase Quality Expectations

Each implementation phase should preserve:

* accessibility and responsive behavior
* message-based localization
* static-export compatibility
* content and search validation
* shared-shell consistency
* automation parity between local workflows and CI

## 5. Reviewable Evidence

When this plan drives implementation, reviewers should expect evidence at the smallest useful layer:

* focused unit or functional tests for pure logic and content projections
* component tests for rendering, accessibility states, and navigation behavior
* sparse E2E tests for the highest-risk user journeys
* command-level verification through shared `make` entrypoints

## 6. Sequencing Note

This plan is intentionally target-state oriented. Current repository progress may already satisfy portions of early phases, so implementation work should update this plan by marking delivered behavior and narrowing the remaining gaps rather than treating every checkbox as still open.
