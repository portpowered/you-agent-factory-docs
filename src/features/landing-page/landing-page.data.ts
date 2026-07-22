/**
 * Typed empty and fixture content for landing-page section slots.
 *
 * Shapes mirror homepage-2 contracts (slides, footer columns/meta, FAQ items)
 * enough for placeholders and later slot fill. No CMS or schema system.
 */

import type { FactorySlideData } from "@/features/landing-page/components/FactorySlide";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";

export type { FactorySlideData };

export type LandingNavItem = {
  id: string;
  label: string;
  href: string;
};

export type LandingCapabilityItem = {
  id: string;
  label: string;
};

export type LandingFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type LandingFeatureBubble = {
  id: string;
  label: string;
  description?: string;
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
  author?: string;
  license?: string;
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
    brand: "YOU",
    nav: [
      { id: "home", label: "Home", href: "/" },
      { id: "docs", label: "Docs", href: "/docs" },
      { id: "blog", label: "Blog", href: "/blog" },
    ],
  },
  hero: {
    title: "YOU AGENT\nFACTORY CLI",
    subtitle:
      "You use YOU as an AI agent factory CLI that wraps AI agent harnesses and combines them with programmatic workflows so you can run hundreds of agents at once.\n\nYou can use your favorite AI harnesses across Codex, Claude, Cursor, and 5+ others on YOU immediately.\n\nYou can get started straight out the box with YOU’s prebuilt workflows.\nYou can save money, get more throughput, better output, or faster throughput, based on the flows you want to use.\nYou can use YOU’s patterns like “pick-best-model”, “loop”, “adversarial-review”, “planner-executor”, and 7+ more!\n\nYou can fit YOU’s system into your flow if the prepackaged flows aren’t enough.\nYOU’s graph based system has 15+ different nodes with complex flow logic as well as javascript based flows.\n\nYou can trust YOU to run, as it has been tested to over 10000+ Commits, with operational metrics, logs, traces, to boot.",
    portraitSrc: landingHomeAssets.womanHead,
  },
  capability: {
    items: [
      { id: "you", label: "YOU" },
      { id: "cli", label: "CLI" },
      { id: "protocols", label: "MCP API SSE" },
      { id: "flows", label: "FLOWS : JS | GRAPH" },
      { id: "agents", label: "AGENTS : CODEX | CLAUDE | 10+" },
      { id: "entry", label: "ENTRY : CLI | API | MCP | UI" },
      { id: "os", label: "OS : MAC | LINUX | WINDOWS" },
    ],
  },
  carousel: {
    slides: [
      {
        id: "slide-ralph",
        title: "ralph",
        blurb:
          "have one agent write a plan, then let another execute and review it",
        command: 'you run -a "ralph" --to "ship the planned change"',
      },
      {
        id: "slide-loop",
        title: "LOOP",
        blurb: "run an agent every 1 hour to do something",
        command:
          'you run -a @u/loop --every "1h" --to "check the website, fix bugs"',
      },
      {
        id: "slide-review",
        title: "review",
        blurb: "have one agent write while another reviews",
        command: 'you run -a "review" --to "write and verify the change"',
      },
      {
        id: "slide-goal",
        title: "goal",
        blurb: "Run agent until\nit completes\nits goal",
        command: 'you run -a "goal" --to "finish the requested outcome"',
      },
      {
        id: "slide-custom",
        title: "custom",
        blurb:
          "write your own\nagent workflow\nor have your\nagent write\none for you",
        command: 'you run -a "custom" --to "run my factory.yaml"',
      },
      {
        id: "slide-deep-research",
        title: "deep-research",
        blurb:
          "spawn many agents, compare their findings, and merge the strongest result",
        command: 'you run -a "deep-research" --to "research the best approach"',
      },
      {
        id: "slide-one-shot",
        title: "one-shot",
        blurb:
          "create a worktree, write a plan, iterate through it, review, and merge",
        command: 'you run -a "one-shot" --to "implement and merge the feature"',
      },
      {
        id: "slide-classify",
        title: "classify",
        blurb:
          "use a small model to choose the cheapest capable model, then run it",
        command: 'you run -a "classify" --to "route this task efficiently"',
      },
    ],
  },
  youi: {
    title: "YOUI",
    imageSrc: landingHomeAssets.monkey,
  },
  faq: {
    items: [
      {
        id: "faq-learn",
        question: "How much do I have to learn to use YOU?",
        answer:
          "Nothing.\n\nJust do `you run --a ‘@u/subagent’ --to ‘do your basic small dispatch’ --on ‘claude’`\n\nYou can use prepackaged factories and run them.\n\nIf you want to build your own, point your agents to the `you docs` command and it should be able to write your own custom one for you.\n\nIf you want to write one yourself, please see the YOU docs for reference.",
      },
      {
        id: "faq-support",
        question: "Does YOU support my usecase|agent harness|bespoke problem?",
        answer:
          "Maybe!\n\nThe supported harness index is located [here]().\nWe have a list of random features that we support here. If you can’t find it.\nPlease feel free to file a ticket or ping me at dre@youagentfactory.com",
      },
      {
        id: "faq-why",
        question: "Why should I use YOU vs (X)?",
        answer:
          "YOU fits into any flow you want.\n\nYou can use YOU in tandem with X.\nIf you want to augment your current flows with adversarial review or just basic goal loops you can do so with small CLI usage.\n\nIf you want to use YOU to fully run a package, you can do so as well via the complex you agent factory command",
      },
      {
        id: "faq-where",
        question: "Where does YOU run?",
        answer:
          "YOU runs everywhere.\n\nYOU is a single binary that runs on laptop, on-prem, container, or hybrid. The inputs to you are its internal event stream, your flows.",
      },
      {
        id: "faq-cloud",
        question: "Does YOU phone in to the cloud?",
        answer:
          "No.\n\nThere is nothing that is recorded off your device at this time.",
      },
    ],
  },
  whaleBubbles: {
    whaleSrc: landingHomeAssets.midEndWhale,
    bubbles: [
      {
        id: "bubble-workflow",
        label: "Dynamic Workflow",
        description:
          "Compose branching, review, planning, and execution flows that can adapt while a factory is running.",
      },
      {
        id: "bubble-parallel",
        label: "Run many factory at same time",
        description:
          "Dispatch independent factories together while each run keeps its own durable state and history.",
      },
      {
        id: "bubble-event-logs",
        label: "JSONL based event logs",
        description:
          "Every meaningful event is written as portable JSONL so runs can be inspected, replayed, and resumed.",
      },
      {
        id: "bubble-binary",
        label: "single binary",
        description:
          "The factory ships as one local CLI for laptops, containers, on-prem systems, and hybrid environments.",
      },
      {
        id: "bubble-concurrency",
        label: "concurrency controls",
        description:
          "Set deliberate limits on parallel work so throughput stays predictable instead of overwhelming a machine or provider.",
      },
      {
        id: "bubble-events",
        label: "Event stream based resumption",
        description:
          "Resume long-running work from the event stream instead of restarting the whole task when a session ends.",
      },
      {
        id: "bubble-worktree",
        label: "worktrees",
        description:
          "Give concurrent agents isolated Git worktrees so they can make progress without trampling one another’s files.",
      },
      {
        id: "bubble-metrics",
        label: "metrics",
        description:
          "Track factory throughput, cost, duration, and outcomes while work is running.",
      },
      {
        id: "bubble-logs",
        label: "logs",
        description:
          "Inspect structured logs for every worker, tool call, and workflow transition.",
      },
      {
        id: "bubble-recordings",
        label: "recordings",
        description:
          "Replay recorded sessions to understand exactly how a result was produced.",
      },
      {
        id: "bubble-config",
        label: "file based configuration",
        description:
          "Keep factory topology and defaults in versioned files that agents and people can inspect and change.",
      },
      {
        id: "bubble-script-workers",
        label: "script workers",
        description:
          "Mix deterministic scripts with model-driven workers in the same factory graph.",
      },
      {
        id: "bubble-crons",
        label: "crons",
        description:
          "Schedule recurring factories for maintenance, monitoring, research, and reporting.",
      },
      {
        id: "bubble-task-relationships",
        label: "task relationships",
        description:
          "Express dependencies, fan-out, joins, reviews, and handoffs between tasks.",
      },
      {
        id: "bubble-autocomplete",
        label: "autocomplete",
        description:
          "Discover commands, factories, providers, and parameters directly from the CLI.",
      },
    ],
  },
  cta: {
    headline: "YOU SHOULD INSTALL YOU",
    supporting: "",
    installCommand: "",
  },
  footer: {
    columns: [
      {
        title: "References",
        links: [
          {
            label: "factory configuration",
            href: "/docs/documentation/configuration",
          },
          {
            label: "system configuration",
            href: "/coming-soon/system-configuration",
          },
          { label: "API", href: "/docs/references/api" },
          { label: "Event Stream", href: "/coming-soon/event-stream" },
          { label: "CLI", href: "/docs/documentation/cli" },
        ],
      },
      {
        title: "Guides",
        links: [
          {
            label: "installation and running",
            href: "/coming-soon/installation-and-running",
          },
          {
            label: "writing your first factory",
            href: "/coming-soon/writing-your-first-factory",
          },
          {
            label: "operating the factory",
            href: "/coming-soon/operating-the-factory",
          },
          {
            label: "configuring your factory",
            href: "/coming-soon/configuring-your-factory",
          },
        ],
      },
      {
        title: "Resources",
        links: [
          {
            label: "why YOU over X",
            href: "/coming-soon/why-you-over-x",
          },
          {
            label: "2026 – 100 Orchestrators",
            href: "/blog/comparing-orchestrators",
          },
          { label: "YOU manifesto", href: "/coming-soon/you-manifesto" },
          {
            label: "How to save money with more agents",
            href: "/coming-soon/save-money-with-more-agents",
          },
        ],
      },
      {
        title: "Support",
        links: [
          {
            label: "report a bug",
            href: "https://github.com/portpowered/you-agent-factory/issues/new",
          },
          {
            label: "GITHUB LINK",
            href: "https://github.com/portpowered/you-agent-factory",
          },
          {
            label: "dre@youagentfactory.com",
            href: "mailto:dre@youagentfactory.com",
          },
        ],
      },
    ],
    meta: {
      copyright: "July 19th, 2026",
      author: "ANDREAS ABDI",
      license: "MIT LICENSE",
    },
    artSrc: landingHomeAssets.seadragonCrop,
  },
};
