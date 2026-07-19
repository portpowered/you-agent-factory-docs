import { describe, expect, test } from "bun:test";
import { isReferenceOwningPageSearchUrl } from "./reference-owning-page-search-url";

describe("isReferenceOwningPageSearchUrl", () => {
  test("accepts the references family index and family owning pages", () => {
    expect(isReferenceOwningPageSearchUrl("/docs/references")).toBe(true);
    expect(isReferenceOwningPageSearchUrl("/docs/references/mcp")).toBe(true);
    expect(isReferenceOwningPageSearchUrl("/docs/references/api")).toBe(true);
    expect(
      isReferenceOwningPageSearchUrl("/docs/references/javascript-runtime"),
    ).toBe(true);
  });

  test("rejects inventory item deep links and non-reference pages", () => {
    expect(
      isReferenceOwningPageSearchUrl(
        "/docs/references/mcp#factory_session_start",
      ),
    ).toBe(false);
    expect(
      isReferenceOwningPageSearchUrl(
        "/docs/references/api#submitWorkBySessionId",
      ),
    ).toBe(false);
    expect(
      isReferenceOwningPageSearchUrl("/docs/references/mcp#heading-0"),
    ).toBe(false);
    expect(isReferenceOwningPageSearchUrl("/docs/concepts/harness")).toBe(
      false,
    );
    expect(isReferenceOwningPageSearchUrl("/docs/documentation/mcp")).toBe(
      false,
    );
  });
});
