# Retired AI Content Infrastructure Denylist — Relevant Files

Use this reference when changing the maintainer denylist that blocks
reintroduction of deleted Model Atlas content infrastructure.

## Purpose

`bun run audit:retired-ai-content-infrastructure` fails when retired Atlas
public route families, page/registry kinds, collection/section ids, or owned
deleted file paths reappear as live product surfaces.

Explicit exceptions allow genuine factory provider / external-model
configuration wording (for example `--default-worker-model-provider`,
`external model providers`, `supported model providers`) without treating those
phrases as Atlas content infrastructure.

This audit is distinct from `bun run check:retired-product-docs`, which scans
owned architecture/authoring docs for product-identity framing. The denylist
owns infrastructure reintroduction (paths, live kind/section inventories, and
route/kind product teaching fixtures).

## Implementation

| Path | Role |
| --- | --- |
| `src/lib/governance/retired-ai-content-infrastructure-denylist.ts` | Pure audit helpers + live collector |
| `src/lib/governance/retired-ai-content-infrastructure-denylist.test.ts` | Fixture proofs (owned-path / kind / route reintroduction fail; `__generate-fixtures__` reintroduction fails closed; factory provider exception passes; live tree passes) |
| `scripts/audit-retired-ai-content-infrastructure.ts` | CLI entrypoint |
| `package.json` → `audit:retired-ai-content-infrastructure` | Maintainer script |

## Denylist contract

- Public route families: `/docs/models`, `/docs/modules`, `/docs/papers`,
  `/docs/training`, `/docs/systems`
- Page/registry kinds: `model`, `module`, `paper`, `training-regime`, `system`
- Collection/section ids: `models`, `modules`, `papers`, `training`,
  `training-regimes`, `systems`
- Owned deleted paths: `src/features/ai`, AI sidebar adapter, Atlas
  loaders/renderers/helpers, empty Atlas content/registry trees, Atlas
  templates, `__generate-fixtures__`, topology browse stack, retired section
  index route modules under `src/app/(site)/docs/` and `src/app/[locale]/docs/`

## Allow

- Factory provider / external-model configuration and documentation wording
- Explicit retirement / denylist / “what this is not” exclusion context
- Non-product uses such as `citationType: "paper"` (not a page/registry kind
  inventory member)

## Verification

```sh
bun test src/lib/governance/retired-ai-content-infrastructure-denylist.test.ts
bun run audit:retired-ai-content-infrastructure
# or: bun ./scripts/audit-retired-ai-content-infrastructure.ts
```

Confirm denylisted owned paths stay absent on disk (including
`src/lib/content/__generate-fixtures__`). Existence of any path in
`RETIRED_AI_CONTENT_OWNED_PATHS` fails the audit as a reintroduction.
`src/lib/content/__fixtures__/` is a separate live test-fixture directory and
is not on the denylist.

For the B09 public-copy convergence gate, also keep
`bun run check:retired-product-docs` green alongside the denylist audit so
factory provider/model configuration docs remain allowed while Atlas ownership
copy stays retired (see `search-domain-relevant-files.md` B09 gate pattern).


## End-to-end proof (story 007)

After infrastructure deletion, prove the cleaned tree stays factory-only:

```sh
bun run audit:retired-ai-content-infrastructure
bun run validate-data
bun test \
  src/lib/content/cli-page-templates.test.ts \
  src/lib/content/page-template-convergence.test.tsx \
  src/lib/content/validate-generated-canonical-docs.test.ts \
  src/lib/governance/retired-ai-content-infrastructure-denylist.test.ts
bun run generate:page-bundle -- --spec page-specs/page-spec-workflow-sample.json --dry-run
bun run typecheck
bun run lint
bun run test
```

- Deleted owned paths must not exist on disk (denylist).
- No runtime/test import should resolve deleted AI surfaces; `typecheck` fails
  if a deleted module is still imported.
- Focused generation proofs use factory templates under `docs/templates/` and
  factory page-specs under `page-specs/` (concept + glossary only). Do not
  restore Atlas model/module/paper/training-regime samples.
