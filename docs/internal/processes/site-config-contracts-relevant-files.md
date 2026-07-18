# Site Config Contract Rewrite Relevant Files

Use these files when neutralizing or retargeting the shared `SiteConfig`
contract for the you-agent-factory CLI docs product.

## Key files

| Path | Role |
| --- | --- |
| `src/lib/site/site-config.contract.ts` | Shared `SiteConfig` shape: open route-surface map, open collection family strings, nav/home copy keys from `UiMessages` (not Atlas-locked) |
| `src/lib/site/site-config.contract.test.ts` | Contract tests; CLI representative fixture must type-check without topology/timeline/AI collections |
| `src/lib/scaffold.ts` | Shared scaffold brand constants (`SCAFFOLD_ID`, `SITE_BRAND_NAME`, `SITE_HEADING`) consumed by the default site config |
| `src/lib/site/you-agent-factory-site-config.ts` | Product default config: you-agent-factory brand/repo, CLI primary nav/route placeholders, CLI collections (`guides`/`concepts`/`techniques`/`documentation`), and CLI `homeFeaturedLinks` (guides/docs/glossary/blog) |
| `src/lib/site/site-config-layout-nav.ts` | Client-safe brand/home resolution (`resolveSiteConfigLayoutNav`) for header chrome; no Node/`pages` imports |
| `src/lib/site/site-config-resolution.ts` | Resolves primary nav hrefs and home featured links from `SiteConfig`; re-exports layout-nav helpers |
| `src/components/layout/primary-nav.ts` | Shell primary nav consumer of `SiteConfig.primaryNav` / `routeSurfaces` |
| `src/lib/layout.shared.tsx` | Layout `baseOptions` defaults to `youAgentFactorySiteConfig` |
| `src/content/messages/{en,vi,ja,zh-CN}/common.json` | Shell UI messages; `nav.guides` / `nav.docs` plus W15 family keys `nav.references` / `nav.factories` / `nav.workers` / `nav.workstations` |

## Contract shape rules (rewrite era)

- `SITE_NAMED_ROUTE_SURFACES` documents CLI placeholders (`home`, `guides`,
  `docs`, `glossary`, `blogIndex`, `search`, plus W15 family destinations
  `references`, `factories`, `workers`, `workstations`). It is **not** a
  mandatory closed set on `SiteConfig.routeSurfaces`.
- `routeSurfaces` is `Record<string, LocalizedRouteDestination>` so products can
  omit topology/timeline and add CLI surfaces without fighting the type.
- `SITE_COLLECTION_FAMILIES` documents CLI families (`guides`, `concepts`,
  `techniques`, `documentation`). Collection `family` values are plain strings;
  Atlas AI families are not required.
- `PrimaryNavLabelKey` / home featured-link title/description keys are
  `keyof UiMessages["nav"]` / `keyof UiMessages["home"]` — not locked to
  topology/timeline or Atlas module link keys.
- Missing route-surface lookups in resolution/nav should throw an explicit
  error rather than pass `undefined` into `buildLocalizedRoute`.

## Brand / repository identity

- Default **display brand** resolves to `You Agent Factory` via scaffold
  constants (`SITE_BRAND_NAME`, `SITE_HEADING`) and
  `youAgentFactorySiteConfig.brand`. Use this for reader-visible header chrome,
  home title identity, and document/metadata brand surfaces.
- Technical package/CLI/repo/route literals remain `you-agent-factory`
  (executable name, repository URL path, install commands, technical prose).
- Default repository URL is
  `https://github.com/portpowered/you-agent-factory`
  (`YOU_AGENT_FACTORY_REPOSITORY_URL`).
- Layout brand title comes from `resolveSiteConfigLayoutNav` →
  `config.brand.brandName` (not UI message `home.title`). Keep `home.title` and
  root `siteMetadata.title` aligned with the same display brand string.
- Docs header brand chrome (`DocsHeader`) imports layout-nav from
  `site-config-layout-nav.ts` (not `site-config-resolution.ts`) so the client
  bundle does not pull Node-only featured-link helpers. It renders the resolved
  title/url as a visible home link (`data-docs-header-brand`); Fumadocs layout
  `nav` stays disabled, so the custom header owns the brand surface.

## Primary nav / route placeholders

- Default primary nav is Home, Guides, Docs, References, Factories, Workers,
  Workstations, Glossary, Blog (no Topology or Timeline). Search is a configured
  `routeSurfaces.search` entry for the header trigger, not a primary nav item
  (avoids duplicating the search control).
- W15 family destinations are configured as `routeSurfaces.references` /
  `factories` / `workers` / `workstations` (`docs-page` slugs matching each
  family index) and are **members of** `primaryNav` in that relative order
  (references → factories → workers → workstations), placed after Docs and
  before Glossary.
- Header search chrome copy (`messages.search.placeholder` / open / shortcut in
  `common.json`) must not say Model Atlas; placeholder identifies
  `you-agent-factory` (or neutral CLI docs search).
- Resolved default hrefs: `/`, `/docs/guides`, `/browse`, `/docs/references`,
  `/docs/factories`, `/docs/workers`, `/docs/workstations`, `/docs/glossary`,
  `/blog`. Guides uses `{ surface: "docs-page", slug: "guides" }`; Docs uses
  `{ surface: "browse" }` as the transitional docs landing placeholder.
  Family surfaces resolve to `/docs/references`, `/docs/factories`,
  `/docs/workers`, and `/docs/workstations` (locale-prefixed when localized).
- Nav label keys `guides` and `docs` live on `NavMessages` / `common.json`.
  W15 topology also requires `references`, `factories`, `workers`, and
  `workstations` on `NavMessages` / `common.json` (aligned with family index
  titles; not the full reference chrome corpus).
- Exact-order / desktop↔mobile family parity proofs live in
  `src/components/layout/w15-primary-nav-family-parity.test.tsx` (and
  `primary-nav.test.ts` relative-order coverage). Both Primary landmarks must
  share the same family hrefs/labels/relative order; Search stays a header
  control only.
- `DocsHeader` / `getPrimaryNavItems` do not accept Atlas `topologyOptions`;
  canonical docs layout no longer wires topology navigation into the header.
  Topology browse remains a separate page-surface concern in site-renderers.

## Collections / home featured links

- Default `collections` are exactly `SITE_COLLECTION_FAMILIES`:
  `guides`, `concepts`, `techniques`, `documentation`.
- Default `homeFeaturedLinks` lists CLI route destinations (guides, docs/browse,
  glossary, blogIndex) bound to `guidesLink*` / `docsLink*` / `glossaryLink*` /
  `blogLink*` home message keys — not Atlas module slugs.
- Type featured-link arrays as `… as SiteConfig["homeFeaturedLinks"]` when the
  default config uses `as const satisfies SiteConfig`, so the field stays
  assignable as `HomeFeaturedLinkPlaceholder[]`.
- Locale-fallback coverage for docs-page featured links should use an explicit
  fixture config when testing docs-page kind resolution separately from the
  default route-kind list.

## Default export naming

- Product default export is `youAgentFactorySiteConfig` from
  `you-agent-factory-site-config.ts`.
- Do not reintroduce `modelAtlasSiteConfig` / `model-atlas-site-config.ts` as
  the product default; B01 may still rename header chrome separately.
- Adapters (`primary-nav`, `layout.shared`, header, home renderer) must default
  to `youAgentFactorySiteConfig`.

## Regression test retargeting

- Shell compatibility tests that assert primary nav must expect CLI labels
  (Home/Guides/Docs/References/Factories/Workers/Workstations/Glossary/Blog)
  and must not require Topology/Timeline/Tags as primary destinations.
- Sidebar/layout brand link assertions should use `You Agent Factory`, not
  `Model Atlas` or the package slug alone, when driven by the default site
  config.
- CLI docs header regression lock-in lives in
  `src/components/layout/docs-header.test.tsx` ("locks CLI shell header brand,
  primary nav, and Search together") and
  `src/tests/a11y/primary-navigation.a11y.test.tsx` (brand + CLI Primary +
  Search on the canonical layout). Do not reintroduce Model Atlas header
  component names, Topology/Timeline primary items, or Model Atlas search
  chrome copy in those surfaces.
- W15 family exact-order and desktop/mobile Primary parity:
  `src/components/layout/w15-primary-nav-family-parity.test.tsx`.

## Story sequencing

1. Neutralize contract shape (this lane story 001).
2. Replace default brand/repo identity (story 002).
3. Retarget default nav/route placeholders (story 003).
4. Replace default collections and home featured links (story 004).
5. Align adapters/regression coverage with the new default (story 005).
