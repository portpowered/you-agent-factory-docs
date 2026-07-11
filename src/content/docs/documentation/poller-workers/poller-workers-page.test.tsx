/**
 * Page-owned render proof for documentation/poller-workers.
 * Covers documentation shell, Poller workers identity, ownership teaching,
 * lifecycle, Linear example, requestId idempotency, and secret-ref cautions —
 * not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("poller-workers documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/poller-workers with ownership, lifecycle, and idempotency teaching", async () => {
    const fumadocsPage = source.getPage(["documentation", "poller-workers"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/poller-workers");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "poller-workers",
    });

    expect(loadedPage.messages.title).toBe("Poller workers");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/POLLER_WORKER/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );
    const ownershipWorker = String(
      loadedPage.messages.links?.ownershipWorkerFields ?? "",
    );
    const ownershipWorkstation = String(
      loadedPage.messages.links?.ownershipWorkstationFields ?? "",
    );
    const lifecycle = String(loadedPage.messages.links?.lifecycleBody ?? "");
    const idempotency = String(
      loadedPage.messages.links?.idempotencyBody ?? "",
    );
    const secretCaution = String(
      loadedPage.messages.links?.secretCautionBody ?? "",
    );
    const minimalWorker = String(
      loadedPage.messages.links?.minimalPollerWorkerExample ?? "",
    );
    const minimalWorkstation = String(
      loadedPage.messages.links?.minimalPollerWorkstationExample ?? "",
    );

    expect(whatItCovers).toMatch(/POLLER_WORKER/i);
    expect(whatItCovers).toMatch(/LINEAR/i);
    expect(whatItCovers).toMatch(/requestId/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut|later story/i,
    );
    expect(keyConcepts).toMatch(/POLLER_WORKER/i);
    expect(keyConcepts).toMatch(/behavior POLLER/i);
    expect(keyConcepts).toMatch(/SCRIPT_WORKER/i);
    expect(keyConcepts).toMatch(/LINEAR/i);
    expect(keyConcepts).toMatch(/HOSTED_WORKER/i);
    expect(keyConcepts).toMatch(/bounded backoff/i);
    expect(keyConcepts).toMatch(/requestId/i);
    expect(keyConcepts).toMatch(/idempotent/i);
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut|later story/i,
    );
    expect(howToUse).toMatch(/POLLER_WORKER/i);
    expect(howToUse).toMatch(/auth\.secretRef/i);
    expect(howToUse).toMatch(/behavior POLLER/i);
    expect(howToUse).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut|later story/i,
    );
    expect(ownershipWorker).toMatch(/POLLER_WORKER/);
    expect(ownershipWorker).toMatch(/provider/i);
    expect(ownershipWorker).toMatch(/auth\.secretRef/i);
    expect(ownershipWorker).toMatch(/pollInterval/i);
    expect(ownershipWorker).toMatch(/mapping/i);
    expect(ownershipWorkstation).toMatch(/behavior POLLER/i);
    expect(ownershipWorkstation).toMatch(/worker binding/i);
    expect(ownershipWorkstation).toMatch(/outputs/i);
    expect(ownershipWorkstation).toMatch(/onFailure/i);
    expect(lifecycle).toMatch(/external ingress loop/i);
    expect(lifecycle).toMatch(/bounded backoff/i);
    expect(lifecycle).toMatch(/shutdown/i);
    expect(idempotency).toMatch(/stable non-empty requestId/i);
    expect(idempotency).toMatch(/idempotent no-op/i);
    expect(idempotency).toMatch(/FACTORY_REQUEST_BATCH|submissions/i);
    expect(secretCaution).toMatch(/auth\.secretRef/i);
    expect(secretCaution).toMatch(/Never put inline/i);
    expect(minimalWorker).toMatch(/POLLER_WORKER/);
    expect(minimalWorker).toMatch(/provider:\s*LINEAR/);
    expect(minimalWorker).toMatch(/secretRef:\s*secrets\/linear-api-key/);
    expect(minimalWorker).toMatch(/pollInterval:\s*2m/);
    expect(minimalWorkstation).toMatch(/behavior":\s*"POLLER"/);
    expect(minimalWorkstation).toMatch(/linear-poller/);
    expect(minimalWorkstation).toMatch(/onFailure/);
    expect(limits).toMatch(/Never put inline credentials/i);
    expect(limits).toMatch(/Raw factory event emission/i);
    expect(limits).toMatch(/multi-instance poller coordination/i);
    expect(limits).toMatch(/not Submitting work/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut|later story/i,
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
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    const body = document.body.textContent ?? "";
    expect(body).toMatch(/POLLER_WORKER/i);
    expect(body).toMatch(/you-agent-factory/i);
    expect(body).toMatch(/Put it on the worker/i);
    expect(body).toMatch(/Put it on the workstation/i);
    expect(body).toMatch(/bounded backoff/i);
    expect(body).toMatch(/provider:\s*LINEAR/);
    expect(body).toMatch(/secretRef:\s*secrets\/linear-api-key/);
    expect(body).toMatch(/behavior":\s*"POLLER"/);
    expect(body).toMatch(/stable non-empty requestId/i);
    expect(body).toMatch(/idempotent no-op/i);
    expect(body).toMatch(/Never put inline/i);
    expect(body).toMatch(/auth\.secretRef/i);
    expect(body).not.toMatch(/Model Atlas/i);

    expect(
      screen.getByRole("link", { name: "Workers" }).getAttribute("href"),
    ).toBe("/docs/documentation/workers");
    expect(
      screen.getByRole("link", { name: "Workstations" }).getAttribute("href"),
    ).toBe("/docs/documentation/workstations");
    expect(
      screen
        .getByRole("link", { name: "Submitting work" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/submitting-work");
    expect(
      screen.getByRole("link", { name: "Logs" }).getAttribute("href"),
    ).toBe("/docs/documentation/logs");
    expect(
      screen
        .getByRole("link", { name: "Troubleshooting" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/troubleshooting");
    expect(
      screen.getByRole("link", { name: "Script workers" }).getAttribute("href"),
    ).toBe("/docs/documentation/script-workers");
  });

  test("ships ja locale messages with the same key shape as en", async () => {
    const loadedPage = await loadLocalDocsPage(
      {
        section: "documentation",
        slug: "poller-workers",
      },
      "ja",
    );

    expect(loadedPage.messages.title).toBe("Poller workers");
    expect(loadedPage.messages.sections?.whatItCovers?.title).toBeTruthy();
    expect(loadedPage.messages.sections?.keyConcepts?.title).toBeTruthy();
    expect(loadedPage.messages.sections?.howToUse?.title).toBeTruthy();
    expect(
      loadedPage.messages.sections?.limitsAndAssumptions?.title,
    ).toBeTruthy();
    expect(loadedPage.messages.sections?.related?.title).toBeTruthy();
    expect(loadedPage.messages.links?.workersDocs).toBe("Workers");
    expect(loadedPage.messages.links?.scriptWorkersDocs).toBe("Script workers");

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
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Workers" }).getAttribute("href"),
    ).toBe("/docs/documentation/workers");
  });
});
