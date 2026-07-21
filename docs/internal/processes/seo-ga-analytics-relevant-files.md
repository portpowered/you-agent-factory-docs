# SEO GA Third-Parties Relevant Files

Use these files when wiring Google Analytics 4 pageviews via
`@next/third-parties` (Wave A: pageviews only — no custom events, consent,
GTM, or JSON-LD).

## Key files

| Path | Role |
| --- | --- |
| `src/lib/analytics/ga-measurement-id.ts` | `resolveGaMeasurementId` — env override + hardcoded fallback `G-80P18Q3LWQ` |
| `src/lib/analytics/ga-measurement-id.test.ts` | Env-set, unset/fallback, whitespace fallback, explicit empty-omit proofs |
| `src/app/root-layout.shared.tsx` | Shared `RootDocument` — single `<GoogleAnalytics gaId={…} />` mount when ID is non-empty |
| `.github/workflows/deploy-pages.yml` | `make build` env bakes `NEXT_PUBLIC_GA_MEASUREMENT_ID: G-80P18Q3LWQ` alongside `GITHUB_PAGES_BASE_PATH` |
| `src/lib/build/deploy-pages-workflow-contract.test.ts` | Asserts deploy-pages build env includes base path + GA Measurement ID |

## RootDocument mount

- Call `resolveGaMeasurementId()` once in `RootDocument`.
- Render `<GoogleAnalytics gaId={gaId} />` from `@next/third-parties/google`
  only when `gaId` is non-empty (sibling of `{children}` inside `<body>`).
- Exact empty-omit (`""`) skips the component entirely.
- Do not add raw `<script>` gtag HTML alongside the third-parties component.
- Layouts that already wrap with `RootDocument` — `(site)`, `[locale]`,
  `docs`, `(dev)` — inherit the tag without per-layout mounts.

## ID resolution contract

1. Non-empty trimmed `NEXT_PUBLIC_GA_MEASUREMENT_ID` → that value.
2. Exact empty string `""` → `""` (explicit omit; callers skip the GA mount).
3. Unset or whitespace-only → hardcoded fallback `G-80P18Q3LWQ`.
4. Resolver never throws; unset env must not hard-fail local/dev builds.
5. Pass an injectable `BuildModeEnv` (default `process.env`) so unit tests do
   not mutate global env.

## Deploy-pages bake

- `.github/workflows/deploy-pages.yml` `Build static export` step sets
  `NEXT_PUBLIC_GA_MEASUREMENT_ID: G-80P18Q3LWQ` next to
  `GITHUB_PAGES_BASE_PATH`.
- Code fallback still applies if that env line is ever removed.
- Contract proof:
  `src/lib/build/deploy-pages-workflow-contract.test.ts`.

## Fence

Do not mix this lane with page-formatting / homepage-2 / graph-pages chrome.
Do not add raw duplicate `gtag` HTML alongside `@next/third-parties`.
