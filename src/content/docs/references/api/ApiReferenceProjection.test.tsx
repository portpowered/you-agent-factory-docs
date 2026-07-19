/**
 * Page-owned render proof for the published OpenAPI projection mount.
 * Asserts Fumadocs-primary operation rendering, navigation, anchors,
 * static-only policy, and accessible empty/invalid outcomes without scanning
 * foreign renderer inventories. Full fumadocs-openapi SSR is stubbed under
 * happy-dom; browser probes cover the real createAPIPage path.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import type { ApiPageProps } from "fumadocs-openapi/ui";
import type { ReactNode } from "react";
import {
  API_FUMADOCS_OPERATION_ATTR,
  API_FUMADOCS_OPERATIONS_ATTR,
  API_LOCAL_SERVER_BASE_URL_ATTR,
  API_LOCAL_SERVER_DOCS_HOST_DISCLAIMER,
  API_OPERATION_ANCHOR_ATTR,
  API_OPERATION_FILTER_ATTR,
  API_OPERATION_NAV_ATTR,
  API_OPERATION_NAV_LINK_ATTR,
  API_OPERATION_SECTION_ATTR,
  API_PLAYGROUND_OPTIONS,
  API_PLAYGROUND_SUPPRESSED_ATTR,
  API_PROXY_POLICY,
  API_REFERENCE_PAGE_PATH,
  API_UI_STATUS_DEFAULT_MESSAGES,
  API_UI_STATUS_DEFAULT_TITLES,
  type ApiLocalServerBaseUrlProjection,
  type ApiOperationDetailProjection,
  type ApiOperationNavigationProjection,
  assertsNoApiProxyUrl,
  buildApiLocalServerBaseUrlFromArtifact,
  buildApiOperationNavigationFromArtifact,
  isApiPlaygroundSuppressed,
} from "@/components/references/api";
import {
  type ApiReferenceProjectionLoaders,
  ApiReferenceProjectionView,
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

function stubApiPagePropsFromNavigation(
  navigation: ApiOperationNavigationProjection,
): ApiPageProps {
  return {
    document: "you-agent-factory-api",
    operations: navigation.model.groups.flatMap((group) =>
      group.items.map((item) => ({
        method: item.method.toLowerCase() as NonNullable<
          ApiPageProps["operations"]
        >[number]["method"],
        path: item.path,
      })),
    ),
  };
}

function stubRenderApiPage(
  props: ApiPageProps,
  navigation: ApiOperationNavigationProjection,
): ReactNode {
  const operations = props.operations ?? [];
  const anchorByKey = new Map<string, string>(
    navigation.model.groups.flatMap((group) =>
      group.items.map((item) => [`${item.method}:${item.path}`, item.anchor]),
    ),
  );
  return (
    <div {...{ [API_FUMADOCS_OPERATIONS_ATTR]: "true" }}>
      {operations.map((item) => {
        const key = `${item.method}:${item.path}`;
        const anchor = anchorByKey.get(key) ?? key;
        return (
          <section
            key={key}
            id={anchor}
            tabIndex={-1}
            {...{
              [API_OPERATION_SECTION_ATTR]: "",
              [API_OPERATION_ANCHOR_ATTR]: anchor,
              [API_FUMADOCS_OPERATION_ATTR]: anchor,
            }}
            data-api-operation-method={item.method}
            data-api-operation-path={item.path}
          >
            <code>
              {item.method.toUpperCase()} {item.path}
            </code>
          </section>
        );
      })}
    </div>
  );
}

function readyStubBundle(): {
  navigation: ApiOperationNavigationProjection;
  apiPageProps: ApiPageProps;
} {
  const navigation = buildApiOperationNavigationFromArtifact();
  return {
    navigation,
    apiPageProps: stubApiPagePropsFromNavigation(navigation),
  };
}

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
    "mounts Fumadocs-primary operations with tag navigation on the ready path",
    () => {
      const { navigation, apiPageProps } = readyStubBundle();
      expect(navigation.model.operationCount).toBeGreaterThan(0);

      const state = resolveApiReferenceProjectionState({
        buildNavigation: () => navigation,
        buildDetails: (): ApiOperationDetailProjection => ({
          details: [],
          byAnchor: new Map(),
          operationCount: navigation.model.operationCount,
          operationsWithAuthoredExamples: 0,
          operationsWithEventStream: 0,
          specifier: "@you-agent-factory/api/openapi",
        }),
        buildLocalServer: buildApiLocalServerBaseUrlFromArtifact,
      });
      expect(state.status).toBe("ready");

      const { container } = render(
        <ApiReferenceProjectionView
          state={state}
          apiPageProps={apiPageProps}
          renderApiPage={(props) => stubRenderApiPage(props, navigation)}
        />,
      );

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
      expect(
        container.querySelector(`[${API_FUMADOCS_OPERATIONS_ATTR}]`),
      ).not.toBeNull();

      const sections = container.querySelectorAll(
        `[${API_OPERATION_SECTION_ATTR}]`,
      );
      expect(sections.length).toBe(navigation.model.operationCount);

      for (const item of navigation.model.groups.flatMap(
        (group) => group.items,
      )) {
        const section = container.querySelector(`#${CSS.escape(item.anchor)}`);
        expect(section).not.toBeNull();
        expect(section?.getAttribute(API_FUMADOCS_OPERATION_ATTR)).toBe(
          item.anchor,
        );

        const navLinks = container.querySelectorAll(
          `[${API_OPERATION_NAV_LINK_ATTR}][href="#${item.anchor}"]`,
        );
        expect(navLinks.length).toBeGreaterThan(0);
      }

      expect(API_REFERENCE_PAGE_PATH).toBe("/docs/references/api");
    },
    PROJECTION_RENDER_TIMEOUT_MS,
  );

  test(
    "enforces static-only policy on the published Fumadocs mount",
    () => {
      expect(isApiPlaygroundSuppressed(API_PLAYGROUND_OPTIONS)).toBe(true);
      expect(assertsNoApiProxyUrl(API_PROXY_POLICY)).toBe(true);

      const { primary } = buildApiLocalServerBaseUrlFromArtifact();
      expect(primary).toBeDefined();
      if (primary === undefined) {
        throw new Error("expected packaged OpenAPI servers entry");
      }

      const { navigation, apiPageProps } = readyStubBundle();
      const state = resolveApiReferenceProjectionState({
        buildNavigation: () => navigation,
        buildDetails: (): ApiOperationDetailProjection => ({
          details: [],
          byAnchor: new Map(),
          operationCount: navigation.model.operationCount,
          operationsWithAuthoredExamples: 0,
          operationsWithEventStream: 0,
          specifier: "@you-agent-factory/api/openapi",
        }),
        buildLocalServer: buildApiLocalServerBaseUrlFromArtifact,
      });

      const { container } = render(
        <ApiReferenceProjectionView
          state={state}
          apiPageProps={apiPageProps}
          renderApiPage={(props) => stubRenderApiPage(props, navigation)}
        />,
      );
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
    },
    PROJECTION_RENDER_TIMEOUT_MS,
  );

  test("renders accessible empty status when the projection has no operations", () => {
    render(<ApiReferenceProjectionView state={{ status: "empty" }} />);

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
    render(<ApiReferenceProjectionView state={{ status: "invalid" }} />);

    const status = screen.getByRole("status");
    expect(status.getAttribute("data-api-status")).toBe("invalid");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toContain(API_UI_STATUS_DEFAULT_TITLES.invalid);
    expect(status.textContent).toContain(
      API_UI_STATUS_DEFAULT_MESSAGES.invalid,
    );
    expect(screen.queryByTestId("api-reference-projection")).toBeTruthy();
    expect(document.querySelector("[data-api-operation-navigator]")).toBeNull();
    expect(
      document.querySelectorAll(`[${API_FUMADOCS_OPERATIONS_ATTR}]`).length,
    ).toBe(0);
  });

  test("renders accessible invalid status when Fumadocs props are missing on ready state", () => {
    const state = resolveApiReferenceProjectionState();
    expect(state.status).toBe("ready");

    render(
      <ApiReferenceProjectionView state={state} apiPageProps={undefined} />,
    );

    const status = screen.getByRole("status");
    expect(status.getAttribute("data-api-status")).toBe("invalid");
    expect(status.textContent).toContain(API_UI_STATUS_DEFAULT_TITLES.invalid);
  });
});
