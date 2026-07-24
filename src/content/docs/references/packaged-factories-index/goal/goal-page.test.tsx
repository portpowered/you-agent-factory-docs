/**
 * Page-owned publish proof for references/packaged-factories-index/goal.
 * Covers concise reference surface plus full-mode goal-only replay mount
 * driven by the goal recording. Cross-route recording import-graph isolation
 * lives in goal-subagent-recording-isolation.test.ts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES } from "@/features/factory-replay";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadRegistry } from "@/lib/content/registry";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;
const REGISTRY_ID = "reference.packaged-factories-index-goal";
const ROUTE_SLUG = "packaged-factories-index/goal";

function ensureIntersectionObserverStub(): void {
  if (typeof globalThis.IntersectionObserver === "function") {
    return;
  }
  globalThis.IntersectionObserver = class {
    disconnect(): void {}
    observe(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve(): void {}
  } as unknown as typeof IntersectionObserver;
}

describe("packaged-factories-index/goal reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/references/packaged-factories-index/goal with concise @you/goal reference content and full-mode replay",
    async () => {
      ensureIntersectionObserverStub();

      const fumadocsPage = source.getPage([
        "references",
        "packaged-factories-index",
        "goal",
      ]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe(
        "/docs/references/packaged-factories-index/goal",
      );

      const registry = await loadRegistry();
      const record = registry.byId.get(REGISTRY_ID);
      expect(record?.kind).toBe("reference");
      expect(record?.slug).toBe(ROUTE_SLUG);
      expect(record?.status).toBe("published");

      const loadedPage = await loadLocalDocsPage({
        section: "references",
        slug: ROUTE_SLUG,
      });

      expect(loadedPage.frontmatter.kind).toBe("reference");
      expect(loadedPage.frontmatter.registryId).toBe(REGISTRY_ID);
      expect(loadedPage.messages.title).toBe("@you/goal");
      expect(loadedPage.messages.links?.canonicalName).toBe("@you/goal");
      expect(loadedPage.messages.description).toMatch(/@you\/goal/i);
      expect(
        String(loadedPage.messages.sections?.overview?.body ?? ""),
      ).toMatch(/packaged named factory/i);
      expect(
        String(loadedPage.messages.sections?.overview?.body ?? ""),
      ).not.toMatch(/factory\.json|on this page|workflow/i);
      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
      expect(
        loadedPage.messages.sections?.limitsAndAssumptions,
      ).toBeUndefined();
      expect(loadedPage.messages.sections?.operationalNotes).toBeUndefined();
      expect(
        String(loadedPage.messages.sections?.deterministicReplay?.title ?? ""),
      ).toBe("Deterministic replay");

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

      expect(screen.getByRole("heading", { name: "Overview" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Invocation examples" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Complete definition" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Deterministic replay" }),
      ).toBeTruthy();

      const canonical = document.querySelector(
        "[data-packaged-factory-canonical-name]",
      );
      expect(canonical?.textContent).toContain("@you/goal");

      expect(
        screen.getByText(/you run --named @you\/goal "Ship the login bug fix"/),
      ).toBeTruthy();
      expect(
        screen.getByText(/you run --named @you\/goal --help/),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /you run --named @you\/goal "Reduce flake in the auth suite"/,
        ),
      ).toBeTruthy();

      const definitionLink = screen.getByRole("link", {
        name: /Complete @you\/goal definition on Packaged Factory Reference/i,
      });
      expect(definitionLink.getAttribute("href")).toBe(
        "/docs/references/packaged-factories-index#goal",
      );

      expect(document.body.textContent).not.toMatch(
        /"id":\s*"builtin-goal"|unabridged factory\.json/i,
      );

      const replayRoot = screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.chrome.regionLabel,
      });
      expect(replayRoot.getAttribute("data-factory-replay-mode")).toBe("full");
      expect(
        screen.getByRole("region", {
          name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.regionLabel,
        }),
      ).toBeTruthy();
      expect(
        screen.getByRole("region", {
          name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.topology.regionLabel,
        }),
      ).toBeTruthy();
      expect(
        screen.getByRole("region", {
          name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.progress.regionLabel,
        }),
      ).toBeTruthy();
      expect(replayRoot.getAttribute("data-presentation-status")).toBe("ready");
      // Distinctive goal recording topology labels (not subagent / siblings).
      expect(screen.getByText("execute-goal")).toBeTruthy();
      expect(screen.queryByText("run-subagent")).toBeNull();
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
