# Homepage FAQ / CTA / Chrome (W-faq-cta) — relevant files

Use these files when working on Homepage-2 **W-faq-cta** (Wave B): landing
header, bespoke FAQ panel, CTA band, footer art, and the gated faq-cta harness.
Do **not** flip production `/` here — that belongs to W-integrate. Do **not**
edit `src/features/footer/**` or create `src/features/faq/**`.

Control docs live under planner-local `docs/temp/homepage-2/` (gitignored):
`README.md`, `workstreams.md`, `contracts.md`.

## Components (this lane)

| File | Role |
| --- | --- |
| `src/features/landing-page/components/LandingHeader.tsx` | Brand + resolving nav links + optional `search` slot; semantic `<header>` / labeled `<nav>` |
| `src/features/landing-page/components/LandingHeader.test.tsx` | Fixture labels/hrefs, empty items, optional search presence |
| `src/features/landing-page/components/FaqPanel.tsx` | Bespoke parchment FAQ list + heading-wrapped disclosure buttons — not docs FAQ chrome |
| `src/features/landing-page/components/FaqPanel.test.tsx` | Fixture Q/A render, heading/button a11y names, empty items, expand/collapse |
| `src/features/landing-page/components/CtaBand.tsx` | Fogged install CTA band (`headline` / optional `supporting` + `installCommand` / `ctaLabel` + optional `ctaHref`) |
| `src/features/landing-page/components/CtaBand.test.tsx` | Fixture CTA label/href, fog markers, optional-field omission |
| `src/features/landing-page/components/LandingFooterArt.tsx` | Decorative seadragon / YOU-field art node for `SiteFooter` `art` slot (`src` / `className`; decorative `alt=""`) |
| `src/features/landing-page/components/LandingFooterArt.test.tsx` | Art root + default `/home/seadragon-crop.png`; SiteFooter art-slot wrap |
| `src/features/landing-page/index.ts` | Public barrel: re-exports LandingHeader, FaqPanel, CtaBand, LandingFooterArt + prop types (and whale-bubbles) |
| `src/features/landing-page/index.test.ts` | Barrel export smoke for W-faq-cta public APIs |
| `src/app/(dev)/faq-cta-harness/page.tsx` | Gated harness: header → faq → cta → footer art on skeleton bg |
| `src/app/(dev)/faq-cta-harness/page.test.tsx` | Gate + stack markers (nav hrefs, parchment, CTA, footer art) |

## Shared stubs (owned by W-skeleton; consume, do not reinvent schemas)

| File | Role |
| --- | --- |
| `src/features/landing-page/landing-page.data.ts` | `LandingNavItem` / `LandingFaqItem` / `LandingCtaContent` shapes + fixtures |
| `src/features/landing-page/landing-page.assets.ts` | `/home/...` asset paths for footer art when staged |
| `src/features/footer/SiteFooter.tsx` | Consumer of opaque `art?: ReactNode` — import in harness only; do not edit |

## Patterns

- Nav props are component types only (`{ label, href }[]` + optional `id`); use
  fixture paths like `/browse`, `/docs/guides`, `/blog`, `/docs/references`.
- Optional search is a **slot** (`search?: ReactNode`). Omit the prop entirely
  when unused — do not reserve an empty broken search control.
- Use real `<a>` anchors (or `Link`) with visible `focus-visible:ring-*` styles;
  landmarks: `<header>` + `<nav aria-label="…">`.
- Any enter motion stays inside each component — no shared `SectionReveal`.
- Fence vs docs FAQ (#190 / PF-D2): landing `FaqPanel` only; no `features/faq`.
- FAQ props reuse `{ id, question, answer }[]` (same shape as `LandingFaqItem`);
  parchment is local CSS (gradient + vignette + warm border) — no shared FAQ
  chrome package.
- Question pattern: `<h3><button aria-expanded aria-controls>` with
  `focus-visible:ring-2`; answer lives in a sibling `<section hidden>`.
- CtaBand fog: default `fogSrc` is `landingHomeAssets.ctaFog` (`/home/cta-fog.png`)
  plus local mist/haze overlays; primary CTA is `<a>` when `ctaHref` is set,
  otherwise `<button>`; optional `supporting` / `installCommand` omit cleanly.
- Fog drift uses `motion-safe:animate-pulse` + `motion-reduce:animate-none` so
  reduced-motion keeps a static readable band.
- LandingFooterArt: default `src` is `landingHomeAssets.seadragonCrop`
  (`/home/seadragon-crop.png`) plus a local YOU-field wash; pure decoration uses
  `alt=""`; pass as opaque `art={<LandingFooterArt />}` — do not edit footer.
- Harness gating matches other `(dev)` routes: `notFound()` when
  `NODE_ENV === "production"` unless `ENABLE_COMPONENT_EXAMPLES === "1"`.
- Worktree browser verify: use `bun ./scripts/run-next.ts dev --webpack -p <port>`
  (Turbopack often fails when `node_modules` is parent-hoisted). Kill the server
  before exiting.
- Do not implement carousel, hero portrait/capability/youi, whale/sphere, or
  production `/` flip in this lane.
