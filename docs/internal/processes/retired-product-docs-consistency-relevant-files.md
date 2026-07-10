# Retired Product Docs Consistency Relevant Files

Use this reference when changing the architecture/authoring product-framing
surface or the maintainer check that guards it.

## Purpose

`bun run check:retired-product-docs` fails when owned architecture/authoring
docs present retired product identity or retired public route families as the
live product. Explicit retirement / “what this is not” / denylist wording is
allowed. Genuine factory text about model providers or external-model support
is out of scope for the denylist (those phrases do not match the retired
product names).

## Owned scan surface

| Path | Role |
| --- | --- |
| `docs/site-fundamentals.md` | Product frame |
| `docs/data-model.md` | Content contract |
| `docs/architecture.md` | System architecture |
| `docs/documentation-template.md` | Template inventory |
| `docs/guide-to-writing-pages.md` | Authoring workflow |
| `docs/contributors/CONTRIBUTING.md` | Contributor validation paths |
| `docs/architectural-checklist.md` | Package/structure contracts |
| `factory/docs/standards/docs-writing-standards.md` | Writing standards audience/scope |

Do not expand the default scan to the full historical `docs/internal/` archive
unless a later story explicitly owns that surface.

## Implementation

| Path | Role |
| --- | --- |
| `src/lib/governance/retired-product-docs-consistency.ts` | Pure scan + format helpers |
| `src/lib/governance/retired-product-docs-consistency.test.ts` | Fixture proofs (bad identity, bad routes, allowed exclusion) |
| `scripts/check-retired-product-docs-consistency.ts` | CLI entrypoint |
| `package.json` → `check:retired-product-docs` | Maintainer script |

## Denylist contract

- Product names: `Model Reference`, `Model Atlas`, `Learn Language Models`
- Public route families: `/docs/models`, `/docs/modules`, `/docs/papers`,
  `/docs/training` (plus demoted `PAGE=docs/modules/...` teaching forms)
- Allow when nearby context uses exclusion/demotion wording (`not`, `retired`,
  `Atlas-era`, `do not`, `not required`, and similar)

## Contributor docs

- `docs/contributors/CONTRIBUTING.md` — fast-loop command table + when to run
- `docs/architecture.md` — CI / contributor verification list
