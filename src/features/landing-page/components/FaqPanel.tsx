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
 * Duration of the answer open/close transition, in milliseconds.
 *
 * Exported so tests can wait out the animation rather than guessing at it.
 * Kept in step with the `duration-[…]` utility in {@link FAQ_ANSWER_SHELL_CLASS}
 * — Tailwind only sees statically written class names, so the two cannot be
 * derived from one another.
 */
export const FAQ_ANSWER_TRANSITION_MS = 420;

/**
 * Animating shell around each answer.
 *
 * Collapsing is a `grid-template-rows: 1fr → 0fr` transition rather than a
 * `hidden` toggle: toggling `display` resizes the panel in a single frame, and
 * everything below it — the whale scene, the CTA, the footer — snaps to the new
 * position. The row transition gives that height change a duration, so the
 * page settles instead of jumping.
 */
const FAQ_ANSWER_SHELL_CLASS = cn(
  "grid transition-[grid-template-rows,opacity] duration-[420ms]",
  "ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
);

const ANSWER_LINK_CLASS = cn(
  "rounded-sm underline underline-offset-2 transition-colors",
  "hover:text-[#191f2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

/**
 * One piece of a parsed answer. `offset` is the segment's start index in the
 * source string, which gives each segment a stable React key without falling
 * back to the array index.
 */
export type FaqAnswerSegment =
  | { kind: "text"; text: string; offset: number }
  | { kind: "link"; text: string; href: string; offset: number };

/** Matches a markdown-style inline link: `[label](/href)`. */
const ANSWER_LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Splits an FAQ answer into plain-text and link segments.
 *
 * Answers are authored as plain strings, so a markdown link written in one used
 * to ship as literal `[label](href)` text. This understands that one inline
 * form and nothing else — an empty or whitespace-only target stays literal text
 * rather than becoming a dead anchor.
 */
export function parseFaqAnswerSegments(answer: string): FaqAnswerSegment[] {
  const segments: FaqAnswerSegment[] = [];
  let cursor = 0;

  for (const match of answer.matchAll(ANSWER_LINK_PATTERN)) {
    const [raw, label = "", href = ""] = match;
    const start = match.index ?? 0;

    if (href.trim() === "") {
      continue;
    }
    if (start > cursor) {
      segments.push({
        kind: "text",
        text: answer.slice(cursor, start),
        offset: cursor,
      });
    }
    segments.push({ kind: "link", text: label, href, offset: start });
    cursor = start + raw.length;
  }

  if (cursor < answer.length) {
    segments.push({ kind: "text", text: answer.slice(cursor), offset: cursor });
  }

  return segments;
}

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

                  <div
                    className={cn(
                      FAQ_ANSWER_SHELL_CLASS,
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0",
                    )}
                    data-landing-faq-answer-shell=""
                    data-landing-faq-answer-open={isOpen ? "true" : "false"}
                  >
                    <section
                      id={panelId}
                      aria-labelledby={headingId}
                      // `inert` (not `hidden`) so the panel keeps a box to
                      // animate. It still leaves the accessibility tree and the
                      // focus order while collapsed, which `display: none`
                      // would also have done — but instantly, which is the
                      // layout jump this is fixing.
                      inert={!isOpen}
                      className="min-h-0 overflow-hidden"
                      data-landing-faq-answer=""
                    >
                      {/*
                       * Spacing and type live on this inner element rather than
                       * on the clipping section above it. Padding on the
                       * clipping box is not itself clippable, so a closed
                       * answer would keep its top padding as a stray gap under
                       * the question instead of collapsing to nothing.
                       */}
                      <div className="px-1 pt-3 text-base leading-relaxed whitespace-pre-line text-[#4a4034] sm:text-lg">
                        {parseFaqAnswerSegments(item.answer).map((segment) =>
                          segment.kind === "link" ? (
                            <a
                              className={ANSWER_LINK_CLASS}
                              href={segment.href}
                              key={`${item.id}-${segment.offset}`}
                            >
                              {segment.text}
                            </a>
                          ) : (
                            <span key={`${item.id}-${segment.offset}`}>
                              {segment.text}
                            </span>
                          ),
                        )}
                      </div>
                    </section>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
