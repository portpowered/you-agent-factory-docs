"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/** Fixture-friendly FAQ item — component prop types only, no CMS schema. */
export type FaqPanelItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqPanelProps = {
  /** Q/A list rendered as an interactive disclosure panel. */
  items: FaqPanelItem[];
  /** Optional section heading above the list. */
  heading?: string;
  className?: string;
  /** Visual surface; transparent lets a shared scene image show through. */
  surface?: "parchment" | "transparent";
};

const QUESTION_BUTTON_CLASS = cn(
  "flex w-full items-center justify-between gap-3 text-left",
  "rounded-sm px-1 py-1 font-sans text-lg font-medium leading-snug text-[#191f2b] sm:text-xl",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

/**
 * Landing-page FAQ panel: parchment list with keyboard-reachable question
 * disclosures. Owned by W-faq-cta — not docs FAQ chrome (`features/faq`).
 */
export function FaqPanel({
  items,
  heading,
  className,
  surface = "parchment",
}: FaqPanelProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(
    () => new Set(items.map((item) => item.id)),
  );

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <section
      aria-label={heading ?? "Frequently asked questions"}
      className={cn(
        "relative w-full overflow-hidden text-[#3d3428] sm:w-[72%]",
        surface === "parchment"
          ? ["border-0 bg-[#dfd6c5]", "px-5 py-7 shadow-none sm:px-10 sm:py-12"]
          : "border-0 bg-transparent px-0 py-7 shadow-none sm:px-0 sm:py-10",
        className,
      )}
      data-landing-faq-panel=""
      data-landing-faq-parchment={surface === "parchment" ? "" : undefined}
      data-landing-faq-surface={surface}
    >
      {surface === "parchment" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(92,70,40,0.08)_100%)]"
          data-landing-faq-vignette=""
        />
      ) : null}

      <div className="relative">
        {heading ? (
          <h2
            className="mb-8 font-sans text-4xl font-medium tracking-[-0.055em] text-[#191f2b] uppercase sm:text-6xl"
            data-landing-faq-heading=""
          >
            {heading}
          </h2>
        ) : null}

        {items.length === 0 ? (
          <p className="text-sm text-[#5c5346]" data-landing-faq-empty="">
            No questions yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3" data-landing-faq-list="">
            {items.map((item) => {
              const isOpen = openIds.has(item.id);
              const panelId = `${baseId}-${item.id}-answer`;
              const headingId = `${baseId}-${item.id}-question`;

              return (
                <li
                  key={item.id}
                  className="border-b border-[#c4b49a]/55 pb-3 last:border-b-0 last:pb-0"
                  data-landing-faq-item=""
                  data-landing-faq-item-id={item.id}
                >
                  <h3 className="text-base font-semibold" id={headingId}>
                    <button
                      type="button"
                      className={QUESTION_BUTTON_CLASS}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      data-landing-faq-question=""
                      onClick={() => toggle(item.id)}
                    >
                      <span>{item.question}</span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "shrink-0 text-sm font-normal text-[#6b5f4f] transition-transform",
                          isOpen && "rotate-180",
                        )}
                      >
                        ▾
                      </span>
                    </button>
                  </h3>

                  <section
                    id={panelId}
                    aria-labelledby={headingId}
                    hidden={!isOpen}
                    className="mt-3 px-1 text-base leading-relaxed whitespace-pre-line text-[#4a4034] sm:text-lg"
                    data-landing-faq-answer=""
                  >
                    {item.answer}
                  </section>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
