import { notFound } from "next/navigation";
import {
  type FooterColumn,
  type FooterMeta,
  SiteFooter,
} from "@/features/footer";

/**
 * Non-production SiteFooter harness (homepage-2 W-footer).
 *
 * Fixture columns + colored art placeholder only — no seadragon, no LandingPage
 * slot wiring, no production `/` changes. Hidden in production unless
 * ENABLE_COMPONENT_EXAMPLES=1.
 */

const fixtureColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Guides", href: "/docs/guides" },
      { label: "Concepts", href: "/docs/concepts" },
      { label: "Techniques", href: "/docs/techniques" },
    ],
  },
  {
    title: "Docs",
    links: [
      { label: "Browse", href: "/browse" },
      { label: "Configuration", href: "/docs/documentation" },
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
  {
    title: "Company",
    links: [{ label: "About", href: "/about" }],
  },
];

const fixtureMeta: FooterMeta = {
  copyright: "© 2026 you-agent-factory",
  links: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

function ColoredArtPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="flex h-24 w-full items-center justify-center rounded-md text-sm font-semibold text-white"
      data-testid="footer-harness-art-placeholder"
      style={{ backgroundColor: "#c41e3a" }}
    >
      Footer art placeholder (not seadragon)
    </div>
  );
}

export default function FooterHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_COMPONENT_EXAMPLES !== "1"
  ) {
    notFound();
  }

  return (
    <main
      className="min-h-screen bg-background text-foreground"
      data-testid="footer-harness"
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          SiteFooter harness
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Fixture column groups, meta row, and a colored art placeholder. Narrow
          the viewport to confirm columns stack (`grid-cols-1` → `sm:2` →
          `lg:4`).
        </p>
      </div>
      <SiteFooter
        art={<ColoredArtPlaceholder />}
        columns={fixtureColumns}
        meta={fixtureMeta}
      />
    </main>
  );
}
