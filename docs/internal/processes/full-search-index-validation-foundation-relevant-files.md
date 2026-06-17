# Full search-index validation foundation — relevant files

## Command surface

- `package.json` exposes `bun run validate:search-index` as the dedicated generated-search-data validation path.
- `Makefile` exposes `make validate-search-index` as the maintainer-facing wrapper that follows the repository's existing Make-driven command surface.
- `scripts/validate-search-index.ts` is intentionally thin: it resolves optional test fixtures, runs the validator, and prints one success line on pass.
- `src/lib/quality-gate/steps.ts` reuses the same dedicated script in the broader `make quality-gate` path, so later gate expansion consumes the existing seam instead of redefining the contract.

## Validation contract

- `src/lib/validation/search-index.ts` owns the contract check for the checked-in public search artifact.
- `validateSearchIndex()` generates a fresh `PublicSearchArtifact` from normalized localized search documents, reads `public/search/public-search-index.json`, and classifies deterministic alignment failures explicitly as missing entries, stale entries, unstable ordering, normalized contract field mismatches, or final stable-serialization drift.
- Parse checked-in artifact sources through `parsePublicSearchArtifact()` so malformed-but-JSON-valid files fail as explicit search-contract errors instead of falling through to generic formatting noise.
- The validator also checks exclusion rules against canonical starter-content metadata, so `draft`, `internal`, `hidden`, or `search.include: false` entries are rejected even if a search-generation bug would otherwise emit matching generated output.
- Missing or drifted checked-in artifacts fail with maintainer guidance that points back to `bun run generate:search-index`.
- Keep search-index validation focused on generated-search-data contract proof. Do not widen this lane into UI checks, deploy automation, or general quality-gate policy.

## Checked-in artifact

- `public/search/public-search-index.json` is the reviewer-visible generated contract artifact for public search data.
- Regenerate it through `bun run generate:search-index`; validation should consume the checked-in file, not silently rewrite it.

## Tests

- `tests/unit/search-index-validation.test.ts` covers the pure validator success path plus missing-artifact, missing-entry, stale-entry, ordering-drift, normalized-field-mismatch, and exclusion-regression failures.
- `tests/unit/search-index-command-surface.test.ts` proves the Bun and Make command surfaces for the dedicated validation lane.
- `tests/unit/search-index-validation.test.ts` also carries focused exclusion fixtures across docs, blog, glossary, comparison, and reference content so reviewers can verify the supported seam without involving the UI.
- `tests/unit/search-index-validation-failing-path.test.ts` proves the script exits non-zero for representative artifact drift, malformed checked-in artifact structure, normalized contract mismatch, and excluded-entry regressions.
- `tests/unit/quality-gate.test.ts` and `tests/unit/quality-gate-validation-failing-path.test.ts` prove broader quality-gate reuse stays distinguishable from unrelated validation failures.
