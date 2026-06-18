# Technology Choices and Actual Architecture

## 1. Purpose

This document captures two things separately:

* the chosen technology direction for the docs site
* the actual repository architecture as it exists today

It should stay sparse, current, and implementation-facing.

## 2. Platform Choices

### 2.1 Core Stack

Current stack choices:

* React
* Next.js
* TypeScript
* Bun
* Biome
* GitHub Pages static export

Planned or architecture-level choices referenced by the target system:

* MDX for content pages
* shadcn/ui-style component primitives
* Orama-backed search artifact generation
* Mermaid for lightweight diagrams
* React Flow for workflow-style diagrams

### 2.2 Hosting Constraints

The architecture assumes a fully static deployment model.

Constraints:

* no required request-time server runtime
* content, search artifacts, and metadata generated at build time
* routes and assets compatible with GitHub Pages base-path behavior
* features that require server-side request handling are out of scope unless replaced with a static equivalent

### 2.3 Quality and Validation Tooling

Current repo validation tooling includes:

* `bun test`
* custom content, localization, accessibility, static-export, and search-index validation scripts
* component coverage enforcement scripts
* site budget checks
* Playwright dependency presence for future or expanding browser-level verification

## 3. Actual Repository Architecture

### 3.1 Current Top-Level Shape

The current implementation currently centers on a transitional flat structure:

```txt
src/
  app/
  components/
  content/
  hooks/
  lib/
  localization/
  types/

tests/
  fixtures/
  helpers/
  setup/
  unit/

scripts/
.github/workflows/
public/search/
docs/internal/
```

This shape is useful as a bootstrap baseline, but it should not be treated as the long-term package design for a mature docs website.

### 3.2 Current Application Surfaces

The current `src/app` surface includes:

* homepage rendering
* docs index and slug-based docs routes
* a docs example route for code presentation
* shared global layout and not-found handling

### 3.3 Current Component Architecture

Components are currently organized around product areas:

* `src/components/docs/` for docs rendering, outline, progression, diagrams, and primitives
* `src/components/landing/` for homepage composition
* `src/components/shell/` for shared header, navigation, responsive disclosure, and shell layout

This is already aligned with the repository website standards:

* reusable components over page-specific one-offs
* feature behavior close to its owning area
* shared shell responsibilities separated from content loading

However, the current split is still flatter than the desired mature package shape. The long-term architecture should move these areas under feature-owned package boundaries instead of continuing to grow global `components/` and `hooks/` trees.

### 3.4 Current Content Architecture

Public content currently lives under `src/content/` and already uses per-page directories with localized file variants such as `en.mdx` and `fr.mdx`.

Current content categories include:

* docs
* blog
* glossary
* comparisons
* references

This means the repo has already moved beyond a simple file dump and into a canonical-content-plus-localized-variant model.

### 3.5 Current Localization Architecture

Localization is already implemented as a shared message system under `src/localization/`:

```txt
src/localization/
  config/
  context/
  hooks/
  lib/
  messages/
```

Observed characteristics:

* locale registry and default locale config exist
* localized messages exist at least for `en` and `fr`
* hooks exist for locale and formatter access
* message resolution and validation utilities are implemented

### 3.6 Current Content and Search Architecture

Current content and search logic is concentrated under `src/lib/content/`.

Existing capabilities include:

* docs navigation generation
* breadcrumbs and page outline projection
* frontmatter parsing and content validation
* locale metadata validation
* localized content resolution
* canonical or localized identity helpers
* search document and search artifact loading
* public search index generation and validation

This area is the practical architecture center of the current docs system.

### 3.7 Current Hooks and State Shape

Current shared hooks are intentionally narrow and reusable:

* `src/hooks/media/` for breakpoint and reduced-motion behavior
* `src/hooks/layout/` for responsive shell and disclosure state

The codebase currently keeps browser and responsive behavior behind hooks and shared libs rather than scattering ad hoc `window` logic through UI components.

### 3.8 Current Testing and Automation Shape

The current test suite is concentrated in `tests/unit/` plus helpers and fixtures, with strong coverage around:

* shell behavior
* docs navigation and page loading
* localization and formatter behavior
* content validation
* search generation and validation
* static export and quality-gate command behavior
* rich docs primitives such as callouts, code blocks, Mermaid, and React Flow

CI and automation are represented through:

* `.github/workflows/ci.yml`
* `.github/workflows/deploy-pages.yml`
* root `make` entrypoints described in `README.md`

## 4. Target Architectural Shape

The target architecture should shift to a feature-first package structure that mirrors a mature website codebase instead of a flat global `components/` and `hooks/` layout.

```txt
src/
  app/
  features/
    docs/
      components/
      hooks/
      lib/
      server/
      types/
    landing/
      components/
      hooks/
      lib/
      server/
      types/
    search/
      components/
      hooks/
      lib/
      server/
      types/
    localization/
      components/
      hooks/
      lib/
      types/
    shared-shell/
      components/
      hooks/
      lib/
      types/
    content-system/
      lib/
      server/
      types/
    diagrams/
      components/
      hooks/
      lib/
      types/
  shared/
    components/
    hooks/
    lib/
    types/
    styles/
  content/
  localization/
  lib/
  types/
```

Guiding rules:

* organize code by feature or domain first, then by technical role inside that feature
* reserve `shared/` for primitives or helpers that are genuinely reused across multiple features
* keep content, shell behavior, localization, and search owned by explicit feature packages
* prefer reusable primitives and projections over page-specific coupling
* preserve canonical content identity separately from locale-specific rendering
* keep architecture sparse until repeated complexity justifies new layers

### 4.1 Feature Package Rules

Each feature package should be internally structured so responsibilities remain obvious as the site grows.

Expected package roles:

* `components/` for feature-owned UI surfaces
* `hooks/` for feature-owned client behavior
* `lib/` for pure logic, selectors, projections, and utilities
* `server/` for build-time or server-only loading, parsing, and generation work
* `types/` for feature-owned contracts

Rules:

* feature packages should own their rendering, state projection, validation seams, and feature-specific helpers together
* shared primitives should move to `shared/` only after real multi-feature reuse appears
* app routes should compose feature packages rather than owning substantial business or content logic directly
* cross-feature dependencies should flow through explicit contracts, not through ad hoc imports into another feature's internal files

### 4.2 Migration Direction From Current State

The current flat layout should be treated as an implementation waypoint.

Preferred migration direction:

* `src/components/docs/*` -> `src/features/docs/components/*`
* `src/components/landing/*` -> `src/features/landing/components/*`
* `src/components/shell/*` -> `src/features/shared-shell/components/*`
* `src/hooks/layout/*` that are shell-owned -> `src/features/shared-shell/hooks/*`
* `src/hooks/media/*` that are broadly reused -> `src/shared/hooks/*`
* `src/lib/content/*` -> split between `src/features/content-system/` and feature-owned consumers such as `src/features/docs/` or `src/features/search/`

The goal is not to force immediate churn. The goal is to prevent future architecture growth from accumulating under coarse global folders that become harder to reason about over time.

## 5. Key System Rules

### 5.1 Localization

The system should continue to enforce:

* message-based UI localization
* localized content variants under stable canonical identities
* localized metadata support
* explicit fallback behavior
* validation for missing keys and invalid locale metadata

Localization implementation should preferably be feature-first as well:

* shell-facing localization behavior should live with the shared-shell feature
* content-localization identity and resolution behavior should live with the content-system feature
* only genuinely cross-feature message primitives should remain in global shared spaces

### 5.2 Search and Content Modeling

The architecture should continue to model search as normalized content data, not raw file discovery.

Required concepts:

* canonical content records
* localized search documents
* structured metadata-driven inclusion or exclusion
* ranking by content kind, title, aliases, headings, tags, and search priority

### 5.3 Navigation

Navigation should continue to be derived from content metadata wherever possible.

Required navigation surfaces:

* shared header
* docs navigation
* breadcrumbs
* in-page outline
* previous and next progression

Docs navigation behavior should be owned by the docs feature package, even when it reuses shared-shell primitives.

### 5.4 Responsive and Accessibility Behavior

Responsive and accessibility behavior should continue to use shared hooks, shared shell components, and visible semantics rather than one-off page logic.

## 6. Known Differences Between Target and Current State

Compared with the earlier all-in-one plan, the current repo already has meaningful implementation in place for:

* shared shell behavior
* localized message infrastructure
* localized content resolution
* public search artifact generation
* docs primitives such as code presentation and diagrams
* quality-gate scripting and budget enforcement

Areas still best treated as target-state or expandable architecture rather than fully current baseline:

* broader content breadth across all planned docs and comparisons
* richer charting surfaces
* expanded E2E coverage depth
* fully realized analytics and SEO instrumentation breadth
* any additional component-library adoption beyond the current implemented stack
