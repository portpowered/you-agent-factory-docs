# Homepage value story foundation — relevant files

## Shell integration

- `src/components/landing/landing-shell.tsx` composes the full first-visit story inside `SharedShell` (`surface="home"`) with localized header config from `createSharedShellConfigFromMessages`.
- Homepage sections render inside `.landing-shell__sections` within `shared-shell__main`; stacked layout styles live in `src/app/globals.css`.

## Hero and shared copy

- Hero product positioning uses `PROJECT_TAGLINE` from `src/lib/project.ts` as the visible `h1`, with `PROJECT_NAME` as an eyebrow label and `landing.valueStatement` from `src/localization/messages/en.ts` as the short explanation.
- Primary homepage CTA labels come from localized `common.getStarted` and `common.githubCta`; destinations use `DOCS_ENTRY_ROUTE` and `GITHUB_REPO_URL` from `src/lib/shared-shell-config.ts`.
- The hero section uses `aria-labelledby` / `aria-describedby` wiring so screen readers get a named region plus summary text.

## First-visit section content

- Structured section copy lives in `src/lib/landing-content.ts` (`LANDING_PROBLEM_*`, `LANDING_SOLUTION_*`, `LANDING_EXAMPLE_WORKFLOWS_*`, `LANDING_HOW_IT_WORKS_*`, `LANDING_WHY_*`, `LANDING_FINAL_CTA_*`).
- `src/lib/shell.ts` re-exports shared-shell config plus landing-content constants for legacy imports and tests.
- Architecture order on the homepage: hero → problem → solution → example workflows → how it works → why You Agent Factory → final CTA.

## Verification

- Component behavior for the hero and value-story sections lives in `tests/unit/homepage-shell.test.tsx` via `renderWithLocalization`; scope CTA queries to the hero or final CTA region when labels repeat in header, hero, and final CTA.
- Shell accessibility snapshots scope the hero GitHub CTA through the hero region named by `PROJECT_TAGLINE` in `tests/helpers/shell-accessibility.ts`.
- Served static-export navigation checks remain in `tests/unit/static-export.test.ts`, including exported homepage section titles and primary CTA destinations.
- Manual browser verification follows `docs/internal/processes/manual-qa.md` after `make build`.
