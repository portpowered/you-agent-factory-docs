# Site Config Contract Rewrite Relevant Files

Use these files when neutralizing or retargeting the shared `SiteConfig`
contract for the you-agent-factory CLI docs product.

## Key files

| Path | Role |
| --- | --- |
| `src/lib/site/site-config.contract.ts` | Shared `SiteConfig` shape: open route-surface map, open collection family strings, nav/home copy keys from `UiMessages` (not Atlas-locked) |
| `src/lib/site/site-config.contract.test.ts` | Contract tests; CLI representative fixture must type-check without topology/timeline/AI collections |
| `src/lib/scaffold.ts` | Shared scaffold brand constants (`SCAFFOLD_ID`, `SITE_BRAND_NAME`, `SITE_HEADING`) consumed by the default site config |
| `src/lib/site/you-agent-factory-site-config.ts` | Product default config: you-agent-factory brand/repo, CLI primary nav/route placeholders, CLI collections (`guides`/`concepts`/`techniques`/`documentation`), and empty `homeFeaturedLinks` for B01 |
| `src/lib/site/site-config-resolution.ts` | Resolves brand, primary nav hrefs, and home featured links from `SiteConfig` |
| `src/components/layout/primary-nav.ts` | Shell primary nav consumer of `SiteConfig.primaryNav` / `routeSurfaces` |
| `src/lib/layout.shared.tsx` | Layout `baseOptions` defaults to `youAgentFactorySiteConfig` |
| `src/content/messages/{en,vi,ja}/common.json` | Shell UI messages; `nav.guides` / `nav.docs` label keys for CLI primary nav |

## Contract shape rules (rewrite era)

- `SITE_NAMED_ROUTE_SURFACES` documents CLI placeholders (`home`, `guides`,
  `docs`, `glossary`, `blogIndex`, `search`). It is **not** a mandatory closed
  set on `SiteConfig.routeSurfaces`.
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

- Default brand resolves to `you-agent-factory` via scaffold constants and
  `youAgentFactorySiteConfig.brand`.
- Default repository URL is
  `https://github.com/portpowered/you-agent-factory`
  (`YOU_AGENT_FACTORY_REPOSITORY_URL`).
- Layout brand title comes from `resolveSiteConfigLayoutNav` →
  `config.brand.brandName` (not UI message `home.title`).

## Primary nav / route placeholders

- Default primary nav is Home, Guides, Docs, Glossary, Blog (no Topology or
  Timeline). Search is a configured `routeSurfaces.search` entry for the header
  trigger, not a primary nav item (avoids duplicating the search control).
- Resolved default hrefs: `/`, `/docs/guides`, `/browse`, `/docs/glossary`,
  `/blog`. Guides uses `{ surface: "docs-page", slug: "guides" }`; Docs uses
  `{ surface: "browse" }` as the transitional docs landing placeholder.
- Nav label keys `guides` and `docs` live on `NavMessages` / `common.json`.

## Collections / home featured links

- Default `collections` are exactly `SITE_COLLECTION_FAMILIES`:
  `guides`, `concepts`, `techniques`, `documentation`.
- Default `homeFeaturedLinks` is an empty placeholder list (no Atlas module
  slugs, no final home marketing copy). B01 owns final featured-link copy.
- Type empty featured links as `[] as SiteConfig["homeFeaturedLinks"]` when
  the default config uses `as const satisfies SiteConfig`, so the field stays
  assignable as `HomeFeaturedLinkPlaceholder[]` rather than `readonly []`.
- Locale-fallback coverage for docs-page featured links should use an explicit
  fixture config, not the empty default list.

## Default export naming

- Product default export is `youAgentFactorySiteConfig` from
  `you-agent-factory-site-config.ts`.
- Do not reintroduce `modelAtlasSiteConfig` / `model-atlas-site-config.ts` as
  the product default; B01 may still rename header chrome separately.
- Adapters (`primary-nav`, `layout.shared`, header, home renderer) must default
  to `youAgentFactorySiteConfig`.

## Regression test retargeting

- Shell compatibility tests that assert primary nav must expect CLI labels
  (Home/Guides/Docs/Glossary/Blog) and must not require Topology/Timeline/
  Tags as primary destinations.
- Sidebar/layout brand link assertions should use `you-agent-factory`, not
  `Model Atlas`, when driven by the default site config.

## Story sequencing

1. Neutralize contract shape (this lane story 001).
2. Replace default brand/repo identity (story 002).
3. Retarget default nav/route placeholders (story 003).
4. Replace default collections and home featured links (story 004).
5. Align adapters/regression coverage with the new default (story 005).
