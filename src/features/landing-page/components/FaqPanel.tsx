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
};

const QUESTION_BUTTON_CLASS = cn(
  "flex w-full items-center justify-between gap-3 text-left",
  "rounded-sm px-1 py-1 text-base font-semibold text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

/**
 * Landing-page FAQ panel: parchment list with keyboard-reachable question
 * disclosures. Owned by W-faq-cta — not docs FAQ chrome (`features/faq`).
 */
export function FaqPanel({ items, heading, className }: FaqPanelProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());

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
        "relative w-full overflow-hidden rounded-lg border border-[#c4b49a]/70",
        "bg-[linear-gradient(165deg,#f7f0e2_0%,#efe4d0_48%,#e8dcc4_100%)]",
        "px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_28px_rgba(72,52,28,0.12)]",
        "text-[#3d3428]",
        className,
      )}
      data-landing-faq-panel=""
      data-landing-faq-parchment=""
    >
      {/* Soft edge vignette — reads as paper, not a flat card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(92,70,40,0.08)_100%)]"
      />

      <div className="relative">
        {heading ? (
          <h2
            className="mb-4 text-lg font-semibold tracking-tight text-[#2f281f]"
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
                    className="mt-2 px-1 text-sm leading-relaxed text-[#4a4034]"
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
