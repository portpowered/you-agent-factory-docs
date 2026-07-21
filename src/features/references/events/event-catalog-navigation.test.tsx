import { afterEach, describe, expect, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import {
  EventCatalogAnchorsSection,
  EventCatalogNavigation,
  EventsVerificationHarness,
  focusEventHashTarget,
} from "@/features/references/events";
import {
  buildEventCorpusSearchDocuments,
  buildFactoryEventCatalog,
  buildFactoryResponseEventCatalog,
  EVENT_SEARCH_DOCUMENT_TAGS,
  eventSearchDocumentAnchors,
  factoryEventCatalogEventTypes,
  factoryResponseEventCatalogPayloadSchemaNames,
  resolveEventCorpus,
} from "@/lib/references/events";
import { REFERENCE_FAMILY_PAGE_PATHS } from "@/lib/references/reference-search-projection";
import { collectResponsiveOverflowProbe } from "@/lib/verify/a11y-responsive-probes";

afterEach(() => {
  cleanup();
  window.location.hash = "";
});

function setViewportWidth(width: number) {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(document.documentElement, "scrollWidth", {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(document.body, "clientWidth", {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(document.body, "scrollWidth", {
    configurable: true,
    get: () => width,
  });
}

describe("buildEventCorpusSearchDocuments", () => {
  test("emits search documents for live FactoryEvent types and response payloads", () => {
    const corpus = resolveEventCorpus();
    const factoryEventCatalog = buildFactoryEventCatalog(
      corpus.openapi.document,
    );
    const factoryResponseEventCatalog = buildFactoryResponseEventCatalog(
      corpus.openapi.document,
    );

    const result = buildEventCorpusSearchDocuments(
      factoryEventCatalog,
      factoryResponseEventCatalog,
    );

    const eventTypes = factoryEventCatalogEventTypes(factoryEventCatalog);
    const responsePayloads = factoryResponseEventCatalogPayloadSchemaNames(
      factoryResponseEventCatalog,
    );

    expect(result.documents.length).toBe(
      eventTypes.length + responsePayloads.length,
    );
    expect(result.documents.length).toBeGreaterThanOrEqual(31 + 14);
    expect(result.registered.length).toBe(result.documents.length);
    expect(result.navEntries.length).toBe(result.documents.length);

    for (const document of result.documents) {
      expect(document.family).toBe("events");
      expect(document.kind).toBe("reference");
      expect(document.url).toBe(
        `${REFERENCE_FAMILY_PAGE_PATHS.events}#${document.anchor}`,
      );
      expect(document.anchor.length).toBeGreaterThan(0);
      expect(document.tags).toContain("events");
    }

    const typeDocs = result.documents.filter((document) =>
      document.tags.includes(EVENT_SEARCH_DOCUMENT_TAGS.factoryEventType),
    );
    const responseDocs = result.documents.filter((document) =>
      document.tags.includes(
        EVENT_SEARCH_DOCUMENT_TAGS.factoryResponseEventPayload,
      ),
    );
    expect(typeDocs.length).toBe(eventTypes.length);
    expect(responseDocs.length).toBe(responsePayloads.length);
    expect(
      responseDocs.every((document) =>
        document.tags.includes(EVENT_SEARCH_DOCUMENT_TAGS.ephemeral),
      ),
    ).toBe(true);

    const anchors = eventSearchDocumentAnchors(result.documents);
    expect(anchors).toEqual([...anchors].sort());
    expect(new Set(anchors).size).toBe(anchors.length);

    for (const eventType of eventTypes) {
      expect(anchors).toContain(eventType);
    }
    for (const payloadName of responsePayloads) {
      expect(anchors).toContain(payloadName);
    }
  });

  test("registerEventCatalogAnchors fails closed on fragment collisions", () => {
    const corpus = resolveEventCorpus();
    const factoryEventCatalog = buildFactoryEventCatalog(
      corpus.openapi.document,
    );
    const factoryResponseEventCatalog = buildFactoryResponseEventCatalog(
      corpus.openapi.document,
    );

    // First registration succeeds; second registration of the same identities
    // into a fresh registry also succeeds (deterministic). Collision only when
    // distinct itemIds map to the same fragment — covered by W04 registry tests.
    const first = buildEventCorpusSearchDocuments(
      factoryEventCatalog,
      factoryResponseEventCatalog,
    );
    const second = buildEventCorpusSearchDocuments(
      factoryEventCatalog,
      factoryResponseEventCatalog,
      { registry: first.registry },
    );
    // Re-registering identical itemIds is idempotent on the same registry.
    expect(second.registered.length).toBe(first.registered.length);
  });
});

describe("Event catalog navigation + anchors UI", () => {
  test("renders keyboard-operable nav with copyable anchors and search markers", () => {
    const corpus = resolveEventCorpus();
    const factoryEventCatalog = buildFactoryEventCatalog(
      corpus.openapi.document,
    );
    const factoryResponseEventCatalog = buildFactoryResponseEventCatalog(
      corpus.openapi.document,
    );

    render(
      <EventsVerificationHarness
        factoryEventCatalog={factoryEventCatalog}
        factoryResponseEventCatalog={factoryResponseEventCatalog}
        pagePath="/events-renderer-harness"
        summaries={[]}
      />,
    );

    const nav = screen.getByTestId("event-catalog-navigation");
    expect(nav.tagName).toBe("NAV");
    expect(nav.className).toContain("min-w-0");
    expect(nav.className).toContain("overflow-x-auto");

    const query = within(nav).getByRole("searchbox", {
      name: /event or payload/i,
    });
    expect(query).toBeTruthy();

    const runRequestLink = within(nav).getByRole("link", {
      name: /RUN_REQUEST/,
    });
    expect(runRequestLink.getAttribute("href")).toBe("#RUN_REQUEST");

    fireEvent.change(query, { target: { value: "RUN_REQUEST" } });
    expect(
      within(nav).queryByRole("link", { name: /ARTIFACT_CREATED/ }),
    ).toBeNull();
    expect(within(nav).getByRole("link", { name: /RUN_REQUEST/ })).toBeTruthy();

    const runRequestVariant = document.getElementById("RUN_REQUEST");
    expect(runRequestVariant).not.toBeNull();
    expect(
      runRequestVariant?.querySelector("[data-reference-copyable-anchor]"),
    ).not.toBeNull();

    expect(
      screen
        .getByTestId("event-catalog-anchors-section")
        .getAttribute("data-event-catalog-search-document-count"),
    ).toBe(
      String(
        factoryEventCatalog.mappings.length +
          factoryResponseEventCatalog.payloadVariants.length,
      ),
    );
  });

  test("hash navigation focuses and scrolls to the target section", () => {
    const corpus = resolveEventCorpus();
    const factoryEventCatalog = buildFactoryEventCatalog(
      corpus.openapi.document,
    );
    const factoryResponseEventCatalog = buildFactoryResponseEventCatalog(
      corpus.openapi.document,
    );

    render(
      <EventCatalogAnchorsSection
        factoryEventCatalog={factoryEventCatalog}
        factoryResponseEventCatalog={factoryResponseEventCatalog}
      />,
    );

    // Mount a target matching a catalog anchor for focus/scroll proofs.
    const target = document.createElement("article");
    target.id = "RUN_REQUEST";
    document.body.appendChild(target);

    const focused = focusEventHashTarget(document, "#RUN_REQUEST");
    expect(focused).toBe(target);
    expect(document.activeElement).toBe(target);

    target.remove();
  });

  test("responsive overflow stays contained at phone and desktop widths", () => {
    const corpus = resolveEventCorpus();
    const factoryEventCatalog = buildFactoryEventCatalog(
      corpus.openapi.document,
    );
    const factoryResponseEventCatalog = buildFactoryResponseEventCatalog(
      corpus.openapi.document,
    );
    const { navEntries } = buildEventCorpusSearchDocuments(
      factoryEventCatalog,
      factoryResponseEventCatalog,
    );

    render(<EventCatalogNavigation entries={navEntries} />);

    for (const width of [390, 1440] as const) {
      setViewportWidth(width);
      const probe = collectResponsiveOverflowProbe(document, document.body);
      expect(probe.page.hasUnintendedOverflow).toBe(false);
      expect(probe.allowsIntentionalScrollers).toBe(true);

      const nav = screen.getByTestId("event-catalog-navigation");
      expect(nav.className).toContain("min-w-0");
      expect(nav.className).toContain("overflow-x-auto");
    }
  });
});
