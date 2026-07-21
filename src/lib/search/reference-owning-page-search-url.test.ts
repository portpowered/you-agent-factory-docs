import { describe, expect, test } from "bun:test";
import {
  isReferenceInventoryItemSearchUrl,
  isReferenceOwningPageSearchUrl,
  shouldSuppressReferenceStandaloneSearchHeadings,
} from "./reference-owning-page-search-url";

describe("isReferenceOwningPageSearchUrl", () => {
  test("accepts the references family index and family owning pages", () => {
    expect(isReferenceOwningPageSearchUrl("/docs/references")).toBe(true);
    expect(
      isReferenceOwningPageSearchUrl("/docs/references/mcp-reference"),
    ).toBe(true);
    expect(isReferenceOwningPageSearchUrl("/docs/references/api")).toBe(true);
    expect(
      isReferenceOwningPageSearchUrl("/docs/references/javascript-runtime"),
    ).toBe(true);
  });

  test("rejects inventory item deep links and non-reference pages", () => {
    expect(
      isReferenceOwningPageSearchUrl(
        "/docs/references/mcp-reference#factory_session_start",
      ),
    ).toBe(false);
    expect(
      isReferenceOwningPageSearchUrl(
        "/docs/references/api#submitWorkBySessionId",
      ),
    ).toBe(false);
    expect(
      isReferenceOwningPageSearchUrl(
        "/docs/references/mcp-reference#heading-0",
      ),
    ).toBe(false);
    expect(isReferenceOwningPageSearchUrl("/docs/concepts/harness")).toBe(
      false,
    );
    expect(isReferenceOwningPageSearchUrl("/docs/documentation/mcp")).toBe(
      false,
    );
  });
});

describe("isReferenceInventoryItemSearchUrl", () => {
  test("accepts registry-anchor deep links under /docs/references/**", () => {
    expect(
      isReferenceInventoryItemSearchUrl(
        "/docs/references/mcp-reference#you.factory_session.get",
      ),
    ).toBe(true);
    expect(
      isReferenceInventoryItemSearchUrl(
        "/docs/references/api#submitWorkBySessionId",
      ),
    ).toBe(true);
    expect(
      isReferenceInventoryItemSearchUrl("/docs/references/cli#you-config-init"),
    ).toBe(true);
    expect(
      isReferenceInventoryItemSearchUrl(
        "/docs/references/javascript-runtime#javascript.log",
      ),
    ).toBe(true);
  });

  test("rejects owning pages, auto-heading fragments, and non-reference URLs", () => {
    expect(
      isReferenceInventoryItemSearchUrl("/docs/references/mcp-reference"),
    ).toBe(false);
    expect(
      isReferenceInventoryItemSearchUrl(
        "/docs/references/mcp-reference#heading-0",
      ),
    ).toBe(false);
    expect(
      isReferenceInventoryItemSearchUrl(
        "/docs/references/mcp-reference#heading-12",
      ),
    ).toBe(false);
    expect(
      isReferenceInventoryItemSearchUrl("/docs/concepts/harness#overview"),
    ).toBe(false);
    expect(
      isReferenceInventoryItemSearchUrl("/docs/references/mcp-reference#"),
    ).toBe(false);
  });
});

describe("shouldSuppressReferenceStandaloneSearchHeadings", () => {
  test("suppresses owning pages and inventory item deep links", () => {
    expect(
      shouldSuppressReferenceStandaloneSearchHeadings(
        "/docs/references/mcp-reference",
      ),
    ).toBe(true);
    expect(
      shouldSuppressReferenceStandaloneSearchHeadings(
        "/docs/references/mcp-reference#you.factory_session.get",
      ),
    ).toBe(true);
  });

  test("does not suppress non-reference pages or bare #heading-N URLs", () => {
    expect(
      shouldSuppressReferenceStandaloneSearchHeadings("/docs/concepts/harness"),
    ).toBe(false);
    expect(
      shouldSuppressReferenceStandaloneSearchHeadings(
        "/docs/references/mcp-reference#heading-0",
      ),
    ).toBe(false);
  });
});
