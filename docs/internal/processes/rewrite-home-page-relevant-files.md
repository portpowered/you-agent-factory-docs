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

## Patterns

- Product identity on `/` is message-driven (`messages.home.*`), not `siteConfig.brand`.
  Nav brand still comes from `youAgentFactorySiteConfig.brand.brandName`.
- When changing default-locale home identity, update **both** `en/common.json` home
  keys and `siteMetadata` in `root-layout.shared.tsx`, plus home/metadata tests.
- Legacy Atlas featured-link message keys (`atlasLinkTitle`, `gqaLinkTitle`, …) may
  remain in message files until a later story removes them; they must not appear as
  rendered product copy when `homeFeaturedLinks` is empty or CLI-shaped.
- Worktree browser verify: this lane often has no local `node_modules` (hoisted at
  repo root). Turbopack rejects out-of-root `node_modules` symlinks. Prefer
  `renderToStaticMarkup(HomeArticle)` + `generateMetadata()` for identity checks
  when `bun run dev` cannot start in the worktree.
