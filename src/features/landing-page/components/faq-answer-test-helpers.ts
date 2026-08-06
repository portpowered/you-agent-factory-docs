import { expect } from "bun:test";
import { parseFaqAnswerSegments } from "@/features/landing-page/components/FaqPanel";

/**
 * Asserts an FAQ answer reached the rendered HTML.
 *
 * Answers may carry inline markdown links, which `FaqPanel` renders as anchors
 * rather than literal `[label](href)` text — so asserting on the raw authored
 * string fails even when the answer rendered correctly. Checks each segment's
 * text plus each link's resolved `href` instead.
 */
export function expectFaqAnswerRendered(html: string, answer: string): void {
  for (const segment of parseFaqAnswerSegments(answer)) {
    expect(html).toContain(segment.text);
    if (segment.kind === "link") {
      expect(html).toContain(`href="${segment.href}"`);
    }
  }
}
