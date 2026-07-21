import { cn } from "@/lib/utils";
import type { SiteFooterProps } from "./site-footer.types";

/**
 * Landing site footer: column link groups, meta row, optional opaque art slot.
 *
 * Decorative art is caller-owned (`art?: ReactNode`). This package does not
 * embed seadragon / LandingFooterArt. Distinct from docs next/prev chrome.
 */
export function SiteFooter({ columns, meta, art, className }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        "site-footer w-full border-t border-border bg-background text-foreground",
        className,
      )}
      data-testid="site-footer"
    >
      <div className="site-footer__inner mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        {art != null ? (
          <div className="site-footer__art" data-testid="site-footer-art">
            {art}
          </div>
        ) : null}

        {columns.length > 0 ? (
          <nav
            aria-label="Site footer"
            className="site-footer__columns grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
            data-testid="site-footer-columns"
          >
            {columns.map((column) => (
              <div
                key={column.title}
                className="site-footer__column flex flex-col gap-3"
              >
                <h2 className="text-sm font-semibold tracking-wide text-foreground">
                  {column.title}
                </h2>
                <ul className="flex flex-col gap-2">
                  {column.links.map((link) => (
                    <li key={`${column.title}:${link.href}:${link.label}`}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        ) : null}

        <div
          className="site-footer__meta flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
          data-testid="site-footer-meta"
        >
          <p>{meta.copyright}</p>
          {meta.links != null && meta.links.length > 0 ? (
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {meta.links.map((link) => (
                <li key={`meta:${link.href}:${link.label}`}>
                  <a
                    href={link.href}
                    className="underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
