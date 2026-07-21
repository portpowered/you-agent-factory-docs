/**
 * Typed empty and fixture content for landing-page section slots.
 *
 * Shapes mirror homepage-2 contracts (slides, footer columns/meta, FAQ items)
 * enough for placeholders and later slot fill. No CMS or schema system.
 */

import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";

export type LandingNavItem = {
  id: string;
  label: string;
  href: string;
};

export type LandingCapabilityItem = {
  id: string;
  label: string;
};

/** Slide object for FactoryCarousel (contracts / workstreams). */
export type FactorySlideData = {
  id: string;
  title: string;
  blurb: string;
  command: string;
  art?: string;
};

export type LandingFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type LandingFeatureBubble = {
  id: string;
  label: string;
};

export type LandingCtaContent = {
  headline: string;
  supporting: string;
  installCommand: string;
};

export type FooterColumnLink = {
  label: string;
  href: string;
};

export type FooterColumn = {
  title: string;
  links: FooterColumnLink[];
};

export type FooterMeta = {
  copyright: string;
  tagline?: string;
};

export type LandingHeaderData = {
  brand: string;
  nav: LandingNavItem[];
};

export type LandingHeroData = {
  title: string;
  subtitle: string;
  portraitSrc?: string;
};

export type LandingCapabilityData = {
  items: LandingCapabilityItem[];
};

export type LandingCarouselData = {
  slides: FactorySlideData[];
};

export type LandingYouiData = {
  title: string;
  imageSrc?: string;
};

export type LandingFaqData = {
  items: LandingFaqItem[];
};

export type LandingWhaleBubblesData = {
  whaleSrc?: string;
  bubbles: LandingFeatureBubble[];
};

export type LandingFooterData = {
  columns: FooterColumn[];
  meta: FooterMeta;
  artSrc?: string;
};

export type LandingPageData = {
  header: LandingHeaderData;
  hero: LandingHeroData;
  capability: LandingCapabilityData;
  carousel: LandingCarouselData;
  youi: LandingYouiData;
  faq: LandingFaqData;
  whaleBubbles: LandingWhaleBubblesData;
  cta: LandingCtaContent;
  footer: LandingFooterData;
};

export const emptyLandingPageData: LandingPageData = {
  header: {
    brand: "",
    nav: [],
  },
  hero: {
    title: "",
    subtitle: "",
  },
  capability: {
    items: [],
  },
  carousel: {
    slides: [],
  },
  youi: {
    title: "",
  },
  faq: {
    items: [],
  },
  whaleBubbles: {
    bubbles: [],
  },
  cta: {
    headline: "",
    supporting: "",
    installCommand: "",
  },
  footer: {
    columns: [],
    meta: {
      copyright: "",
    },
  },
};

export const fixtureLandingPageData: LandingPageData = {
  header: {
    brand: "you-agent-factory",
    nav: [
      { id: "docs", label: "Docs", href: "/docs" },
      { id: "guides", label: "Guides", href: "/guides" },
      { id: "blog", label: "Blog", href: "/blog" },
    ],
  },
  hero: {
    title: "Agent factory workflows that stay persistent",
    subtitle:
      "Install the CLI, run named workflows, keep long-running work alive.",
    portraitSrc: landingHomeAssets.womanHead,
  },
  capability: {
    items: [
      { id: "flows", label: "FLOWS" },
      { id: "agents", label: "AGENTS" },
      { id: "entry", label: "ENTRY" },
      { id: "os", label: "OS" },
    ],
  },
  carousel: {
    slides: [
      {
        id: "slide-install",
        title: "Install",
        blurb: "Add the factory CLI and run your first named workflow.",
        command: "you run --named @goal/example",
      },
      {
        id: "slide-loop",
        title: "Loop",
        blurb: "Keep write-review loops persistent across sessions.",
        command: "you run --named @loop/write-review",
      },
      {
        id: "slide-worktree",
        title: "Worktree",
        blurb: "Isolate agent work in durable git worktrees.",
        command: "you run --named @goal/worktree",
      },
      {
        id: "slide-harness",
        title: "Harness",
        blurb: "Prove features alone before the skeleton absorbs them.",
        command: "you docs agents",
      },
    ],
  },
  youi: {
    title: "Youi showcase",
    imageSrc: landingHomeAssets.monkey,
  },
  faq: {
    items: [
      {
        id: "faq-what",
        question: "What is you-agent-factory?",
        answer:
          "A CLI and agent-factory workflow system that keeps long-running agent work persistent.",
      },
      {
        id: "faq-install",
        question: "How do I install it?",
        answer:
          "Follow the install guide, then run a named workflow with you run --named.",
      },
    ],
  },
  whaleBubbles: {
    whaleSrc: landingHomeAssets.midEndWhale,
    bubbles: [
      { id: "bubble-harness", label: "Harness" },
      { id: "bubble-loop", label: "Loop" },
      { id: "bubble-worktree", label: "Worktree" },
    ],
  },
  cta: {
    headline: "Start a persistent factory run",
    supporting: "Ship workflows that survive long agent sessions.",
    installCommand: "you run --named @goal/example",
  },
  footer: {
    columns: [
      {
        title: "Product",
        links: [
          { label: "Docs", href: "/docs" },
          { label: "Guides", href: "/guides" },
        ],
      },
      {
        title: "Community",
        links: [
          { label: "Blog", href: "/blog" },
          {
            label: "GitHub",
            href: "https://github.com/portpowered/you-agent-factory",
          },
        ],
      },
    ],
    meta: {
      copyright: "© you-agent-factory",
      tagline: "Persistent agent factory workflows",
    },
    artSrc: landingHomeAssets.seadragonCrop,
  },
};
