/**
 * Page-owned render proof for concepts/checklist.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within page-owned budget for the checklist bundle (shared tests live elsewhere).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("checklist concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/concepts/checklist as a docs concept page", async () => {
    const fumadocsPage = source.getPage(["concepts", "checklist"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/concepts/checklist");

    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "checklist",
    });

    expect(loadedPage.messages.title).toBe("Checklist");
    expect(loadedPage.messages.description).toContain(
      "live outcomes and workstream board",
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItIs = String(loadedPage.messages.sections?.whatItIs?.body ?? "");
    const whyItMatters = String(
      loadedPage.messages.sections?.whyItMatters?.body ?? "",
    );
    const simpleExample = String(
      loadedPage.messages.sections?.simpleExample?.body ?? "",
    );
    const commonConfusions = String(
      loadedPage.messages.sections?.commonConfusions?.body ?? "",
    );
    expect(whatItIs).toMatch(/live outcomes and workstream board/i);
    expect(whatItIs).toMatch(/done/i);
    expect(whatItIs).toMatch(/active/i);
    expect(whatItIs).toMatch(/ready next/i);
    expect(whatItIs).toMatch(/intentionally held/i);
    expect(whatItIs).toMatch(/not mandatory gates/i);
    expect(whyItMatters).toMatch(/track customer outcomes/i);
    expect(whyItMatters).toMatch(/parallel/i);
    expect(whyItMatters).toMatch(/real holds/i);
    expect(simpleExample).toMatch(/customer outcomes/i);
    expect(simpleExample).toMatch(/done/i);
    expect(simpleExample).toMatch(/active/i);
    expect(simpleExample).toMatch(/ready next/i);
    expect(simpleExample).toMatch(/held/i);
    expect(simpleExample).toMatch(/collision|in flight/i);
    expect(commonConfusions).toMatch(/task queue/i);
    expect(commonConfusions).toMatch(/ordered work waiting to run/i);
    expect(commonConfusions).toMatch(
      /architectural checklist|acceptance-criteria/i,
    );
    expect(commonConfusions).toMatch(/static verification lists/i);
    expect(commonConfusions).toMatch(/phase-gated/i);
    expect(whatItIs).not.toMatch(/on this page|Model Atlas/i);
    expect(whyItMatters).not.toMatch(/on this page|Model Atlas/i);
    expect(simpleExample).not.toMatch(/on this page|Model Atlas/i);
    expect(commonConfusions).not.toMatch(/on this page|Model Atlas/i);

    render(
      <main>
        <ModulePageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          {loadedPage.content}
        </ModulePageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "What It Is" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Why It Matters" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Simple Example" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Common Confusions" }),
    ).toBeTruthy();
    expect(
      screen.getAllByText(/live outcomes and workstream board/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/track customer outcomes/i)).toBeTruthy();
    expect(screen.getByText(/Picture a compact board/i)).toBeTruthy();
    expect(screen.getByText(/not a task queue/i)).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);

    const taskQueueLink = screen.getByRole("link", { name: "Task queue" });
    expect(taskQueueLink.getAttribute("href")).toBe(
      "/docs/concepts/task-queue",
    );
  });

  test("ships ja / zh-CN / vi message stubs with the same key shape as English", async () => {
    const en = await loadLocalDocsPage({
      section: "concepts",
      slug: "checklist",
    });
    const ja = await loadLocalDocsPage(
      { section: "concepts", slug: "checklist" },
      "ja",
    );
    const zhCN = await loadLocalDocsPage(
      { section: "concepts", slug: "checklist" },
      "zh-CN",
    );
    const vi = await loadLocalDocsPage(
      { section: "concepts", slug: "checklist" },
      "vi",
    );

    expect(Object.keys(ja.messages).sort()).toEqual(
      Object.keys(en.messages).sort(),
    );
    expect(Object.keys(zhCN.messages).sort()).toEqual(
      Object.keys(en.messages).sort(),
    );
    expect(Object.keys(vi.messages).sort()).toEqual(
      Object.keys(en.messages).sort(),
    );
    expect(ja.messages.links?.taskQueue).toBe("Task queue");
    expect(zhCN.messages.links?.taskQueue).toBe("Task queue");
    expect(vi.messages.links?.taskQueue).toBe("Task queue");
    expect(String(ja.messages.sections?.whatItIs?.title ?? "")).toBe(
      "What It Is",
    );
    expect(String(zhCN.messages.sections?.whatItIs?.title ?? "")).toBe(
      "What It Is",
    );
    expect(String(vi.messages.sections?.whatItIs?.title ?? "")).toBe(
      "What It Is",
    );
  });
});
