import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Fixture-friendly nav item — component prop types only, no CMS schema. */
export type LandingHeaderNavItem = {
  label: string;
  href: string;
  /** Optional stable key when label alone is not unique. */
  id?: string;
};

export type LandingHeaderProps = {
  /** Brand label shown as the home control. */
  brand?: string;
  /** Destination for the brand control. Defaults to `/`. */
  brandHref?: string;
  /** Primary nav destinations (label + resolving href). */
  items: LandingHeaderNavItem[];
  /**
   * Optional search affordance (slot). When omitted, no search surface is
   * reserved — brand + nav still render without an empty broken control.
   */
  search?: ReactNode;
  className?: string;
};

const BRAND_LINK_CLASS = cn(
  "font-mono text-xl font-black tracking-[-0.08em] text-[#ecece4] sm:text-2xl",
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

const NAV_LINK_CLASS = cn(
  "font-mono text-[0.65rem] font-semibold tracking-[0.12em] text-[#ecece4]/70 uppercase transition-colors hover:text-[#f3bd3d]",
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

/**
 * Landing-page top chrome: brand + resolving nav links + optional search slot.
 * Owned by W-faq-cta — not docs header chrome.
 */
export function LandingHeader({
  brand = "YOU",
  brandHref = "/",
  items,
  search,
  className,
}: LandingHeaderProps) {
  const splitAt = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, splitAt);
  const rightItems = items.slice(splitAt);

  const renderItems = (navItems: LandingHeaderNavItem[]) =>
    navItems.map((item) => (
      <li key={item.id ?? `${item.href}:${item.label}`}>
        <a
          href={item.href}
          className={NAV_LINK_CLASS}
          data-landing-header-nav-link=""
        >
          {item.label}
        </a>
      </li>
    ));

  return (
    <header
      className={cn(
        "relative z-50 w-full bg-[#191f2b]/92 text-[#ecece4] backdrop-blur-sm",
        className,
      )}
      data-landing-header=""
    >
      <div className="mx-auto grid min-h-16 w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:min-h-20 sm:px-8">
        <nav
          aria-label="Landing"
          className="hidden min-w-0 justify-self-start sm:block"
          data-landing-header-nav=""
        >
          <ul className="grid w-full grid-cols-2 items-center gap-5">
            {renderItems(leftItems)}
          </ul>
        </nav>

        <a
          href={brandHref}
          className={cn(BRAND_LINK_CLASS, "col-start-2")}
          data-landing-header-brand=""
        >
          {brand}
        </a>

        <div className="col-start-3 flex min-w-0 items-center justify-end gap-5">
          {rightItems.length > 0 ? (
            <nav aria-label="Landing secondary" className="hidden sm:block">
              <ul className="grid w-full grid-cols-2 items-center gap-5 text-right [&>li:last-child]:col-start-2">
                {renderItems(rightItems)}
              </ul>
            </nav>
          ) : null}
          {search != null ? (
            <div className="min-w-0 shrink" data-landing-header-search="">
              {search}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
