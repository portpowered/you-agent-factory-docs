/**
 * Playwright helper: inject axe-core into a served page and collect
 * serious/critical violations. Used by critical-route browser a11y probes.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { Page } from "playwright";

export type PlaywrightAxeViolation = {
  id: string;
  impact: string | null | undefined;
  help: string;
  nodes: string[];
};

export type PlaywrightAxeSeriousResult = {
  serious: PlaywrightAxeViolation[];
};

const require = createRequire(import.meta.url);

function resolveAxeSource(): string {
  const axePath = require.resolve("axe-core/axe.min.js");
  return readFileSync(axePath, "utf8");
}

/**
 * Injects axe-core and returns serious/critical violations for the full page.
 */
export async function runSeriousAxeOnPlaywrightPage(
  page: Page,
): Promise<PlaywrightAxeSeriousResult> {
  const axeSource = resolveAxeSource();
  await page.evaluate(axeSource);
  const serious = await page.evaluate(() => {
    const axe = (
      globalThis as unknown as {
        axe: {
          run: (
            context?: unknown,
            options?: unknown,
          ) => Promise<{
            violations: Array<{
              id: string;
              impact?: string | null;
              help: string;
              nodes: Array<{ target: string[] }>;
            }>;
          }>;
        };
      }
    ).axe;

    return axe
      .run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
        },
      })
      .then((results) =>
        results.violations
          .filter((violation) => {
            const impact = violation.impact;
            return impact === "serious" || impact === "critical";
          })
          .map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            help: violation.help,
            nodes: violation.nodes.map((node) => node.target.join(", ")),
          })),
      );
  });

  return { serious };
}

export function formatPlaywrightAxeViolations(
  serious: readonly PlaywrightAxeViolation[],
): string {
  return serious
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes.join("; ")}`,
    )
    .join("\n");
}

/** Asserts a Playwright page has no serious/critical axe violations. */
export async function expectNoSeriousAxeOnPlaywrightPage(
  page: Page,
): Promise<void> {
  const { serious } = await runSeriousAxeOnPlaywrightPage(page);
  if (serious.length > 0) {
    throw new Error(
      `Serious axe violations:\n${formatPlaywrightAxeViolations(serious)}`,
    );
  }
}
