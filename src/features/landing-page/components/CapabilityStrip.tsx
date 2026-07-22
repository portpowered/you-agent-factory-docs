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
  /** Painted parchment field that folds the hero artwork into this section. */
  backgroundSrc?: string;
};

/** Default fixture labels: FLOWS, AGENTS, ENTRY, OS. */
export const CAPABILITY_STRIP_DEFAULT_ITEMS: readonly CapabilityStripItem[] =
  fixtureLandingPageData.capability.items;

const CAPABILITY_HREFS: Readonly<Record<string, string>> = {
  YOU: "/",
  CLI: "/docs/documentation/cli",
  MCP: "/docs/references/mcp-reference",
  API: "/docs/references/api",
  SSE: "/coming-soon/event-stream",
  FLOWS: "/docs/factories",
  JS: "/docs/references/javascript-runtime",
  GRAPH: "/docs/architecture",
  AGENTS: "/docs/workers",
  CODEX: "/docs/workers",
  CLAUDE: "/docs/workers",
  "10+": "/docs/workers",
  ENTRY: "/docs/documentation",
  UI: "/docs",
  OS: "/docs/guides",
  MAC: "/coming-soon/installation-and-running",
  LINUX: "/coming-soon/installation-and-running",
  WINDOWS: "/coming-soon/installation-and-running",
};

const TOKEN_LINK_CLASS =
  "rounded-sm underline-offset-[0.12em] transition-colors hover:text-[#f3bd3d] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191f2b]";

function renderLinkedToken(token: string) {
  const href = CAPABILITY_HREFS[token];
  return href ? (
    <a
      className={TOKEN_LINK_CLASS}
      data-capability-token={token.toLowerCase()}
      href={href}
      key={token}
    >
      {token}
    </a>
  ) : (
    <span key={token}>{token}</span>
  );
}

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
  backgroundSrc,
}: CapabilityStripProps) {
  return (
    <section
      className={cn(
        "relative isolate -mt-px w-full overflow-visible bg-transparent text-[#191f2b]",
        className,
      )}
      data-capability-scene=""
      style={style}
    >
      {backgroundSrc ? (
        <img
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-full w-full object-fill object-top"
          data-capability-background=""
          decoding="async"
          src={backgroundSrc}
        />
      ) : null}
      <ul
        aria-label={ariaLabel}
        className="relative z-10 mx-auto flex w-full max-w-[100rem] list-none flex-col px-[clamp(1rem,2.5vw,2.5rem)] pt-0 pb-[clamp(1rem,2vw,2rem)]"
        data-capability-copy-position="transition"
        data-capability-strip=""
        data-capability-strip-count={String(items.length)}
      >
        {items.map((item, index) => {
          const interactive = Boolean(item.href);
          const [rowLabel, rowValue] =
            index >= 3 ? item.label.split(" : ", 2) : [undefined, undefined];
          const displayClass = cn(
            "inline-flex w-full font-mono font-black leading-[0.78] tracking-[-0.08em] uppercase",
            index === 0
              ? "justify-center text-[clamp(7rem,14vw,17rem)] text-[#f1eee6]"
              : index === 1
                ? "-mt-[0.16em] justify-center text-[clamp(5.5rem,11vw,13rem)]"
                : index === 2
                  ? "-mt-[0.14em] justify-center whitespace-nowrap text-center text-[clamp(5.5rem,11vw,13rem)] tracking-[-0.09em]"
                  : "grid grid-cols-[minmax(5rem,0.62fr)_auto_minmax(0,1.9fr)] items-baseline gap-x-[clamp(0.5rem,1.8vw,2rem)] text-[clamp(1.5rem,4vw,4.4rem)] leading-[0.88] tracking-[-0.075em]",
          );

          return (
            <li
              key={item.id}
              className={cn(
                "m-0 min-w-0 p-0",
                index === 2 && "mb-[clamp(0.35rem,1vw,1rem)]",
                index >= 3 && "py-1 sm:py-1.5",
              )}
              data-capability-strip-item=""
              data-capability-strip-item-id={item.id}
            >
              {interactive ? (
                <a
                  className={cn(
                    displayClass,
                    "underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191f2b]",
                  )}
                  data-capability-strip-link=""
                  href={item.href}
                >
                  {item.label}
                </a>
              ) : (
                <span className={displayClass}>
                  {rowLabel !== undefined && rowValue !== undefined ? (
                    <>
                      <span>{renderLinkedToken(rowLabel)}</span>
                      <span aria-hidden="true"> : </span>
                      <span className="flex min-w-0 flex-wrap items-baseline gap-x-[0.22em]">
                        {rowValue.split(" | ").map((token, tokenIndex) => (
                          <span
                            className="inline-flex items-baseline gap-x-[0.22em]"
                            key={token}
                          >
                            {tokenIndex > 0 ? (
                              <span aria-hidden="true">|</span>
                            ) : null}
                            {renderLinkedToken(token)}
                          </span>
                        ))}
                      </span>
                    </>
                  ) : index === 2 ? (
                    item.label.split(" ").map((token, tokenIndex) => (
                      <span
                        className="inline-flex items-baseline gap-x-[0.18em]"
                        key={token}
                      >
                        {tokenIndex > 0 ? (
                          <span aria-hidden="true">|</span>
                        ) : null}
                        {renderLinkedToken(token)}
                      </span>
                    ))
                  ) : (
                    renderLinkedToken(item.label)
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
