import { describe, expect, test } from "bun:test";
import { renderTypescriptLiteral } from "./render-typescript-literal";

describe("renderTypescriptLiteral", () => {
  test("renders primitives with JSON encoding", () => {
    expect(renderTypescriptLiteral("hello")).toBe('"hello"');
    expect(renderTypescriptLiteral(42)).toBe("42");
    expect(renderTypescriptLiteral(true)).toBe("true");
    expect(renderTypescriptLiteral(null)).toBe("null");
  });

  test("renders empty containers", () => {
    expect(renderTypescriptLiteral([])).toBe("[]");
    expect(renderTypescriptLiteral({})).toBe("{}");
  });

  test("leaves valid identifier keys unquoted and quotes others", () => {
    expect(
      renderTypescriptLiteral({
        ja: ["a"],
        "zh-CN": ["b"],
      }),
    ).toBe(`{
  ja: [
    "a",
  ],
  "zh-CN": [
    "b",
  ],
}`);
  });

  test("renders nested objects and arrays with trailing commas", () => {
    expect(
      renderTypescriptLiteral([
        {
          registryId: "guide.getting-started",
          slug: "getting-started",
        },
      ]),
    ).toBe(`[
  {
    registryId: "guide.getting-started",
    slug: "getting-started",
  },
]`);
  });
});
