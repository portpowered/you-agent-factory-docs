# Rewrite home page — relevant files

Use these files when rewriting the you-agent-factory home article identity,
install/run CTAs, why/features sections, featured links, or locale shell copy.

## Identity copy (title / subtitle / intro)

| File | Role |
| --- | --- |
| `src/content/messages/en/common.json` (`home.title` / `home.subtitle` / `home.intro`) | Default-locale product identity rendered by `HomeBrushHeader` and used as page metadata description |
| `src/content/messages/{ja,zh-CN,vi}/common.json` | Localized home shell strings (stubs OK until localization story) |
| `src/components/home/home-article.tsx` | Renders `home.title` / `home.subtitle` via `HomeBrushHeader`; does not currently render `home.intro` in the article body |
| `src/app/(site)/page.tsx` / `src/app/[locale]/page.tsx` | `generateMetadata` binds `title` ← `messages.home.title`, `description` ← `messages.home.intro` |
| `src/app/root-layout.shared.tsx` (`siteMetadata`) | Layout-level fallback metadata; keep aligned with you-agent-factory identity (not Model Atlas) |
| `src/tests/content/home-page.test.tsx` | Asserts default-locale identity and rendered header copy |

## Install CTA

| File | Role |
| --- | --- |
| `src/content/messages/*/common.json` (`home.install*`) | Section title, OS labels, and copyable install commands for all locales |
| `src/components/home/home-command-block.tsx` | Always-visible `<pre><code>` command block (no hover-only reveal) |
| `src/components/home/home-article.tsx` (`#install`) | Install section before run/browse; uses `HomeCommandBlock` for both OS paths |
| `src/lib/navigation/home-page-toc.ts` | TOC includes `#install`, then later sections, then `#browse` |
| `src/lib/content/ui-messages.types.ts` (`HomeMessages`) | Typed keys for install section + TOC label |

Canonical install commands (product repo releases):

- macOS/Linux: `curl -fsSL https://github.com/portpowered/you-agent-factory/releases/latest/download/install.sh | sh`
- Windows: `irm https://github.com/portpowered/you-agent-factory/releases/latest/download/install.ps1 | iex`

## First-run CTA

| File | Role |
| --- | --- |
| `src/content/messages/*/common.json` (`home.run*`) | Section title, label, and `you run --named @goal/...` command |
| `src/components/home/home-article.tsx` (`#run`) | First-run section after install; uses `HomeCommandBlock` |
| `src/lib/navigation/home-page-toc.ts` | TOC includes `#run` between `#install` and `#browse` |
| `src/lib/content/ui-messages.types.ts` (`HomeMessages`) | Typed keys for run section + `onThisPageRun` |

Canonical first-run example:

- `you run --named @goal/blah`

## Why and features

| File | Role |
| --- | --- |
| `src/content/messages/*/common.json` (`home.why*`, `home.feature*`, `home.features*`) | Why body + feature list copy for all locales |
| `src/components/home/home-article.tsx` (`#why`, `#features`) | Why prose + bulletless feature list in normal article flow |
| `src/lib/navigation/home-page-toc.ts` | TOC order: `#install` → `#run` → `#why` → `#features` → `#browse` |
| `src/lib/content/ui-messages.types.ts` (`HomeMessages`) | Typed keys for why/features + `onThisPageWhy` / `onThisPageFeatures` |

Required meaning (wording may vary):

- Why: communicate running hundreds of agents at once
- Features: harness support plus loop, review, planner, crons, and event streams

## Patterns

- Product identity on `/` is message-driven (`messages.home.*`), not `siteConfig.brand`.
  Nav brand still comes from `youAgentFactorySiteConfig.brand.brandName`.
- When changing default-locale home identity, update **both** `en/common.json` home
  keys and `siteMetadata` in `root-layout.shared.tsx`, plus home/metadata tests.
- When adding home message keys, update `HomeMessages` and all four locale
  `common.json` files together so loaders do not fail (non-en may stub labels).
- Install/run command strings live in messages (not hard-coded in the component)
  so locales can stub labels while keeping the same runnable commands.
- Why/features stay single-column article sections with stable `#why` / `#features`
  anchors; use `bulletlessListClassName` for the feature list (no `list-disc`).
- Legacy Atlas featured-link message keys (`atlasLinkTitle`, `gqaLinkTitle`, …) may
  remain in message files until a later story removes them; they must not appear as
  rendered product copy when `homeFeaturedLinks` is empty or CLI-shaped.
- Worktree browser verify: this lane often has no local `node_modules` (hoisted at
  repo root). Turbopack rejects out-of-root `node_modules` symlinks. Prefer
  `renderToStaticMarkup(HomeArticle)` + `generateMetadata()` for identity checks
  when `bun run dev` cannot start in the worktree.
