# Homepage value story foundation — relevant files

## Hero and shared copy

- Hero product positioning uses `PROJECT_TAGLINE` from `src/lib/project.ts` as the visible `h1`, with `PROJECT_NAME` as an eyebrow label and `LANDING_VALUE_STATEMENT` from `src/lib/shell.ts` as the short explanation.
- Primary homepage CTAs and their destination intent live in `src/lib/shell.ts`: `DOCS_CTA_LABEL` enters the docs entry route; `GITHUB_CTA_LABEL` opens the public factory repository for trying the product.
- The hero section is rendered inside `src/components/landing/landing-shell.tsx` with `aria-labelledby` / `aria-describedby` wiring so screen readers get a named region plus summary text.

## Verification

- Component behavior for the hero lives in `tests/unit/homepage-shell.test.tsx`.
- Served static-export navigation checks remain in `tests/unit/static-export.test.ts`.
- Manual browser verification follows `docs/internal/processes/manual-qa.md` after `make build`.
