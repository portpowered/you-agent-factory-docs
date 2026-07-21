import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { API_METHOD_BADGE_ATTR, ApiMethodBadge } from "./api-method-badge";
import { ApiNavigationVerificationHarness } from "./api-navigation-verification-harness";
import {
  API_EXAMPLES_ATTR,
  ApiOperationExamples,
} from "./api-operation-examples";
import { ApiOperationSection } from "./api-operation-section";
import type { ApiOperationDetail } from "./operation-detail";
import type { ApiOperationNavModel } from "./operation-navigation";
import {
  API_CODE_PANEL_ATTR,
  API_THEME_ROOT_ATTR,
  apiMethodBadgeToneClass,
} from "./theme-tokens";

afterEach(() => {
  cleanup();
  mock.restore();
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

const sampleDetail: ApiOperationDetail = {
  method: "post",
  path: "/factory-sessions/{session_id}/work",
  operationId: "submitWorkBySessionId",
  anchor: "submitWorkBySessionId",
  summary: "Submit work",
  parameters: [],
  requestBody: {
    required: true,
    mediaTypes: [
      {
        mediaType: "application/json",
        kind: "json",
        typeSummary: "SubmitWorkRequest",
        examples: [
          {
            id: "example",
            label: "Example",
            language: "json",
            code: '{\n  "name": "task"\n}',
          },
        ],
      },
    ],
  },
  responses: [
    {
      statusCode: "200",
      description: "Accepted",
      mediaTypes: [
        {
          mediaType: "application/json",
          kind: "json",
          examples: [],
        },
      ],
    },
  ],
};

const miniNav: ApiOperationNavModel = {
  groups: [
    {
      tag: "Work",
      items: [
        {
          id: "submitWorkBySessionId",
          method: "post",
          path: "/factory-sessions/{session_id}/work",
          operationId: "submitWorkBySessionId",
          anchor: "submitWorkBySessionId",
          summary: "Submit work",
          tags: ["Work"],
        },
      ],
    },
  ],
  linkCount: 1,
  operationCount: 1,
};

describe("ApiOperationExamples code-copy", () => {
  test("renders examples through CodePanel with shared copy affordance", async () => {
    const writeText = installClipboardMock();

    render(
      <ApiOperationExamples
        examples={[
          {
            id: "example",
            label: "Happy path",
            language: "json",
            code: '{\n  "ok": true\n}',
          },
        ]}
      />,
    );

    const panel = screen.getByTestId("api-operation-examples");
    expect(panel.getAttribute(API_EXAMPLES_ATTR)).toBe("present");

    const code = screen.getByTestId("api-example-code-example");
    expect(code.tagName).toBe("PRE");
    expect(code.getAttribute(API_CODE_PANEL_ATTR)).toBe("json");
    expect(code.textContent).toContain('"ok"');

    fireEvent.click(screen.getByRole("button", { name: "Copy example" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    const copied = writeText.mock.calls[0]?.[0];
    expect(typeof copied).toBe("string");
    expect(copied).toContain('"ok"');

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Copied example" }),
      ).toBeTruthy();
    });
    expect(
      panel.querySelector('[data-api-code-copy-icon="check"]'),
    ).toBeTruthy();
  });

  test("absent examples stay quiet by default (no fabricated payloads)", () => {
    const { container } = render(<ApiOperationExamples examples={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("ApiMethodBadge theme tokens", () => {
  test("carries method meaning in text and applies semantic tone classes", () => {
    render(<ApiMethodBadge method="delete" />);
    const badge = screen.getByTestId("api-method-badge");
    expect(badge.getAttribute(API_METHOD_BADGE_ATTR)).toBe("DELETE");
    expect(badge.textContent).toBe("DELETE");
    expect(badge.className).toContain("border-border");
    expect(badge.className).toContain("text-secondary");
    expect(badge.className).not.toMatch(/\btext-primary\b/);
    for (const token of apiMethodBadgeToneClass("delete").split(/\s+/)) {
      expect(badge.className).toContain(token);
    }
  });
});

describe("API theme root wiring", () => {
  test("harness marks the production theme root", () => {
    render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={new Map([["submitWorkBySessionId", sampleDetail]])}
        model={miniNav}
      />,
    );

    const root = document.querySelector(`[${API_THEME_ROOT_ATTR}]`);
    expect(root).toBeTruthy();
    expect(root?.getAttribute("data-api-navigation-verification-harness")).toBe(
      "",
    );
    expect(screen.getByTestId("api-method-badge").textContent).toBe("POST");
    expect(screen.getByTestId("api-example-code-example")).toBeTruthy();
  });

  test("operation section keeps method badge + CodePanel under semantic chrome", () => {
    render(<ApiOperationSection detail={sampleDetail} />);
    expect(screen.getByTestId("api-method-badge").textContent).toBe("POST");
    expect(screen.getByTestId("api-example-code-example").tagName).toBe("PRE");
    expect(screen.getByRole("button", { name: "Copy example" })).toBeTruthy();
  });
});
