import type { CSSProperties } from "react";
import {
  fixtureLandingPageData,
  type LandingCapabilityItem,
} from "@/features/landing-page/landing-page.data";
import { cn } from "@/lib/utils";

export type CapabilityStripItem = LandingCapabilityItem & {
  /** When set, the item is a focusable link with a visible focus treatment. */
  href?: string;
};

export type CapabilityStripProps = {
  /**
   * Capability labels to render.
   * Defaults to `fixtureLandingPageData.capability.items`
   * (FLOWS / AGENTS / ENTRY / OS).
   * Pass `[]` for a stable empty host.
   */
  items?: CapabilityStripItem[];
  /** Root className for layout / section placement. */
  className?: string;
  /** Optional accessible name for the strip group. */
  "aria-label"?: string;
  /** Optional inline styles for section anchoring. */
  style?: CSSProperties;
};

/** Default fixture labels: FLOWS, AGENTS, ENTRY, OS. */
export const CAPABILITY_STRIP_DEFAULT_ITEMS: readonly CapabilityStripItem[] =
  fixtureLandingPageData.capability.items;

/**
 * Mid-page capability label strip.
 *
 * Renders a horizontal, wrapping strip of non-interactive labels by default
 * (list semantics). Items with `href` become keyboard-focusable links.
 */
export function CapabilityStrip({
  items = [...CAPABILITY_STRIP_DEFAULT_ITEMS],
  className,
  "aria-label": ariaLabel = "Capabilities",
  style,
}: CapabilityStripProps) {
  return (
    <ul
      aria-label={ariaLabel}
      className={cn(
        "m-0 flex list-none flex-wrap items-center justify-center gap-x-6 gap-y-3 p-0",
        className,
      )}
      data-capability-strip=""
      data-capability-strip-count={String(items.length)}
      style={style}
    >
      {items.map((item) => {
        const interactive = Boolean(item.href);

        return (
          <li
            key={item.id}
            className="m-0 p-0"
            data-capability-strip-item=""
            data-capability-strip-item-id={item.id}
          >
            {interactive ? (
              <a
                className="inline-flex text-sm font-semibold tracking-[0.12em] text-foreground uppercase underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-capability-strip-link=""
                href={item.href}
              >
                {item.label}
              </a>
            ) : (
              <span className="inline-flex text-sm font-semibold tracking-[0.12em] text-foreground uppercase">
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
