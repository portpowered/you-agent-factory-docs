import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  COMING_SOON_SLUGS,
  findComingSoonPage,
} from "@/lib/site/coming-soon-pages";

type ComingSoonPageProps = {
  params: Promise<{ slug: string }>;
};

const resolvePage = findComingSoonPage;

export function generateStaticParams() {
  return COMING_SOON_SLUGS.map((slug) => ({ slug }));
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
