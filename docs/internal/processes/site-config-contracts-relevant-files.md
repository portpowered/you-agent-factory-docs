# Site Config Contract Rewrite Relevant Files

Use these files when neutralizing or retargeting the shared `SiteConfig`
contract for the you-agent-factory CLI docs product.

## Key files

| Path | Role |
| --- | --- |
| `src/lib/site/site-config.contract.ts` | Shared `SiteConfig` shape: open route-surface map, open collection family strings, nav/home copy keys from `UiMessages` (not Atlas-locked) |
| `src/lib/site/site-config.contract.test.ts` | Contract tests; CLI representative fixture must type-check without topology/timeline/AI collections |
| `src/lib/site/model-atlas-site-config.ts` | Transitional default config (still Atlas-shaped until later rewrite stories) |
| `src/lib/site/site-config-resolution.ts` | Resolves brand, primary nav hrefs, and home featured links from `SiteConfig` |
| `src/components/layout/primary-nav.ts` | Shell primary nav consumer of `SiteConfig.primaryNav` / `routeSurfaces` |

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

## Story sequencing

1. Neutralize contract shape (this lane story 001).
2. Replace default brand/repo identity.
3. Retarget default nav/route placeholders.
4. Replace default collections and home featured links.
5. Align adapters/regression coverage with the new default.
