/**
 * Page-owned render proof for references/events.
 * Covers reference route presence, frontmatter/registry alignment, section
 * copy, related discovery links, and the published EventsSurface corpus mount
 * (stream roles + FactoryEvent / FactoryResponseEvent catalogs). Colocated
 * under the page bundle.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import {
  isLocalDocsCatchAllSlug,
  loadLocalDocsPage,
  parseLocalDocsPageRef,
} from "@/lib/content/local-docs-page";
import { LOCKED_EVENT_STREAM_PLACEMENT } from "@/lib/references/events";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 60_000;

describe("events reference page shell", () => {
  afterEach(() => {
    cleanup();
  });

  test("parses references local-docs refs for the events page", () => {
    expect(parseLocalDocsPageRef(["references", "events"])).toEqual({
      section: "references",
      slug: "events",
    });
    expect(isLocalDocsCatchAllSlug(["references", "events"])).toBe(true);
    expect(parseLocalDocsPageRef(["unknown", "events"])).toBeNull();
  });

  test(
    "publishes /docs/references/events with the mounted event corpus",
    async () => {
      const fumadocsPage = source.getPage(["references", "events"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/references/events");

      const loadedPage = await loadLocalDocsPage({
        section: "references",
        slug: "events",
      });

      expect(loadedPage.frontmatter.kind).toBe("reference");
      expect(loadedPage.frontmatter.registryId).toBe("reference.events");
      expect(loadedPage.messages.title).toBe("Events");
      expect(loadedPage.messages.description).toMatch(
        /FactoryEvent and FactoryResponseEvent/i,
      );
      expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

      const whatItCovers = String(
        loadedPage.messages.sections?.whatItCovers?.body ?? "",
      );
      const keyConcepts = String(
        loadedPage.messages.sections?.keyConcepts?.body ?? "",
      );
      const eventCorpus = String(
        loadedPage.messages.sections?.eventCorpus?.body ?? "",
      );
      const howToUse = String(
        loadedPage.messages.sections?.howToUse?.body ?? "",
      );
      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );
      expect(whatItCovers).toMatch(/FactoryEvent and FactoryResponseEvent/i);
      expect(whatItCovers).toMatch(/stream-role labeling/i);
      expect(whatItCovers).toMatch(
        /HTTP transport mechanics stay with the API/i,
      );
      expect(keyConcepts).toMatch(/Hybrid placement/i);
      expect(eventCorpus).toMatch(/packaged OpenAPI/i);
      expect(eventCorpus).toMatch(/three stream operations/i);
      expect(eventCorpus).toMatch(/FactoryEvent envelope/i);
      expect(eventCorpus).toMatch(/FactoryResponseEvent envelope/i);
      expect(eventCorpus).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(howToUse).toMatch(/durable event-stream lookup/i);
      expect(limits).toMatch(/static hybrid events reference/i);
      expect(limits).toMatch(/does not open a live EventSource/i);
      expect(limits).toMatch(/does not re-implement the API OpenAPI UI/i);
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(keyConcepts).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(howToUse).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(limits).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);

      const links = loadedPage.messages.links as
        | Record<string, string>
        | undefined;
      expect(links?.apiReference).toMatch(/API reference/i);

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
      expect(
        screen.getByRole("heading", { name: "Key Concepts" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Event Corpus" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();

      const related = document.getElementById("related");
      expect(related).toBeTruthy();
      const relatedQueries = within(related as HTMLElement);
      expect(
        relatedQueries
          .getByRole("link", { name: "API reference" })
          .getAttribute("href"),
      ).toBe("/docs/references/api");

      const mount = screen.getByTestId("events-corpus-mount");
      expect(mount.getAttribute("data-events-page-path")).toBe(
        "/docs/references/events",
      );

      const surface = screen.getByTestId("events-surface");
      expect(surface.getAttribute("data-events-status")).toBe("success");
      expect(surface.getAttribute("data-events-ownership")).toBe(
        "w09-production",
      );
      expect(surface.getAttribute("data-events-placement")).toBe(
        LOCKED_EVENT_STREAM_PLACEMENT,
      );
      expect(surface.getAttribute("data-events-asyncapi-permanent-pin")).toBe(
        "false",
      );

      const operations = screen.getByTestId("event-stream-operations-list");
      expect(operations.getAttribute("data-event-stream-count")).toBe("3");
      expect(
        screen.getByText("Canonical session-scoped FactoryEvent stream"),
      ).toBeTruthy();
      expect(
        screen.getByText("Ephemeral FactoryResponseEvent stream"),
      ).toBeTruthy();
      expect(
        screen.getByText(
          "Compatibility-only process-global FactoryEvent stream",
        ),
      ).toBeTruthy();
      expect(
        screen.getByText("/factory-sessions/{session_id}/events"),
      ).toBeTruthy();
      expect(
        screen.getByText("/factory-sessions/{session_id}/response-events"),
      ).toBeTruthy();
      expect(screen.getByText("/events")).toBeTruthy();

      const factoryEventCatalog = screen.getByTestId(
        "factory-event-catalog-section",
      );
      expect(factoryEventCatalog.getAttribute("data-event-catalog")).toBe(
        "FactoryEvent",
      );
      expect(
        Number(
          factoryEventCatalog.getAttribute("data-event-catalog-mapping-count"),
        ),
      ).toBeGreaterThan(0);

      const factoryResponseCatalog = screen.getByTestId(
        "factory-response-event-catalog-section",
      );
      expect(factoryResponseCatalog.getAttribute("data-event-catalog")).toBe(
        "FactoryResponseEvent",
      );
      expect(
        factoryResponseCatalog.getAttribute("data-event-cartesian-valid"),
      ).toBe("false");
      expect(factoryResponseCatalog.getAttribute("data-event-ephemeral")).toBe(
        "true",
      );
      expect(
        Number(
          factoryResponseCatalog.getAttribute(
            "data-event-catalog-payload-count",
          ),
        ),
      ).toBeGreaterThan(0);

      const bodyText = document.body.textContent ?? "";
      expect(bodyText).toMatch(/FactoryEvent and FactoryResponseEvent/i);
      expect(bodyText).toMatch(/Hybrid placement/i);
      expect(bodyText).toMatch(/never preferred/i);
      expect(bodyText).not.toMatch(/Model Atlas/i);
      expect(bodyText).not.toMatch(/Non-production events renderer harness/i);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
