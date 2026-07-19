# Site Config Contract Rewrite Relevant Files

Use these files when neutralizing or retargeting the shared `SiteConfig`
contract for the you-agent-factory CLI docs product.

## Key files

| Path | Role |
| --- | --- |
| `src/lib/site/site-config.contract.ts` | Shared `SiteConfig` shape: open route-surface map, open collection family strings, nav/home copy keys from `UiMessages` (not Atlas-locked) |
| `src/lib/site/site-config.contract.test.ts` | Contract tests; CLI representative fixture must type-check without topology/timeline/AI collections |
| `src/lib/scaffold.ts` | Shared scaffold brand constants (`SCAFFOLD_ID`, `SITE_BRAND_NAME` = `YOU` header mark, `SITE_PRODUCT_NAME` / `SITE_HEADING` = full product name) consumed by the default site config |
| `src/lib/site/you-agent-factory-site-config.ts` | Product default config: you-agent-factory brand/repo, CLI primary nav/route placeholders, CLI collections (`guides`/`concepts`/`techniques`/`documentation`), and CLI `homeFeaturedLinks` (guides/docs/blog — no glossary advertising) |
| `src/lib/site/site-config-layout-nav.ts` | Client-safe brand/home resolution (`resolveSiteConfigLayoutNav`) for header chrome; no Node/`pages` imports |
| `src/lib/site/site-config-resolution.ts` | Resolves primary nav hrefs and home featured links from `SiteConfig`; re-exports layout-nav helpers |
| `src/components/layout/primary-nav.ts` | Shell primary nav consumer of `SiteConfig.primaryNav` / `routeSurfaces` |
| `src/lib/layout.shared.tsx` | Layout `baseOptions` defaults to `youAgentFactorySiteConfig` |
| `src/content/messages/{en,vi,ja,zh-CN}/common.json` | Shell UI messages; `nav.guides` / `nav.docs` plus W15 family keys `nav.references` / `nav.factories` / `nav.workers` / `nav.workstations` |

## Contract shape rules (rewrite era)

- `SITE_NAMED_ROUTE_SURFACES` documents CLI placeholders (`home`, `guides`,
  `docs`, `blogIndex`, `search`, plus W15 family destinations
  `references`, `factories`, `workers`, `workstations`). It is **not** a
  mandatory closed set on `SiteConfig.routeSurfaces`. The glossary index
  surface is retired and must not reappear as a named route placeholder.
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

- Default **header chrome brand mark** resolves to `YOU` via scaffold
  `SITE_BRAND_NAME` and `youAgentFactorySiteConfig.brand.brandName`. Use this
  for reader-visible header chrome (`resolveSiteConfigLayoutNav` /
  `data-docs-header-brand`).
- Full product display name (`SITE_PRODUCT_NAME` / `SITE_HEADING`) stays
  `You Agent Factory` for home heading, document/SEO titles
  (`siteMetadata.title`), and repository-facing identity. Visible header mark
  and SEO title may differ.
- Technical package/CLI/repo/route literals remain `you-agent-factory`
  (executable name, repository URL path, install commands, technical prose).
- Default repository URL is
  `https://github.com/portpowered/you-agent-factory`
  (`YOU_AGENT_FACTORY_REPOSITORY_URL`).
- Layout brand title comes from `resolveSiteConfigLayoutNav` →
  `config.brand.brandName` (not UI message `home.title`). Keep `home.title` and
  root `siteMetadata.title` on the full product name when SEO/home identity
  must remain accurate.
- Docs header brand chrome (`DocsHeader`) imports layout-nav from
  `site-config-layout-nav.ts` (not `site-config-resolution.ts`) so the client
  bundle does not pull Node-only featured-link helpers. It renders the resolved
  title/url as a visible home link (`data-docs-header-brand`); Fumadocs layout
  `nav` stays disabled, so the custom header owns the brand surface.

## Primary nav / route placeholders

- Default primary nav is Blog, Docs, Guides, References only (no Home text
  chip, Factories, Workers, Workstations, Glossary, Topology, or Timeline).
  Home remains reachable via the header brand/logo. Search is a configured
  `routeSurfaces.search` entry for the header trigger, not a primary nav item
  (avoids duplicating the search control).
- W15 family destinations remain configured as `routeSurfaces.references` /
  `factories` / `workers` / `workstations` (`docs-page` slugs matching each
  family index) for page routes and discovery; only `references` stays in
  header `primaryNav` (after Guides). Factories / workers / workstations are
  not header primary-nav text items.
- Header search chrome copy (`messages.search.placeholder` / open / shortcut in
  `common.json`) must not say Model Atlas; placeholder identifies
  `you-agent-factory` (or neutral CLI docs search).
- Resolved default primary-nav hrefs: `/blog`, `/browse`, `/docs/guides`,
  `/docs/references`. Guides uses `{ surface: "docs-page", slug: "guides" }`;
  Docs uses `{ surface: "browse" }` as the transitional docs landing
  placeholder. Family surfaces still resolve to `/docs/references`,
  `/docs/factories`, `/docs/workers`, and `/docs/workstations`
  (locale-prefixed when localized) when used outside primary nav.
- Nav label keys `blog`, `docs`, `guides`, and `references` live on
  `NavMessages` / `common.json`. W15 topology still requires `factories`,
  `workers`, and `workstations` on `NavMessages` / `common.json` (aligned with
  family index titles; not the full reference chrome corpus) even though those
  labels are no longer primary-nav chips.
- Exact-order / desktop↔mobile primary-nav parity proofs live in
  `src/components/layout/w15-primary-nav-family-parity.test.tsx` (and
  `primary-nav.test.ts`). Both Primary landmarks must share the same
  Blog/Docs/Guides/References hrefs/labels/order; Search stays a header
  control only.
- `DocsHeader` / `getPrimaryNavItems` do not accept Atlas `topologyOptions`;
  canonical docs layout no longer wires topology navigation into the header.
  Topology browse remains a separate page-surface concern in site-renderers.

## Collections / home featured links

- Default `collections` are exactly `SITE_COLLECTION_FAMILIES`:
  `guides`, `concepts`, `techniques`, `documentation`.
- Default `homeFeaturedLinks` lists CLI route destinations (guides, docs/browse,
  blogIndex) bound to `guidesLink*` / `docsLink*` / `blogLink*` home message
  keys — not glossary or Atlas module slugs. Do not reintroduce a glossary
  `routeSurfaces` entry or `/docs/glossary` index app route; individual
  glossary term pages may still exist under `/docs/glossary/<slug>` via the
  docs catch-all when published.
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
  (Blog/Docs/Guides/References) and must not require Home-as-text,
  Factories/Workers/Workstations/Glossary, or Topology/Timeline/Tags as
  primary destinations.
- Sidebar/layout brand link assertions should use `YOU` for the header chrome
  mark driven by the default site config (not the full product name). Explorer
  root / home title / SEO may still use `You Agent Factory`.
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
