import { notFound } from "next/navigation";
import {
  type FooterColumn,
  type FooterMeta,
  SiteFooter,
} from "@/features/footer";
import {
  CtaBand,
  FaqPanel,
  LandingFooterArt,
  LandingHeader,
} from "@/features/landing-page";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";

/**
 * Non-production W-faq-cta harness.
 *
 * Stacks LandingHeader → FaqPanel → CtaBand → LandingFooterArt (inside a
 * fixture SiteFooter art slot) on a skeleton-like background. Hidden in
 * production unless ENABLE_COMPONENT_EXAMPLES=1. Does not flip production `/`.
 */

const fixtureNav = [
  { id: "browse", label: "Browse", href: "/browse" },
  { id: "guides", label: "Guides", href: "/docs/guides" },
  { id: "blog", label: "Blog", href: "/blog" },
  { id: "references", label: "References", href: "/docs/references" },
] as const;

const fixtureColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Guides", href: "/docs/guides" },
      { label: "Browse", href: "/browse" },
    ],
  },
  {
    title: "Community",
    links: [{ label: "Blog", href: "/blog" }],
  },
];

const fixtureMeta: FooterMeta = {
  copyright: "© 2026 you-agent-factory",
  links: [{ label: "Privacy", href: "/privacy" }],
};

export default function FaqCtaHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_COMPONENT_EXAMPLES !== "1"
  ) {
    notFound();
  }

  const { faq, cta } = fixtureLandingPageData;

  return (
    <main
      className="min-h-screen bg-neutral-200 text-neutral-800"
      data-testid="faq-cta-harness"
      data-faq-cta-harness=""
    >
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="mb-4 font-mono text-xs tracking-wide text-neutral-600 uppercase">
          faq-cta harness (skeleton bg)
        </p>

        <div className="flex flex-col gap-8">
          <LandingHeader
            brand={fixtureLandingPageData.header.brand}
            items={[...fixtureNav]}
          />

          <FaqPanel heading="FAQ" items={faq.items} />

          <CtaBand
            headline={cta.headline}
            supporting={cta.supporting}
            installCommand={cta.installCommand}
            ctaLabel="Install the CLI"
            ctaHref="/docs/guides"
          />

          <SiteFooter
            art={<LandingFooterArt />}
            columns={fixtureColumns}
            meta={fixtureMeta}
          />
        </div>
      </div>
    </main>
  );
}
