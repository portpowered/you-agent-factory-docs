# Full search-index validation foundation — relevant files

## Command surface

- `package.json` exposes `bun run validate:search-index` as the dedicated generated-search-data validation path.
- `Makefile` exposes `make validate-search-index` as the maintainer-facing wrapper that follows the repository's existing Make-driven command surface.
- `scripts/validate-search-index.ts` is intentionally thin: it resolves optional test fixtures, runs the validator, and prints one success line on pass.

## Validation contract

- `src/lib/validation/search-index.ts` owns the contract check for the checked-in public search artifact.
- `validateSearchIndex()` generates a fresh `PublicSearchArtifact` from normalized localized search documents, reads `public/search/public-search-index.json`, and compares the stable serialized outputs directly.
- The validator also checks exclusion rules against canonical starter-content metadata, so `draft`, `internal`, `hidden`, or `search.include: false` entries are rejected even if a search-generation bug would otherwise emit matching generated output.
- Missing or drifted checked-in artifacts fail with maintainer guidance that points back to `bun run generate:search-index`.
- Keep search-index validation focused on generated-search-data contract proof. Do not widen this lane into UI checks, deploy automation, or general quality-gate policy.

## Checked-in artifact

- `public/search/public-search-index.json` is the reviewer-visible generated contract artifact for public search data.
- Regenerate it through `bun run generate:search-index`; validation should consume the checked-in file, not silently rewrite it.

## Tests

- `tests/unit/search-index-validation.test.ts` covers the pure validator success, missing-artifact failure, and drift failure cases.
- `tests/unit/search-index-command-surface.test.ts` proves the Bun and Make command surfaces for the dedicated validation lane.
- `tests/unit/search-index-validation.test.ts` also carries focused exclusion fixtures across docs, blog, glossary, comparison, and reference content so reviewers can verify the supported seam without involving the UI.
- `tests/unit/search-index-validation-failing-path.test.ts` proves the script exits non-zero for both checked-in artifact drift and excluded-entry regressions.
