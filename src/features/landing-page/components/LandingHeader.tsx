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
  "text-sm font-semibold tracking-tight text-foreground",
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

const NAV_LINK_CLASS = cn(
  "text-sm text-muted-foreground transition-colors hover:text-foreground",
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

/**
 * Landing-page top chrome: brand + resolving nav links + optional search slot.
 * Owned by W-faq-cta — not docs header chrome.
 */
export function LandingHeader({
  brand = "you-agent-factory",
  brandHref = "/",
  items,
  search,
  className,
}: LandingHeaderProps) {
  return (
    <header
      className={cn(
        "flex w-full items-center gap-6 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm",
        className,
      )}
      data-landing-header=""
    >
      <a
        href={brandHref}
        className={BRAND_LINK_CLASS}
        data-landing-header-brand=""
      >
        {brand}
      </a>

      <nav
        aria-label="Landing"
        className="min-w-0 flex-1"
        data-landing-header-nav=""
      >
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {items.map((item) => (
            <li key={item.id ?? `${item.href}:${item.label}`}>
              <a
                href={item.href}
                className={NAV_LINK_CLASS}
                data-landing-header-nav-link=""
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {search != null ? (
        <div className="shrink-0" data-landing-header-search="">
          {search}
        </div>
      ) : null}
    </header>
  );
}
