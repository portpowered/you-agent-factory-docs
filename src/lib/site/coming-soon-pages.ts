/**
 * Placeholder destinations for surfaces the homepage links to before their real
 * documentation exists.
 *
 * Single source of truth shared by three consumers that previously each carried
 * their own copy of the slug list:
 * - the `/coming-soon/[slug]` route (`generateStaticParams` + page content)
 * - landing-surface link data (`landing-page.data.ts`, `CapabilityStrip`)
 * - the landing link validator (`validate-landing-links.ts`)
 *
 * Adding a slug here is what makes `/coming-soon/<slug>` a valid link target.
 */

export type ComingSoonPage = {
  title: string;
  summary: string;
};

export const COMING_SOON_PAGES = {
  "system-configuration": {
    title: "System configuration",
    summary: "System-wide defaults and runtime configuration for YOU.",
  },
  "event-stream": {
    title: "Event Stream",
    summary: "How factory events are recorded, inspected, and resumed.",
  },
  "installation-and-running": {
    title: "Installation and running",
    summary: "Install YOU on macOS, Linux, or Windows and start a factory.",
  },
  "writing-your-first-factory": {
    title: "Writing your first factory",
    summary: "Build a small durable workflow from the first node onward.",
  },
  "operating-the-factory": {
    title: "Operating the factory",
    summary: "Run, observe, pause, and resume long-lived factory work.",
  },
  "configuring-your-factory": {
    title: "Configuring your factory",
    summary: "Connect workers, workstations, resources, and defaults.",
  },
  "why-you-over-x": {
    title: "Why YOU over X",
    summary: "Where YOU fits alongside agent harnesses and orchestrators.",
  },
  "you-manifesto": {
    title: "YOU manifesto",
    summary: "The principles behind local, durable agent factories.",
  },
  "save-money-with-more-agents": {
    title: "How to save money with more agents",
    summary: "Match models, workflows, and concurrency to the work at hand.",
  },
  "harness-support": {
    title: "Harness support",
    summary:
      "Which agent harnesses YOU drives today, and how to request another.",
  },
  about: {
    title: "About",
    summary: "The people and ideas behind you-agent-factory.",
  },
} as const satisfies Record<string, ComingSoonPage>;

export type ComingSoonSlug = keyof typeof COMING_SOON_PAGES;

/** Route prefix every coming-soon destination lives under. */
export const COMING_SOON_ROUTE_PREFIX = "/coming-soon";

/** Every published coming-soon slug, in declaration order. */
export const COMING_SOON_SLUGS = Object.keys(
  COMING_SOON_PAGES,
) as ComingSoonSlug[];

/** Resolves a coming-soon slug to its app-relative route. */
export function comingSoonHref(slug: ComingSoonSlug): string {
  return `${COMING_SOON_ROUTE_PREFIX}/${slug}`;
}

/** Looks up a coming-soon page, or `undefined` for an unknown slug. */
export function findComingSoonPage(slug: string): ComingSoonPage | undefined {
  return COMING_SOON_PAGES[slug as ComingSoonSlug];
}

/** Every coming-soon route, used as link-validation targets. */
export function listComingSoonRoutes(): string[] {
  return COMING_SOON_SLUGS.map((slug) => comingSoonHref(slug));
}
