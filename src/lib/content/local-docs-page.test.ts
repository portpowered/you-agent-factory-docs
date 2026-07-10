import { describe, expect, test } from "bun:test";
import {
  isLocalDocsCatchAllSlug,
  parseLocalDocsPageRef,
} from "@/lib/content/local-docs-page";

describe("local-docs-page techniques wiring", () => {
  test("parseLocalDocsPageRef accepts techniques section refs", () => {
    expect(parseLocalDocsPageRef(["techniques", "ralph"])).toEqual({
      section: "techniques",
      slug: "ralph",
    });
  });

  test("isLocalDocsCatchAllSlug is true for techniques page slugs", () => {
    expect(isLocalDocsCatchAllSlug(["techniques", "ralph"])).toBe(true);
  });

  test("parseLocalDocsPageRef still rejects unknown sections", () => {
    expect(parseLocalDocsPageRef(["unknown", "ralph"])).toBeNull();
  });
});
