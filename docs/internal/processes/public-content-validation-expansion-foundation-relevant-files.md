# Public Content Validation Expansion Foundation Relevant Files

- `src/lib/content/load-starter-content.ts`
  - Loads the repository's real public content records and localized variant bindings from `src/content`, which is the canonical input to the validation lane.
- `src/lib/content/load-search-documents.ts`
  - Projects normalized localized search documents from the validated content graph so the validator compares artifact output against the same real search-data seam used elsewhere.
- `src/lib/content/load-search-artifact.ts`
  - Parses a generated public search artifact from disk when one is present and otherwise falls back to generating the validation artifact from the real search-document seam, so `validate:content` stays reliable on clean checkouts.
- `src/lib/content/public-content-validation.ts`
  - Pure validation contract for kind coverage, canonical-id uniqueness, route-identity collisions, localized-variant integrity, normalized search-document consistency, checked-in localized-search-artifact drift, and maintainer-facing failure messages.
- `scripts/validate-content.ts`
  - Shared content-validation CLI entrypoint that runs starter-content validation, projects one canonical record per validated content path, and compares an existing generated artifact or clean-checkout fallback artifact against the real repository content graph.
- `src/lib/validation/gate-fixtures.ts`
  - Test-only fixture seam for subprocess proof that `validate:content` fails clearly on generated-artifact drift without swapping in a synthetic content graph or depending on prebuilt local output.
- `tests/unit/public-content-validation.test.ts`
  - Reviewer-visible proof that docs, blog, glossary, comparison, and reference all participate in the same validation contract, that canonical, route-identity, localized-variant, normalized-search-document, and generated-artifact drift failures are explicit, and that the shared `validate:content` command fails clearly on real public-content regressions.
