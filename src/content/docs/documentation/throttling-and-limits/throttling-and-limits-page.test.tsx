/**
 * Page-owned render proof for documentation/throttling-and-limits.
 * Covers documentation shell, four pressure-surface distinctions,
 * no-invented-guarantee cautions, copyable capacity/limits examples,
 * sibling discovery, and non-en locale route render — without leftover
 * What It Covers / Key Concepts intro chrome. Colocated under the page
 * bundle so audit:canonical-page-surface stays within the ordinary
 * page-owned + locale-shipping surface for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("throttling-and-limits documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/documentation/throttling-and-limits as a documentation page",
    async () => {
      const fumadocsPage = source.getPage([
        "documentation",
        "throttling-and-limits",
      ]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe(
        "/docs/documentation/throttling-and-limits",
      );

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "throttling-and-limits",
      });

      expect(loadedPage.messages.title).toBe("Throttling and limits");
      expect(loadedPage.messages.description).toContain("you-agent-factory");
      expect(loadedPage.messages.description).toMatch(
        /resource capacity|provider limits|queue pressure|retry/i,
      );
      expect(loadedPage.messages.description).toMatch(
        /without inventing a global throttle guarantee/i,
      );

      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

      const openingSummary = String(loadedPage.messages.openingSummary ?? "");
      const howToUse = String(
        loadedPage.messages.sections?.howToUse?.body ?? "",
      );
      const operationalCautions = String(
        loadedPage.messages.sections?.operationalCautions?.body ?? "",
      );
      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );

      expect(openingSummary).toMatch(/configured capacity|pressure surfaces/i);
      expect(openingSummary).toMatch(/provider|queue|retry/i);
      expect(openingSummary).not.toMatch(/\n\n/);
      expect(openingSummary).not.toMatch(/on this page|reader.?shortcut/i);

      expect(howToUse).toMatch(/not one global throttle/i);
      expect(howToUse).toMatch(/four surfaces/i);
      expect(howToUse).not.toMatch(/on this page|reader.?shortcut/i);

      expect(operationalCautions).toMatch(
        /does not invent an exponential backoff/i,
      );
      expect(operationalCautions).toMatch(/PROVIDER_QUOTA|INVOCATION_SLOT/);
      expect(operationalCautions).toMatch(/render-queue|terminal-output/i);
      expect(operationalCautions).toMatch(/global_limits/);
      expect(limits).toMatch(/not a resources-only page/i);
      expect(limits).toMatch(/not a workers taxonomy/i);
      expect(limits).toMatch(/not a troubleshooting catalog/i);
      expect(limits).toMatch(/not a packaged CLI sync/i);
      expect(limits).toMatch(/not a guarantee sheet/i);

      expect(
        String(loadedPage.messages.links?.surfaceCapacityName ?? ""),
      ).toMatch(/Configured resource capacity/i);
      expect(
        String(loadedPage.messages.links?.surfaceProviderName ?? ""),
      ).toMatch(/Provider limits/i);
      expect(String(loadedPage.messages.links?.surfaceQueueName ?? "")).toMatch(
        /Queue pressure/i,
      );
      expect(String(loadedPage.messages.links?.surfaceRetryName ?? "")).toMatch(
        /Retry \/ limit behavior/i,
      );
      expect(
        String(loadedPage.messages.links?.capacityExampleJson ?? ""),
      ).toMatch(/agent-slot/);
      expect(
        String(loadedPage.messages.links?.limitsExampleYaml ?? ""),
      ).toMatch(/maxExecutionTime/);
      expect(
        String(loadedPage.messages.links?.limitsExampleYaml ?? ""),
      ).toMatch(/maxRetries/);
      expect(String(loadedPage.messages.links?.retryTeaching ?? "")).toMatch(
        /agent_run_lease_denied/,
      );

      render(
        <main>
          <DocsPageProviders
            messages={loadedPage.messages}
            assets={loadedPage.assets}
          >
            {loadedPage.content}
          </DocsPageProviders>
        </main>,
      );

      expect(
        screen.queryByRole("heading", { name: "What It Covers" }),
      ).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Key Concepts" }),
      ).toBeNull();
      expect(document.getElementById("what-it-covers")).toBeNull();
      expect(document.getElementById("key-concepts")).toBeNull();
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Minimal Example" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Operational Cautions" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();

      expect(document.body.textContent).toMatch(/Configured resource capacity/);
      expect(document.body.textContent).toMatch(/Provider limits/);
      expect(document.body.textContent).toMatch(/Queue pressure/);
      expect(document.body.textContent).toMatch(/Retry \/ limit behavior/);
      expect(document.body.textContent).toMatch(/PROVIDER_QUOTA/);
      expect(document.body.textContent).toMatch(/INVOCATION_SLOT/);
      expect(document.body.textContent).toMatch(/maxExecutionTime/);
      expect(document.body.textContent).toMatch(/maxRetries/);
      expect(document.body.textContent).toMatch(/agent-slot/);
      expect(document.body.textContent).toMatch(/terminal_output_backlog/);
      expect(document.body.textContent).toMatch(/agent_run_lease_denied/);
      expect(document.body.textContent).toMatch(
        /does not invent an exponential backoff/i,
      );
      expect(document.body.textContent).toMatch(/not one global throttle/i);

      const relatedSection = document.getElementById("related");
      expect(relatedSection).toBeTruthy();
      const relatedQueries = within(relatedSection as HTMLElement);
      expect(
        relatedQueries
          .getByRole("link", { name: "Workers" })
          .getAttribute("href"),
      ).toBe("/docs/workers");
      expect(
        relatedQueries
          .getByRole("link", { name: "Resources" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/resources");
      expect(
        relatedQueries
          .getByRole("link", { name: "Troubleshooting" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/troubleshooting");
    },
    PAGE_RENDER_TIMEOUT_MS,
  );

  test(
    "loads ja locale messages with the same section structure",
    async () => {
      const loadedPage = await loadLocalDocsPage(
        {
          section: "documentation",
          slug: "throttling-and-limits",
        },
        "ja",
      );

      expect(loadedPage.messages.title).toBe("Throttling and limits");
      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
      expect(loadedPage.messages.sections?.howToUse?.title).toBe("How To Use");
      expect(loadedPage.messages.sections?.limitsAndAssumptions?.title).toBe(
        "Limits And Assumptions",
      );
      expect(String(loadedPage.messages.openingSummary ?? "")).toMatch(
        /pressure surfaces|configured capacity/i,
      );
      expect(
        String(loadedPage.messages.links?.surfaceCapacityName ?? ""),
      ).toMatch(/Configured resource capacity/i);
      expect(
        String(loadedPage.messages.links?.limitsExampleYaml ?? ""),
      ).toMatch(/maxRetries/);

      render(
        <main>
          <DocsPageProviders
            messages={loadedPage.messages}
            assets={loadedPage.assets}
          >
            {loadedPage.content}
          </DocsPageProviders>
        </main>,
      );

      expect(
        screen.queryByRole("heading", { name: "What It Covers" }),
      ).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Key Concepts" }),
      ).toBeNull();
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(document.body.textContent).toMatch(/Configured resource capacity/);
      expect(document.body.textContent).toMatch(/maxExecutionTime/);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
