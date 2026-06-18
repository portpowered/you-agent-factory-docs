# Homepage value story foundation — relevant files

## Shell integration

- `src/components/landing/landing-shell.tsx` composes the full first-visit story inside `SharedShell` (`surface="home"`) with localized header config from `createSharedShellConfigFromMessages`.
- Homepage sections render inside `.landing-shell__sections` within `shared-shell__main`; shared card and CTA presentation should flow through `src/components/ui/card.tsx` and `src/components/ui/button.tsx`, with `landing-shell__*` classes kept only as hooks for tests or narrow overrides.
- `src/components/ui/factory-theme.ts` is the shared token grammar entrypoint for homepage-facing color, spacing, layout-width, and surface-variant class contracts. Reuse it before introducing page-local `max-w`, padding, or palette utilities for landing surfaces.

## Hero and shared copy

- Hero product positioning uses `PROJECT_TAGLINE` from `src/lib/project.ts` as the visible `h1`, with `PROJECT_NAME` as an eyebrow label and `landing.valueStatement` from `src/localization/messages/en.ts` as the short explanation.
- Primary homepage CTA labels come from localized `common.getStarted` and `common.githubCta`; destinations use `DOCS_ENTRY_ROUTE` and `GITHUB_REPO_URL` from `src/lib/shared-shell-config.ts`.
- The hero section uses `aria-labelledby` / `aria-describedby` wiring so screen readers get a named region plus summary text.
- Hero and final CTA links keep the `landing-shell__button` hook for tests, but visual treatment should stay on the shared `factory-theme` token contract rather than page-local color classes.

## First-visit section content

- Structured section copy lives in `src/lib/landing-content.ts` (`LANDING_PROBLEM_*`, `LANDING_SOLUTION_*`, `LANDING_EXAMPLE_WORKFLOWS_*`, `LANDING_HOW_IT_WORKS_*`, `LANDING_WHY_*`, `LANDING_FINAL_CTA_*`).
- `src/lib/shell.ts` re-exports shared-shell config plus landing-content constants for legacy imports and tests.
- Architecture order on the homepage: hero → problem → solution → example workflows → how it works → why You Agent Factory → final CTA.

## Verification

- Component behavior for the hero and value-story sections lives in `tests/unit/homepage-shell.test.tsx` via `renderWithLocalization`; scope CTA queries to the hero or final CTA region when labels repeat in header, hero, and final CTA.
- `tests/unit/factory-theme.test.ts` verifies the token grammar itself, while `tests/unit/homepage-shell.test.tsx` proves the grammar styles both primitive CTA controls and dense workflow/value surfaces.
- Shell accessibility snapshots scope the hero GitHub CTA through the hero region named by `PROJECT_TAGLINE` in `tests/helpers/shell-accessibility.ts`.
- Served static-export navigation checks remain in `tests/unit/static-export.test.ts`, including exported homepage section titles and primary CTA destinations.
- Manual browser verification follows `docs/internal/processes/manual-qa.md` after `make build`.
