import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { PageMessagesProvider } from "@/features/docs/components/page-messages-context";
import type { PageMessages } from "@/lib/content/schemas";
import { API_METHOD_BADGE_ATTR, ApiMethodBadge } from "./api-method-badge";
import { ApiNavigationVerificationHarness } from "./api-navigation-verification-harness";
import { ApiOperationSection } from "./api-operation-section";
import { ApiResponseMediaType } from "./api-response-media-type";
import { buildApiOperationDetailsFromArtifact } from "./load-operation-details";
import { buildApiOperationNavigationFromArtifact } from "./load-operation-navigation";
import { API_OPERATION_SECTION_ATTR } from "./operation-anchors";
import type { ApiOperationDetail } from "./operation-detail";
import {
  API_MEDIA_TYPE_ATTR,
  API_PARAMETERS_ATTR,
  API_REQUEST_BODY_ATTR,
  API_RESPONSES_ATTR,
} from "./operation-detail";

afterEach(() => {
  cleanup();
});

const sampleDetail: ApiOperationDetail = {
  method: "post",
  path: "/factory-sessions/{session_id}/work",
  operationId: "submitWorkBySessionId",
  anchor: "submitWorkBySessionId",
  summary: "Submit work",
  description: "Enqueue a work item for the session.",
  parameters: [
    {
      name: "session_id",
      location: "path",
      required: true,
      description: "Session identifier",
      typeSummary: "string",
    },
  ],
  requestBody: {
    required: true,
    mediaTypes: [
      {
        mediaType: "application/json",
        kind: "json",
        typeSummary: "SubmitWorkRequest",
        schemaRef: "#/components/schemas/SubmitWorkRequest",
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
          typeSummary: "Work",
          examples: [],
        },
      ],
    },
  ],
};

const sseDetail: ApiOperationDetail = {
  method: "get",
  path: "/factory-sessions/{session_id}/events",
  operationId: "getEventsBySessionId",
  anchor: "getEventsBySessionId",
  summary: "Stream events",
  parameters: [
    {
      name: "session_id",
      location: "path",
      required: true,
      typeSummary: "string",
    },
  ],
  responses: [
    {
      statusCode: "200",
      description: "SSE stream",
      mediaTypes: [
        {
          mediaType: "text/event-stream",
          kind: "event-stream",
          typeSummary: "string",
          examples: [],
        },
        {
          mediaType: "application/json",
          kind: "json",
          typeSummary: "FactorySessionEventStreamRecovery",
          examples: [],
        },
      ],
    },
  ],
};

describe("ApiMethodBadge", () => {
  test("exposes accessible method text (not color-only meaning)", () => {
    render(<ApiMethodBadge method="post" />);
    const badge = screen.getByTestId("api-method-badge");
    expect(badge.textContent).toBe("POST");
    expect(badge.getAttribute("title")).toBe("HTTP method POST");
    expect(badge.getAttribute(API_METHOD_BADGE_ATTR)).toBe("POST");
  });
});

describe("ApiResponseMediaType", () => {
  test("labels JSON and event-stream media types distinctly", () => {
    const { rerender } = render(
      <ApiResponseMediaType mediaType="application/json" />,
    );
    expect(screen.getByText("application/json")).toBeTruthy();
    expect(screen.getByText("JSON")).toBeTruthy();
    expect(
      screen
        .getByTestId("api-response-media-type")
        .getAttribute(API_MEDIA_TYPE_ATTR),
    ).toBe("application/json");

    rerender(<ApiResponseMediaType mediaType="text/event-stream" />);
    expect(screen.getByText("text/event-stream")).toBeTruthy();
    expect(screen.getByText("Server-Sent Events")).toBeTruthy();
  });
});

describe("ApiOperationSection", () => {
  test("renders method, path, summary, parameters, body, responses, and examples", () => {
    const { container } = render(<ApiOperationSection detail={sampleDetail} />);

    expect(container.querySelector(`#${sampleDetail.anchor}`)).toBeTruthy();
    expect(
      container
        .querySelector("[data-api-operation-section]")
        ?.hasAttribute(API_OPERATION_SECTION_ATTR),
    ).toBe(true);
    expect(screen.getByText("POST")).toBeTruthy();
    expect(screen.getByText(sampleDetail.path)).toBeTruthy();
    expect(screen.getByText("Submit work")).toBeTruthy();
    expect(
      screen.getByText("Enqueue a work item for the session."),
    ).toBeTruthy();

    expect(container.querySelector(`[${API_PARAMETERS_ATTR}]`)).toBeTruthy();
    expect(screen.getByText("session_id")).toBeTruthy();
    expect(screen.getByText("path")).toBeTruthy();
    expect(screen.getAllByText("required").length).toBeGreaterThanOrEqual(1);

    expect(container.querySelector(`[${API_REQUEST_BODY_ATTR}]`)).toBeTruthy();
    expect(container.querySelector(`[${API_RESPONSES_ATTR}]`)).toBeTruthy();
    expect(screen.getByText("200")).toBeTruthy();
    expect(screen.getByText("Accepted")).toBeTruthy();
    expect(screen.getByText("Example")).toBeTruthy();
    expect(
      screen.getByTestId("api-example-code-example").textContent,
    ).toContain('"name": "task"');
  });

  test("distinguishes event-stream and JSON response media types", () => {
    render(<ApiOperationSection detail={sseDetail} />);
    expect(screen.getByText("text/event-stream")).toBeTruthy();
    expect(screen.getByText("Server-Sent Events")).toBeTruthy();
    expect(screen.getAllByText("application/json").length).toBeGreaterThan(0);
    expect(screen.getByText("JSON")).toBeTruthy();
  });

  test("does not invent examples when none are published", () => {
    const { container } = render(<ApiOperationSection detail={sseDetail} />);
    expect(container.querySelector("[data-api-examples='present']")).toBeNull();
    expect(container.querySelector("[data-api-example='code']")).toBeNull();
  });

  test("marks canonical English contract descriptions with lang=en on Japanese UI locale", () => {
    const pageMessages = {
      title: "API",
      description: "Test",
    } as PageMessages;

    const { container } = render(
      <PageMessagesProvider messages={pageMessages} locale="ja">
        <ApiOperationSection detail={sampleDetail} />
      </PageMessagesProvider>,
    );

    const description = container.querySelector(
      "[data-api-operation-description]",
    );
    expect(description?.getAttribute("lang")).toBe("en");
    expect(description?.getAttribute("data-contract-prose")).toBe("");
    expect(description?.textContent).toBe(
      "Enqueue a work item for the session.",
    );

    const summary = container.querySelector("[data-api-operation-summary]");
    expect(summary?.getAttribute("lang")).toBe("en");

    // Untranslated identifiers stay byte-identical beside bounded prose.
    expect(screen.getByText(sampleDetail.path)).toBeTruthy();
    expect(screen.getByText("POST")).toBeTruthy();
    expect(
      screen.getByText(`operationId: ${sampleDetail.operationId}`),
    ).toBeTruthy();
  });
});

describe("ApiNavigationVerificationHarness with operation details", () => {
  test("renders full detail sections for package-backed nav anchors", () => {
    const { model } = buildApiOperationNavigationFromArtifact();
    const { byAnchor } = buildApiOperationDetailsFromArtifact();
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={byAnchor}
        model={model}
      />,
    );

    const sections = container.querySelectorAll("[data-api-operation-section]");
    expect(sections.length).toBe(model.operationCount);
    expect(
      container.querySelector(
        "#submitWorkBySessionId [data-api-operation-parameters]",
      ),
    ).toBeTruthy();
    expect(
      container.querySelector(
        "#getEventsBySessionId [data-api-media-type='text/event-stream']",
      ),
    ).toBeTruthy();
    expect(
      container.querySelector(
        "#closeFactorySession [data-api-operation-request-body]",
      ),
    ).toBeTruthy();
  });
});
