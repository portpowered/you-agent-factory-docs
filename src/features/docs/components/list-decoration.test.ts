import { describe, expect, test } from "bun:test";
import {
  bulletlessListBaseClassName,
  bulletlessListClassName,
  bulletlessListMarkersClassName,
  docsResourceCardLinkClassName,
  searchInlineResultsListClassName,
} from "@/features/docs/components/list-decoration";

function expectNoUnderlineUtilities(className: string): void {
  expect(className).toContain("no-underline");
  expect(className).toContain("hover:no-underline");
  const withoutNoUnderline = className.replaceAll("no-underline", "");
  expect(withoutNoUnderline).not.toMatch(/\bunderline\b/);
}

describe("list decoration classes", () => {
  test("bulletlessListMarkersClassName omits list markers and prose list inset", () => {
    expect(bulletlessListMarkersClassName).toContain("list-none");
    expect(bulletlessListMarkersClassName).toContain("ps-0");
    expect(bulletlessListMarkersClassName).not.toContain("list-disc");
    expect(bulletlessListMarkersClassName).not.toMatch(/(?:^|\s)-m[trblxy]?-/);
  });

  test("bulletlessListBaseClassName omits list markers and prose list inset", () => {
    expect(bulletlessListBaseClassName).toContain(
      bulletlessListMarkersClassName,
    );
    expect(bulletlessListBaseClassName).toContain("ps-0");
    expect(bulletlessListBaseClassName).not.toContain("list-disc");
    expect(bulletlessListBaseClassName).not.toMatch(/(?:^|\s)-m[trblxy]?-/);
  });

  test("bulletlessListClassName applies margin presets", () => {
    expect(bulletlessListClassName("mt-3")).toContain("mt-3");
    expect(bulletlessListClassName("mt-4")).toContain("mt-4");
    expect(bulletlessListClassName("mt-8")).toContain("mt-8");
    expect(bulletlessListClassName("mt-3")).toContain(
      bulletlessListBaseClassName,
    );
    expect(bulletlessListClassName("mt-4")).toContain("ps-0");
    expect(bulletlessListClassName("mt-4")).not.toMatch(/(?:^|\s)-m[trblxy]?-/);
  });

  test("docsResourceCardLinkClassName omits underline utilities", () => {
    expectNoUnderlineUtilities(docsResourceCardLinkClassName);
    expect(docsResourceCardLinkClassName).toContain("focus-visible:ring-2");
    expect(docsResourceCardLinkClassName).toContain("hover:border-ring");
  });

  test("searchInlineResultsListClassName omits list markers", () => {
    expect(searchInlineResultsListClassName).toContain(
      bulletlessListMarkersClassName,
    );
    expect(searchInlineResultsListClassName).not.toContain("list-disc");
    expect(searchInlineResultsListClassName).toContain("divide-y");
  });
});
