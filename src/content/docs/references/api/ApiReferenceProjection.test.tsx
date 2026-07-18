/**
 * Page-owned render proof for the published OpenAPI projection mount.
 * Asserts success / non-success surface states, navigation, operation
 * sections, anchors, filter chrome, static-only policy, and hybrid SSE
 * summaries without scanning foreign renderer inventories.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import {
  API_EVENTS_REFERENCE_PAGE_PATH,
  API_LOCAL_SERVER_BASE_URL_ATTR,
  API_LOCAL_SERVER_DOCS_HOST_DISCLAIMER,
  API_OPERATION_ANCHOR_ATTR,
  API_OPERATION_COPY_LINK_ATTR,
  API_OPERATION_FILTER_ATTR,
  API_OPERATION_NAV_ATTR,
  API_OPERATION_NAV_LINK_ATTR,
  API_OPERATION_SECTION_ATTR,
  API_PLAYGROUND_OPTIONS,
  API_PLAYGROUND_SUPPRESSED_ATTR,
  API_PROXY_POLICY,
  API_REFERENCE_PAGE_PATH,
  API_SSE_OPERATIONS,
  API_SSE_ROLE_ATTR,
  API_SSE_SUMMARY_ATTR,
  API_UI_STATUS_DEFAULT_MESSAGES,
  API_UI_STATUS_DEFAULT_TITLES,
  type ApiLocalServerBaseUrlProjection,
  type ApiOperationDetailProjection,
  type ApiOperationNavigationProjection,
  apiOperationAnchorUrl,
  assertsNoApiProxyUrl,
  buildApiLocalServerBaseUrlFromArtifact,
  buildApiOperationNavigationFromArtifact,
  isApiPlaygroundSuppressed,
} from "@/components/references/api";
import {
  ApiReferenceProjection,
  type ApiReferenceProjectionLoaders,
  resolveApiReferenceProjectionState,
} from "./ApiReferenceProjection";

// Artifact load + full projection render can exceed Bun's 5s default.
const PROJECTION_RENDER_TIMEOUT_MS = 60_000;

function emptyNavigationProjection(): ApiOperationNavigationProjection {
  return {
    model: { groups: [], linkCount: 0, operationCount: 0 },
    normalizedOperationCount: 0,
    documentTagOrder: [],
    specifier: "@you-agent-factory/api/openapi",
  };
}

function failingLoaders(
  overrides: Partial<ApiReferenceProjectionLoaders> = {},
): ApiReferenceProjectionLoaders {
  const boom = (): never => {
    throw new Error("forced OpenAPI projection failure");
  };
  return {
    buildNavigation: boom,
    buildDetails: boom,
    buildLocalServer: boom,
    ...overrides,
  };
}

const EXPECTED_SSE_OPS = [
  {
    operationId: "getEventsBySessionId",
    role: "canonical",
    eventsAnchor: "components-schemas-FactoryEvent",
  },
  {
    operationId: "getFactoryResponseEventsBySessionId",
    role: "ephemeral",
    eventsAnchor: "components-schemas-FactoryResponseEvent",
  },
  {
    operationId: "getEvents",
    role: "compatibility-only",
    eventsAnchor: "components-schemas-FactoryEvent",
  },
] as const;

const SSE_SEMANTICS_FIELDS = [
  "transport",
  "reconnect",
  "cursorPrecedence",
  "handshakeHeaders",
  "dualAccept",
  "replayRetainedHistory",
  "compatibilityOnlyStatus",
] as const;

describe("ApiReferenceProjection", () => {
  afterEach(() => {
    cleanup();
  });

  test("resolveApiReferenceProjectionState returns ready for the packaged artifact", () => {
    const state = resolveApiReferenceProjectionState();
    expect(state.status).toBe("ready");
    if (state.status !== "ready") {
      throw new Error("expected ready projection state");
    }
    expect(state.model.operationCount).toBeGreaterThan(0);
    expect(state.byAnchor.size).toBeGreaterThan(0);
  });

  test("resolveApiReferenceProjectionState returns empty when no operations publish", () => {
    const state = resolveApiReferenceProjectionState({
      buildNavigation: emptyNavigationProjection,
      buildDetails: (): ApiOperationDetailProjection => {
        throw new Error("details should not load for empty navigation");
      },
      buildLocalServer: (): ApiLocalServerBaseUrlProjection => {
        throw new Error("local server should not load for empty navigation");
      },
    });
    expect(state).toEqual({ status: "empty" });
  });

  test("resolveApiReferenceProjectionState returns invalid when loaders throw", () => {
    expect(resolveApiReferenceProjectionState(failingLoaders())).toEqual({
      status: "invalid",
    });
  });

  test(
    "mounts the ready API surface with tag navigation and all operations",
    () => {
      const { model } = buildApiOperationNavigationFromArtifact();
      expect(model.operationCount).toBeGreaterThan(0);

      const { container } = render(<ApiReferenceProjection />);

      const surface = screen.getByTestId("api-surface");
      expect(surface.getAttribute("data-api-status")).toBe("ready");
      expect(screen.queryByTestId("api-status")).toBeNull();

      const root = screen.getByTestId("api-reference-projection");
      expect(root).toBeTruthy();
      expect(root.getAttribute(API_PLAYGROUND_SUPPRESSED_ATTR)).toBe("true");

      expect(
        container.querySelector(`[${API_OPERATION_NAV_ATTR}]`),
      ).not.toBeNull();
      expect(
        container.querySelector(`[${API_OPERATION_FILTER_ATTR}]`),
      ).not.toBeNull();

      const sections = container.querySelectorAll(
        `[${API_OPERATION_SECTION_ATTR}]`,
      );
      expect(sections.length).toBe(model.operationCount);

      for (const item of model.groups.flatMap((group) => group.items)) {
        const section = container.querySelector(`#${CSS.escape(item.anchor)}`);
        expect(section).not.toBeNull();
        expect(section?.getAttribute(API_OPERATION_ANCHOR_ATTR)).toBe(
          item.anchor,
        );

        const expectedUrl = apiOperationAnchorUrl(
          item.anchor,
          API_REFERENCE_PAGE_PATH,
        );
        const copyControl = section?.querySelector(
          `[${API_OPERATION_COPY_LINK_ATTR}="${item.anchor}"]`,
        );
        expect(copyControl).not.toBeNull();
        expect(
          section
            ?.querySelector("[data-api-operation-copy-value]")
            ?.getAttribute("data-api-operation-copy-value"),
        ).toBe(expectedUrl);

        const navLinks = container.querySelectorAll(
          `[${API_OPERATION_NAV_LINK_ATTR}][href="#${item.anchor}"]`,
        );
        expect(navLinks.length).toBeGreaterThan(0);
      }
    },
    PROJECTION_RENDER_TIMEOUT_MS,
  );

  test(
    "enforces static-only policy and hybrid SSE summaries on the published mount",
    () => {
      expect(isApiPlaygroundSuppressed(API_PLAYGROUND_OPTIONS)).toBe(true);
      expect(assertsNoApiProxyUrl(API_PROXY_POLICY)).toBe(true);
      expect(API_SSE_OPERATIONS).toHaveLength(3);

      const { primary } = buildApiLocalServerBaseUrlFromArtifact();
      expect(primary).toBeDefined();
      if (primary === undefined) {
        throw new Error("expected packaged OpenAPI servers entry");
      }

      const { container } = render(<ApiReferenceProjection />);
      const root = screen.getByTestId("api-reference-projection");

      expect(root.getAttribute(API_PLAYGROUND_SUPPRESSED_ATTR)).toBe("true");

      const notice = container.querySelector(
        `[${API_LOCAL_SERVER_BASE_URL_ATTR}]`,
      );
      expect(notice).not.toBeNull();
      expect(notice?.getAttribute(API_LOCAL_SERVER_BASE_URL_ATTR)).toBe(
        primary.url,
      );
      expect(
        container.querySelector("[data-api-local-server-url]")?.textContent,
      ).toBe(primary.url);
      expect(
        container.querySelector("[data-api-local-server-docs-host-disclaimer]")
          ?.textContent,
      ).toBe(API_LOCAL_SERVER_DOCS_HOST_DISCLAIMER);
      expect(
        container.querySelector("[data-api-static-examples-note]"),
      ).not.toBeNull();

      const sendButtons = Array.from(
        container.querySelectorAll("button, [role='button']"),
      ).filter((el) => /^\s*Send\s*$/i.test(el.textContent ?? ""));
      const tryIt = Array.from(
        container.querySelectorAll("button, [role='button'], a"),
      ).filter((el) => /try\s*it/i.test(el.textContent ?? ""));
      expect(sendButtons).toHaveLength(0);
      expect(tryIt).toHaveLength(0);
      expect(container.querySelectorAll('input[type="password"]').length).toBe(
        0,
      );
      expect(container.querySelectorAll('button[type="submit"]').length).toBe(
        0,
      );

      const summaries = container.querySelectorAll(`[${API_SSE_SUMMARY_ATTR}]`);
      expect(summaries.length).toBe(3);

      for (const expected of EXPECTED_SSE_OPS) {
        const panel = container.querySelector(
          `[${API_SSE_SUMMARY_ATTR}="${expected.operationId}"]`,
        );
        expect(panel).not.toBeNull();
        expect(panel?.getAttribute(API_SSE_ROLE_ATTR)).toBe(expected.role);
        expect(panel?.getAttribute("data-api-sse-live-connection")).toBe(
          "false",
        );
        expect(panel?.getAttribute("data-api-sse-full-catalog")).toBe("false");

        for (const field of SSE_SEMANTICS_FIELDS) {
          expect(
            panel?.querySelector(`[data-api-sse-semantics-field="${field}"]`),
          ).not.toBeNull();
        }

        const eventsLink = panel?.querySelector(
          `[data-api-sse-events-link="${expected.eventsAnchor}"]`,
        );
        expect(eventsLink?.getAttribute("href")).toBe(
          `${API_EVENTS_REFERENCE_PAGE_PATH}#${expected.eventsAnchor}`,
        );

        if (expected.role === "compatibility-only") {
          expect(panel?.getAttribute("data-api-sse-preferred")).toBe("false");
          expect(
            panel?.querySelector("[data-api-sse-never-preferred]"),
          ).not.toBeNull();
        }
        if (expected.role === "canonical") {
          expect(panel?.getAttribute("data-api-sse-preferred")).toBe("true");
        }
      }

      expect(
        container.querySelector(
          '[data-api-operation-id="submitWorkBySessionId"] [data-api-sse-summary]',
        ),
      ).toBeNull();
      expect(
        container.querySelectorAll(
          "[data-sse-catalog-section],[data-event-catalog-envelope]",
        ).length,
      ).toBe(0);
      expect(
        container.querySelectorAll("[data-api-sse-live-connection='true']")
          .length,
      ).toBe(0);
    },
    PROJECTION_RENDER_TIMEOUT_MS,
  );

  test("renders accessible empty status when the projection has no operations", () => {
    render(
      <ApiReferenceProjection
        loaders={{
          buildNavigation: emptyNavigationProjection,
          buildDetails: (): ApiOperationDetailProjection => {
            throw new Error("details should not load for empty navigation");
          },
          buildLocalServer: (): ApiLocalServerBaseUrlProjection => {
            throw new Error(
              "local server should not load for empty navigation",
            );
          },
        }}
      />,
    );

    const status = screen.getByRole("status");
    expect(status.getAttribute("data-api-status")).toBe("empty");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toContain(API_UI_STATUS_DEFAULT_TITLES.empty);
    expect(status.textContent).toContain(API_UI_STATUS_DEFAULT_MESSAGES.empty);
    expect(screen.queryByTestId("api-reference-projection")).toBeTruthy();
    expect(document.querySelector("[data-api-operation-navigator]")).toBeNull();
    expect(
      document.querySelectorAll("[data-api-operation-section]").length,
    ).toBe(0);
  });

  test("renders accessible invalid status when the OpenAPI projection cannot load", () => {
    render(<ApiReferenceProjection loaders={failingLoaders()} />);

    const status = screen.getByRole("status");
    expect(status.getAttribute("data-api-status")).toBe("invalid");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toContain(API_UI_STATUS_DEFAULT_TITLES.invalid);
    expect(status.textContent).toContain(
      API_UI_STATUS_DEFAULT_MESSAGES.invalid,
    );
    expect(screen.queryByTestId("api-reference-projection")).toBeTruthy();
    expect(document.querySelector("[data-api-operation-navigator]")).toBeNull();
    expect(document.querySelectorAll("[data-api-sse-summary]").length).toBe(0);
  });
});
