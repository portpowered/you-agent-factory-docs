# SEO GA Third-Parties Relevant Files

Use these files when wiring Google Analytics 4 pageviews via
`@next/third-parties` (Wave A: pageviews only — no custom events, consent,
GTM, or JSON-LD).

## Key files

| Path | Role |
| --- | --- |
| `src/lib/analytics/ga-measurement-id.ts` | `resolveGaMeasurementId` — env override + hardcoded fallback `G-80P18Q3LWQ` |
| `src/lib/analytics/ga-measurement-id.test.ts` | Env-set, unset/fallback, whitespace fallback, explicit empty-omit proofs |
| `src/app/root-layout.shared.tsx` | Shared `RootDocument` — mount `<GoogleAnalytics>` once here (story 003) |
| `.github/workflows/deploy-pages.yml` | Optional bake of `NEXT_PUBLIC_GA_MEASUREMENT_ID` on `make build` (story 004) |

## ID resolution contract

1. Non-empty trimmed `NEXT_PUBLIC_GA_MEASUREMENT_ID` → that value.
2. Exact empty string `""` → `""` (explicit omit; callers skip the GA mount).
3. Unset or whitespace-only → hardcoded fallback `G-80P18Q3LWQ`.
4. Resolver never throws; unset env must not hard-fail local/dev builds.
5. Pass an injectable `BuildModeEnv` (default `process.env`) so unit tests do
   not mutate global env.

## Fence

Do not mix this lane with page-formatting / homepage-2 / graph-pages chrome.
Do not add raw duplicate `gtag` HTML alongside `@next/third-parties`.
