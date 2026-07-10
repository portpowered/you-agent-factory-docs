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

## End-to-end proof for architecture/authoring rewrites

When proving a factory product-architecture docs rewrite lane, run this sequence
on the lane checkout (not Atlas Phase-1 verifier sprawl):

```sh
bun run check:retired-product-docs
make linkcheck
make typecheck
make lint
make test
```

Browser-verify published factory routes when a local `node_modules` is available
(pick a free port; kill the server when done):

```sh
PORT=3458
bun run dev -- -p "$PORT" &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
# wait until ready, then:
curl --fail --silent --show-error --max-time 10 \
  "http://127.0.0.1:$PORT/docs/guides/getting-started"
curl --fail --silent --show-error --max-time 10 \
  "http://127.0.0.1:$PORT/docs/documentation/harness-support"
curl --fail --silent --show-error --max-time 10 \
  "http://127.0.0.1:$PORT/docs/documentation/cli"
```

Worktree note: factory lanes often hoist `node_modules` at the repo root.
Turbopack then rejects out-of-root resolution even with `turbopack.root` set.
In that case, treat `make linkcheck` plus the published-page route tests under
`src/content/docs/**` as the local route proof, and keep contributor docs
pointing at factory routes (`/docs/guides/getting-started`,
`/docs/documentation/harness-support`) rather than Atlas Phase-1 verifier
sprawl.

Owned docs should already describe primary collections as
`guides` / `concepts` / `techniques` / `documentation` / `glossary`, with blog
and search as separate surfaces, messages/assets/registry as content layers, and
tables/graphs as optional teaching tools.
