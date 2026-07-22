import type { Metadata } from "next";
import { notFound } from "next/navigation";

const COMING_SOON_PAGES = {
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
  about: {
    title: "About",
    summary: "The people and ideas behind you-agent-factory.",
  },
} as const;

type ComingSoonSlug = keyof typeof COMING_SOON_PAGES;

type ComingSoonPageProps = {
  params: Promise<{ slug: string }>;
};

function resolvePage(slug: string) {
  return COMING_SOON_PAGES[slug as ComingSoonSlug];
}

export function generateStaticParams() {
  return Object.keys(COMING_SOON_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ComingSoonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = resolvePage(slug);
  if (!page) return {};
  return { title: page.title, description: page.summary };
}

export default async function ComingSoonPage({ params }: ComingSoonPageProps) {
  const { slug } = await params;
  const page = resolvePage(slug);
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-[#191f2b] px-5 py-24 text-[#ecece4] sm:px-10">
      <div className="mx-auto max-w-5xl">
        <a
          className="font-mono text-xs font-bold tracking-[0.16em] uppercase underline-offset-4 hover:underline"
          href="/"
        >
          ← YOU
        </a>
        <p className="mt-20 font-mono text-xs font-bold tracking-[0.18em] text-[#f3bd3d] uppercase">
          Documentation in progress
        </p>
        <h1 className="mt-3 font-mono text-[clamp(3.4rem,10vw,9rem)] leading-[0.82] font-black tracking-[-0.09em] uppercase">
          {page.title}
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#ecece4]/75 sm:text-xl">
          {page.summary} This page is linked from the reference homepage and
          will be expanded with practical documentation.
        </p>
      </div>
    </main>
  );
}
