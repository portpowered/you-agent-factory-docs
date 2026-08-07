/**
 * Pure helpers for the CLI command card's prose.
 *
 * The published contract carries a title and a long description whose opening
 * line usually restates that title verbatim (`you factory list` →
 * "List persisted named factories" / "List persisted named factories.\n\n…").
 * Rendering both fields as-is prints the same sentence twice. These helpers
 * drop the restated opening without ever rewriting published text.
 */

import type { CliCommandNormalized } from "@/lib/references/family-normalized-models";

export type CliCommandDescription = {
  /** One-line summary shown under the command path. */
  summary?: string;
  /** Remaining published prose, or undefined when the long text added nothing. */
  detail?: string;
};

/** Compare two published sentences ignoring case and a trailing period. */
function sameSentence(left: string, right: string): boolean {
  const normalize = (value: string) =>
    value.trim().replace(/\.$/, "").toLowerCase();
  return normalize(left) === normalize(right);
}

/**
 * Split a command's published prose into a summary and the detail below it.
 *
 * When the long description opens by restating the short one, that opening
 * paragraph is dropped so the sentence appears once. When the two genuinely
 * differ, both are kept — the contract is never rewritten to force a match.
 */
export function splitCliCommandDescription(
  command: Pick<
    CliCommandNormalized,
    "shortDescription" | "longDescription" | "description"
  >,
): CliCommandDescription {
  const summary = command.shortDescription ?? command.description;
  const long = command.longDescription?.trim();

  if (long === undefined || long.length === 0) {
    return summary !== undefined ? { summary } : {};
  }

  const breakIndex = long.search(/\n\s*\n/);
  const head = (breakIndex < 0 ? long : long.slice(0, breakIndex)).trim();
  const rest = breakIndex < 0 ? "" : long.slice(breakIndex).trim();

  if (summary === undefined) {
    const projected: CliCommandDescription = { summary: head };
    if (rest.length > 0) {
      projected.detail = rest;
    }
    return projected;
  }

  if (sameSentence(head, summary)) {
    return rest.length > 0 ? { summary, detail: rest } : { summary };
  }

  return { summary, detail: long };
}
