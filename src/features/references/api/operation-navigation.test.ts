import { describe, expect, test } from "bun:test";
import { createOpenApiOperationSummary } from "@/lib/references/family-normalized-models";
import {
  API_MOBILE_NAV_ATTR,
  API_MOBILE_NAV_CONTRACT,
  API_MOBILE_NAV_LIST_ATTR,
  API_OPERATION_NAV_ARIA_LABEL,
  API_OPERATION_UNTAGGED_GROUP,
  API_PHONE_VIEWPORT,
  buildApiOperationNavModel,
  isApiMobileNavMarkupReady,
  probeApiMobileNavHtml,
  readOpenApiDocumentTagOrder,
  toApiOperationNavItem,
} from "./operation-navigation";

function op(
  overrides: Partial<Parameters<typeof createOpenApiOperationSummary>[0]> & {
    id: string;
    method: "get" | "post" | "put" | "patch" | "delete";
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

describe("buildApiOperationNavModel", () => {
  test("groups operations by OpenAPI tags and preserves document tag order", () => {
    const operations = [
      op({
        id: "a",
        method: "get",
        path: "/a",
        anchor: "a",
        tags: ["Runtime"],
        summary: "List A",
      }),
      op({
        id: "b",
        method: "post",
        path: "/b",
        anchor: "b",
        tags: ["Work"],
      }),
      op({
        id: "c",
        method: "get",
        path: "/c",
        anchor: "c",
        tags: ["Runtime"],
      }),
    ];

    const model = buildApiOperationNavModel(operations, ["Work", "Runtime"]);
    expect(model.groups.map((g) => g.tag)).toEqual(["Work", "Runtime"]);
    expect(model.groups[0]?.items.map((i) => i.id)).toEqual(["b"]);
    expect(model.groups[1]?.items.map((i) => i.id)).toEqual(["a", "c"]);
    expect(model.operationCount).toBe(3);
    expect(model.linkCount).toBe(3);
  });

  test("places untagged operations in a final Untagged group", () => {
    const model = buildApiOperationNavModel(
      [
        op({
          id: "tagged",
          method: "get",
          path: "/t",
          anchor: "tagged",
          tags: ["Work"],
        }),
        op({
          id: "lonely",
          method: "get",
          path: "/u",
          anchor: "lonely",
        }),
      ],
      ["Work"],
    );

    expect(model.groups.map((g) => g.tag)).toEqual([
      "Work",
      API_OPERATION_UNTAGGED_GROUP,
    ]);
    expect(model.groups[1]?.items[0]?.id).toBe("lonely");
  });

  test("lists multi-tag operations under each tag", () => {
    const model = buildApiOperationNavModel(
      [
        op({
          id: "multi",
          method: "get",
          path: "/m",
          anchor: "multi",
          tags: ["Work", "Runtime"],
        }),
      ],
      ["Work", "Runtime"],
    );

    expect(model.linkCount).toBe(2);
    expect(model.operationCount).toBe(1);
    expect(model.groups[0]?.items[0]?.anchor).toBe("multi");
    expect(model.groups[1]?.items[0]?.anchor).toBe("multi");
  });

  test("toApiOperationNavItem preserves W04 anchor and method/path", () => {
    const item = toApiOperationNavItem(
      op({
        id: "submitWorkBySessionId",
        operationId: "submitWorkBySessionId",
        method: "post",
        path: "/factory-sessions/{session_id}/work",
        anchor: "submitWorkBySessionId",
        summary: "Submit work",
        tags: ["Work"],
      }),
    );
    expect(item.anchor).toBe("submitWorkBySessionId");
    expect(item.method).toBe("post");
    expect(item.path).toBe("/factory-sessions/{session_id}/work");
    expect(item.summary).toBe("Submit work");
  });
});

describe("readOpenApiDocumentTagOrder", () => {
  test("reads published tag names in document order", () => {
    expect(
      readOpenApiDocumentTagOrder({
        tags: [
          { name: "Work" },
          { name: "Factory", description: "x" },
          { name: "Work" },
          { name: "  " },
          {},
        ],
      }),
    ).toEqual(["Work", "Factory"]);
  });

  test("returns empty for missing or malformed tags", () => {
    expect(readOpenApiDocumentTagOrder(null)).toEqual([]);
    expect(readOpenApiDocumentTagOrder({})).toEqual([]);
    expect(readOpenApiDocumentTagOrder({ tags: "nope" })).toEqual([]);
  });
});

describe("W08 mobile navigation contract", () => {
  test("phone viewport matches factory mobile critical width", () => {
    expect(API_PHONE_VIEWPORT.width).toBe(390);
    expect(API_PHONE_VIEWPORT.height).toBe(844);
    expect(API_MOBILE_NAV_CONTRACT.collapseMechanism).toBe("details-summary");
    expect(API_MOBILE_NAV_CONTRACT.defaultOpen).toBe(false);
  });

  test("HTML probe detects collapsed details nav with tag groups", () => {
    const html = `
      <details ${API_MOBILE_NAV_ATTR}="">
        <summary>API operations by tag (2)</summary>
        <nav aria-label="${API_OPERATION_NAV_ARIA_LABEL}">
          <div ${API_MOBILE_NAV_LIST_ATTR}="">
            <div data-api-operation-nav-tag="Work">
              <a data-api-operation-nav-link="a" href="#a">a</a>
            </div>
            <div data-api-operation-nav-tag="Runtime">
              <a data-api-operation-nav-link="b" href="#b">b</a>
            </div>
          </div>
        </nav>
      </details>
    `;
    const probe = probeApiMobileNavHtml(html);
    expect(probe.hasDetailsHost).toBe(true);
    expect(probe.hasSummary).toBe(true);
    expect(probe.detailsOpenByDefault).toBe(false);
    expect(probe.navAriaLabelPresent).toBe(true);
    expect(probe.listMarkerPresent).toBe(true);
    expect(probe.deepLinkCount).toBe(2);
    expect(probe.tagGroupCount).toBe(2);
    expect(isApiMobileNavMarkupReady(probe, 2, 2)).toBe(true);
  });

  test("rejects always-open details", () => {
    const openHtml = `<details ${API_MOBILE_NAV_ATTR}="" open><summary>x</summary></details>`;
    const openProbe = probeApiMobileNavHtml(openHtml);
    expect(openProbe.detailsOpenByDefault).toBe(true);
    expect(isApiMobileNavMarkupReady(openProbe, 0)).toBe(false);
  });
});
