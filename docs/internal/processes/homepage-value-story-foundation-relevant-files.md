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
- Architecture order on the homepage: hero → problem → solution → example workflows → how it works → why You Agent Factory → final CTA.
- Each workflow and differentiator renders as a grouped list item with an `h3` title and description inside `landing-shell.tsx`.
- Card-style grouping uses `.landing-shell__workflow-list` / `.landing-shell__why-list` in `src/app/globals.css`.

## Final CTA section

- Final CTA copy lives in `src/lib/shell.ts`: `LANDING_FINAL_CTA_TITLE` and `LANDING_FINAL_CTA_SUMMARY`.
- `src/components/landing/landing-shell.tsx` renders the final CTA as the last `main` section with the same primary CTA labels and destinations as the hero (`DOCS_CTA_LABEL`, `GITHUB_CTA_LABEL`).
- Styling uses `.landing-shell__final-cta` and `.landing-shell__final-cta-summary` in `src/app/globals.css`.

## Verification

- Component behavior for the hero and value-story sections lives in `tests/unit/homepage-shell.test.tsx`, including final CTA semantics and the complete first-visit section order proof.
- Served static-export navigation checks remain in `tests/unit/static-export.test.ts`, including exported homepage section titles and primary CTA destinations.
- Manual browser verification follows `docs/internal/processes/manual-qa.md` after `make build`.
