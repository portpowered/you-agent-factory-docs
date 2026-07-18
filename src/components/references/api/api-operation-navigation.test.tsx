import { afterEach, describe, expect, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { createOpenApiOperationSummary } from "@/lib/references/family-normalized-models";
import { ApiNavigationVerificationHarness } from "./api-navigation-verification-harness";
import { ApiOperationNavigation } from "./api-operation-navigation";
import { ApiOperationNavigator } from "./api-operation-navigator";
import { ApiReferenceMobileNavigator } from "./api-reference-mobile-navigator";
import {
  API_OPERATION_FILTER_ATTR,
  API_OPERATION_FILTER_EMPTY_TITLE,
  API_OPERATION_FILTER_LABEL,
} from "./operation-filter";
import {
  API_MOBILE_NAV_ATTR,
  API_OPERATION_NAV_ATTR,
  API_OPERATION_NAV_LINK_ATTR,
  buildApiOperationNavModel,
  isApiMobileNavMarkupReady,
  probeApiMobileNavHtml,
} from "./operation-navigation";

afterEach(() => {
  cleanup();
});

function op(
  overrides: Partial<Parameters<typeof createOpenApiOperationSummary>[0]> & {
    id: string;
    method: "get" | "post";
    path: string;
    anchor: string;
  },
) {
  return createOpenApiOperationSummary({
    source: {
      publicArtifactId: "@you-agent-factory/api/openapi",
      pointer: `/paths${overrides.path}`,
    },
    ...overrides,
  });
}

const sampleOps = [
  op({
    id: "submitWorkBySessionId",
    operationId: "submitWorkBySessionId",
    method: "post",
    path: "/factory-sessions/{session_id}/work",
    anchor: "submitWorkBySessionId",
    summary: "Submit work",
    tags: ["Work"],
  }),
  op({
    id: "getEvents",
    operationId: "getEvents",
    method: "get",
    path: "/events",
    anchor: "getEvents",
    summary: "Compatibility event stream",
    tags: ["Runtime"],
  }),
  op({
    id: "listModels",
    operationId: "listModels",
    method: "get",
    path: "/models",
    anchor: "listModels",
    tags: ["Models"],
  }),
];

describe("ApiOperationNavigator", () => {
  test("renders tag groups with deep links to operation anchors", () => {
    const model = buildApiOperationNavModel(sampleOps, [
      "Work",
      "Runtime",
      "Models",
    ]);
    const { container } = render(
      <ApiOperationNavigator groups={model.groups} model={model} />,
    );

    expect(
      container.querySelector(`[${API_OPERATION_NAV_ATTR}]`),
    ).not.toBeNull();
    expect(screen.getByRole("navigation", { name: /API operations by tag/i }));

    const work = container.querySelector('[data-api-operation-nav-tag="Work"]');
    expect(work).not.toBeNull();
    const link = within(work as HTMLElement).getByRole("link", {
      name: /Submit work/i,
    });
    expect(link.getAttribute("href")).toBe("#submitWorkBySessionId");
    expect(link.getAttribute(API_OPERATION_NAV_LINK_ATTR)).toBe(
      "submitWorkBySessionId",
    );

    expect(model.groups.map((g) => g.tag)).toEqual([
      "Work",
      "Runtime",
      "Models",
    ]);
  });
});

describe("ApiReferenceMobileNavigator", () => {
  test("renders collapsed details with tag-grouped deep links", () => {
    const model = buildApiOperationNavModel(sampleOps, [
      "Work",
      "Runtime",
      "Models",
    ]);
    const { container } = render(
      <ApiReferenceMobileNavigator groups={model.groups} model={model} />,
    );

    const details = container.querySelector(
      `details[${API_MOBILE_NAV_ATTR}]`,
    ) as HTMLDetailsElement;
    expect(details).not.toBeNull();
    expect(details.open).toBe(false);

    const probe = probeApiMobileNavHtml(container.innerHTML);
    expect(isApiMobileNavMarkupReady(probe, 3, 3)).toBe(true);

    const link = screen.getByRole("link", {
      name: /Compatibility event stream/i,
    });
    expect(link.getAttribute("href")).toBe("#getEvents");
  });
});

describe("ApiOperationNavigation + harness", () => {
  test("composes desktop and mobile navigators with matching section targets", () => {
    const model = buildApiOperationNavModel(sampleOps, [
      "Work",
      "Runtime",
      "Models",
    ]);
    const { container } = render(
      <ApiNavigationVerificationHarness model={model} />,
    );

    expect(
      container.querySelector('[data-testid="api-operation-navigation"]'),
    ).not.toBeNull();
    expect(
      container.querySelectorAll("[data-api-operation-section]"),
    ).toHaveLength(3);

    for (const item of model.groups.flatMap((g) => g.items)) {
      const section = container.querySelector(`#${CSS.escape(item.anchor)}`);
      expect(section).not.toBeNull();
      expect(section?.getAttribute("data-api-operation-anchor")).toBe(
        item.anchor,
      );
    }

    // Responsive composition mounts both navigators (CSS hides one per viewport).
    expect(
      container.querySelectorAll(`[${API_OPERATION_NAV_LINK_ATTR}]`).length,
    ).toBeGreaterThanOrEqual(3);
  });

  test("ApiOperationNavigation mounts both desktop and mobile hosts", () => {
    const model = buildApiOperationNavModel(sampleOps, ["Work"]);
    const { container } = render(
      <ApiOperationNavigation groups={model.groups} model={model} />,
    );
    expect(
      container.querySelector(`[${API_OPERATION_NAV_ATTR}]`),
    ).not.toBeNull();
    expect(container.querySelector(`[${API_MOBILE_NAV_ATTR}]`)).not.toBeNull();
  });

  test("filters navigation by method, path, summary, and operation ID", () => {
    const model = buildApiOperationNavModel(sampleOps, [
      "Work",
      "Runtime",
      "Models",
    ]);
    const { container } = render(
      <ApiOperationNavigation groups={model.groups} model={model} />,
    );

    const filter = screen.getByRole("searchbox", {
      name: API_OPERATION_FILTER_LABEL,
    });
    expect(
      container.querySelector(`[${API_OPERATION_FILTER_ATTR}]`),
    ).not.toBeNull();

    fireEvent.change(filter, { target: { value: "submitWork" } });
    expect(
      container.querySelectorAll(`[${API_OPERATION_NAV_LINK_ATTR}]`).length,
    ).toBe(2); // desktop + mobile hosts each show the matching link
    expect(screen.getByText(/Showing 1 of 3 operations/i)).toBeTruthy();
    expect(
      screen.getAllByRole("link", { name: /Submit work/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.queryByRole("link", { name: /Compatibility event stream/i }),
    ).toBeNull();

    fireEvent.change(filter, { target: { value: "GET" } });
    expect(screen.getByText(/Showing 2 of 3 operations/i)).toBeTruthy();

    fireEvent.change(filter, { target: { value: "/models" } });
    expect(screen.getByText(/Showing 1 of 3 operations/i)).toBeTruthy();
    expect(
      container.querySelector('[data-api-operation-nav-path="/models"]'),
    ).not.toBeNull();
  });

  test("shows accessible empty state and restores the full set on clear", () => {
    const model = buildApiOperationNavModel(sampleOps, [
      "Work",
      "Runtime",
      "Models",
    ]);
    const { container } = render(
      <ApiOperationNavigation groups={model.groups} model={model} />,
    );

    const filter = screen.getByRole("searchbox", {
      name: API_OPERATION_FILTER_LABEL,
    });
    fireEvent.change(filter, { target: { value: "zzzz-no-match" } });

    expect(
      container.querySelector(
        '[data-testid="api-operation-navigation-filter-empty"]',
      ),
    ).not.toBeNull();
    expect(screen.getByText(API_OPERATION_FILTER_EMPTY_TITLE)).toBeTruthy();
    expect(container.querySelector(`[${API_OPERATION_NAV_ATTR}]`)).toBeNull();
    expect(container.querySelector(`[${API_MOBILE_NAV_ATTR}]`)).toBeNull();

    const clear = screen.getByRole("button", { name: "Clear" });
    expect(document.activeElement).not.toBe(clear);
    clear.focus();
    expect(document.activeElement).toBe(clear);
    fireEvent.click(clear);

    expect((filter as HTMLInputElement).value).toBe("");
    expect(
      container.querySelector(
        '[data-testid="api-operation-navigation-filter-empty"]',
      ),
    ).toBeNull();
    expect(
      container.querySelectorAll(`[${API_OPERATION_NAV_LINK_ATTR}]`).length,
    ).toBeGreaterThanOrEqual(3);
  });

  test("filter control is keyboard focusable", () => {
    const model = buildApiOperationNavModel(sampleOps, ["Work"]);
    render(<ApiOperationNavigation groups={model.groups} model={model} />);

    const filter = screen.getByRole("searchbox", {
      name: API_OPERATION_FILTER_LABEL,
    });
    filter.focus();
    expect(document.activeElement).toBe(filter);
    fireEvent.change(filter, { target: { value: "Work" } });
    expect((filter as HTMLInputElement).value).toBe("Work");
  });
});
