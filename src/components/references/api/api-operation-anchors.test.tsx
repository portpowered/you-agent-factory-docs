import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createOpenApiOperationSummary } from "@/lib/references/family-normalized-models";
import { ApiNavigationVerificationHarness } from "./api-navigation-verification-harness";
import { ApiOperationCopyLink } from "./api-operation-copy-link";
import {
  ApiReferenceHashController,
  focusApiOperationAnchor,
} from "./api-reference-hash-controller";
import {
  API_HASH_CONTROLLER_ATTR,
  API_HASH_FOCUSED_ATTR,
  API_OPERATION_COPY_LINK_ATTR,
  API_OPERATION_COPY_LINK_LABEL,
  API_REFERENCE_PAGE_PATH,
} from "./operation-anchors";
import { buildApiOperationNavModel } from "./operation-navigation";

afterEach(() => {
  cleanup();
  mock.restore();
  window.location.hash = "";
});

function installClipboardMock() {
  const writeText = mock((text: string) => {
    void text;
    return Promise.resolve();
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: {
      writeText: (text: string) => writeText(text),
    },
  });
  return writeText;
}

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
];

describe("ApiReferenceHashController", () => {
  test("responds to hashchange and clears focus when hash is empty", async () => {
    const { container } = render(
      <ApiReferenceHashController>
        <section
          data-api-operation-section=""
          data-api-operation-anchor="submitWorkBySessionId"
          id="submitWorkBySessionId"
        >
          Submit
        </section>
        <section
          data-api-operation-section=""
          data-api-operation-anchor="getEvents"
          id="getEvents"
        >
          Events
        </section>
      </ApiReferenceHashController>,
    );

    window.location.hash = "#submitWorkBySessionId";
    window.dispatchEvent(new Event("hashchange"));
    await waitFor(() => {
      expect(
        container
          .querySelector("#submitWorkBySessionId")
          ?.getAttribute(API_HASH_FOCUSED_ATTR),
      ).toBe("");
    });

    window.location.hash = "#getEvents";
    window.dispatchEvent(new Event("hashchange"));
    await waitFor(() => {
      expect(
        container
          .querySelector("#getEvents")
          ?.getAttribute(API_HASH_FOCUSED_ATTR),
      ).toBe("");
      expect(
        container
          .querySelector("#submitWorkBySessionId")
          ?.hasAttribute(API_HASH_FOCUSED_ATTR),
      ).toBe(false);
    });

    window.location.hash = "";
    window.dispatchEvent(new Event("hashchange"));
    await waitFor(() => {
      expect(container.querySelector(`[${API_HASH_FOCUSED_ATTR}]`)).toBeNull();
    });
  });
});

describe("ApiOperationCopyLink", () => {
  test("copies the production owning-page deep link", async () => {
    const writeText = installClipboardMock();
    render(<ApiOperationCopyLink anchor="submitWorkBySessionId" />);

    fireEvent.click(
      screen.getByRole("button", { name: API_OPERATION_COPY_LINK_LABEL }),
    );
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `${API_REFERENCE_PAGE_PATH}#submitWorkBySessionId`,
      );
    });
  });

  test("copies an explicit href when provided", async () => {
    const writeText = installClipboardMock();
    render(
      <ApiOperationCopyLink
        anchor="getEvents"
        href="/api-renderer-harness#getEvents"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: API_OPERATION_COPY_LINK_LABEL }),
    );
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("/api-renderer-harness#getEvents");
    });
  });
});

describe("focusApiOperationAnchor", () => {
  test("marks, focuses, and clears prior hash targets without rewriting content", () => {
    const { container } = render(
      <div>
        <section
          data-api-operation-section=""
          data-api-operation-anchor="submitWorkBySessionId"
          id="submitWorkBySessionId"
        >
          <h2>Submit work</h2>
        </section>
        <section
          data-api-operation-section=""
          data-api-operation-anchor="getEvents"
          id="getEvents"
        >
          <h2>Get events</h2>
        </section>
      </div>,
    );

    const first = container.querySelector(
      "#submitWorkBySessionId",
    ) as HTMLElement;
    const second = container.querySelector("#getEvents") as HTMLElement;
    const firstHtml = first.innerHTML;

    expect(focusApiOperationAnchor(container, "submitWorkBySessionId")).toBe(
      true,
    );
    expect(first.getAttribute(API_HASH_FOCUSED_ATTR)).toBe("");
    expect(document.activeElement).toBe(first);

    expect(focusApiOperationAnchor(container, "#getEvents")).toBe(true);
    expect(second.getAttribute(API_HASH_FOCUSED_ATTR)).toBe("");
    expect(first.hasAttribute(API_HASH_FOCUSED_ATTR)).toBe(false);
    expect(document.activeElement).toBe(second);
    expect(first.innerHTML).toBe(firstHtml);
  });
});

describe("ApiReferenceHashController + harness", () => {
  test("harness sections expose stable ids, copy links, and hash controller", async () => {
    const writeText = installClipboardMock();
    const model = buildApiOperationNavModel(sampleOps, ["Work", "Runtime"]);
    const { container } = render(
      <ApiNavigationVerificationHarness model={model} />,
    );

    expect(
      container.querySelector(`[${API_HASH_CONTROLLER_ATTR}]`),
    ).not.toBeNull();

    const section = container.querySelector(
      "#submitWorkBySessionId",
    ) as HTMLElement;
    expect(section).not.toBeNull();
    expect(section.getAttribute("data-api-operation-anchor")).toBe(
      "submitWorkBySessionId",
    );
    expect(section.tabIndex).toBe(-1);

    const copy = container.querySelector(
      `[${API_OPERATION_COPY_LINK_ATTR}="submitWorkBySessionId"]`,
    ) as HTMLButtonElement;
    expect(copy).not.toBeNull();
    fireEvent.click(copy);
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `${API_REFERENCE_PAGE_PATH}#submitWorkBySessionId`,
      );
    });
  });

  test("harness sections accept hash focus without rewriting content", () => {
    const model = buildApiOperationNavModel(sampleOps, ["Work", "Runtime"]);
    const { container } = render(
      <ApiNavigationVerificationHarness model={model} />,
    );

    const section = container.querySelector("#getEvents") as HTMLElement;
    const before = section.innerHTML;
    expect(focusApiOperationAnchor(container, "getEvents")).toBe(true);
    expect(section.getAttribute(API_HASH_FOCUSED_ATTR)).toBe("");
    expect(document.activeElement).toBe(section);
    expect(section.innerHTML).toBe(before);
  });
});
