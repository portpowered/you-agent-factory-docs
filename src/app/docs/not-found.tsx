import Link from "next/link";
import { buildLocalizedRoute, defaultLocale } from "@/lib/i18n/locale-routing";

const recoveryLinkClassName =
  "inline-flex items-center rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-ring hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const recoveryLinks = [
  {
    href: buildLocalizedRoute(
      { surface: "docs-page", slug: "guides/getting-started" },
      defaultLocale,
    ),
    label: "Getting Started",
  },
  {
    href: buildLocalizedRoute({ surface: "browse" }, defaultLocale),
    label: "Browse",
  },
  {
    href: buildLocalizedRoute({ surface: "search" }, defaultLocale),
    label: "Search",
  },
  {
    href: buildLocalizedRoute({ surface: "blog-index" }, defaultLocale),
    label: "Blog",
  },
] as const;

export default function DocsNotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="text-muted-foreground">
        No documentation page matches this path. Continue from Getting Started,
        browse the factory collections, search the docs, or read the blog.
      </p>
      <nav
        aria-label="Recovery links"
        className="mt-2 flex flex-wrap items-center gap-3"
      >
        {recoveryLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={recoveryLinkClassName}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
