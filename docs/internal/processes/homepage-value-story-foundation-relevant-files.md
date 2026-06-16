# Homepage value story foundation — relevant files

## Hero and shared copy

- Hero product positioning uses `PROJECT_TAGLINE` from `src/lib/project.ts` as the visible `h1`, with `PROJECT_NAME` as an eyebrow label and `LANDING_VALUE_STATEMENT` from `src/lib/shell.ts` as the short explanation.
- Primary homepage CTAs and their destination intent live in `src/lib/shell.ts`: `DOCS_CTA_LABEL` enters the docs entry route; `GITHUB_CTA_LABEL` opens the public factory repository for trying the product.
- The hero section is rendered inside `src/components/landing/landing-shell.tsx` with `aria-labelledby` / `aria-describedby` wiring so screen readers get a named region plus summary text.

## Problem, solution, and how-it-works sections

- Section copy lives in `src/lib/shell.ts`: `LANDING_PROBLEM_*`, `LANDING_SOLUTION_*`, and `LANDING_HOW_IT_WORKS_*` constants.
- `src/components/landing/landing-shell.tsx` renders each block as a `section` with `aria-labelledby` and an `h2` title; how-it-works steps use an ordered list with `h3` step titles.
- Shared section styling is in `src/app/globals.css` under `.landing-shell__section`, `.landing-shell__list`, and `.landing-shell__steps`.

## Example workflows and differentiation sections

- Workflow examples and why-You-Agent-Factory copy live in `src/lib/shell.ts`: `LANDING_EXAMPLE_WORKFLOWS_*` and `LANDING_WHY_*` constants.
- Architecture order on the homepage: hero → problem → solution → example workflows → how it works → why You Agent Factory (final CTA is story 004).
- Each workflow and differentiator renders as a grouped list item with an `h3` title and description inside `landing-shell.tsx`.
- Card-style grouping uses `.landing-shell__workflow-list` / `.landing-shell__why-list` in `src/app/globals.css`.

## Verification

- Component behavior for the hero and value-story sections lives in `tests/unit/homepage-shell.test.tsx`.
- Served static-export navigation checks remain in `tests/unit/static-export.test.ts`.
- Manual browser verification follows `docs/internal/processes/manual-qa.md` after `make build`.
