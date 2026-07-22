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
        "site-footer w-full border-t-0 bg-[#dfd6c5] text-[#191f2b]",
        className,
      )}
      data-testid="site-footer"
    >
      <div className="site-footer__inner mx-auto flex w-full max-w-[100rem] flex-col gap-8 px-[clamp(1rem,5vw,5rem)] pt-3 pb-8">
        <div
          aria-hidden="true"
          className="grid grid-cols-4 overflow-hidden font-sans text-[clamp(3.5rem,9vw,9rem)] leading-[0.78] tracking-[-0.09em] text-[#191f2b] uppercase"
          data-testid="site-footer-marquee"
        >
          <span>YOU</span>
          <span>YOU</span>
          <span>YOU</span>
          <span>YOU</span>
        </div>
        {columns.length > 0 ? (
          <nav
            aria-label="Site footer"
            className="site-footer__columns grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12"
            data-testid="site-footer-columns"
          >
            {columns.map((column) => (
              <div
                key={column.title}
                className="site-footer__column flex flex-col gap-4"
              >
                <h2 className="font-sans text-[clamp(2rem,3.6vw,3.8rem)] leading-none font-normal tracking-[-0.05em] text-[#191f2b]">
                  {column.title}
                </h2>
                <ul className="flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={`${column.title}:${link.href}:${link.label}`}>
                      <a
                        href={link.href}
                        className="font-sans text-sm leading-tight text-[#191f2b]/88 underline-offset-4 hover:text-[#191f2b] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191f2b] sm:text-base"
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

        {art != null ? (
          <div className="site-footer__art" data-testid="site-footer-art">
            {art}
          </div>
        ) : null}

        <div
          className="site-footer__meta relative z-20 -mt-16 flex flex-col gap-3 border-t-0 px-2 pb-2 font-sans text-sm text-[#191f2b] sm:-mt-20 sm:flex-row sm:items-end sm:justify-between"
          data-testid="site-footer-meta"
        >
          <p>{meta.copyright}</p>
          {meta.links != null && meta.links.length > 0 ? (
            <ul className="flex flex-col gap-0.5 text-left sm:text-right">
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
