import { describe, expect, test } from "bun:test";
import { modelAtlasSiteConfig } from "./model-atlas-site-config";
import { resolveSiteConfigHomeFeaturedLinkHrefs } from "./site-config-resolution";

describe("site config home featured link resolution", () => {
  test("resolves browse-only featured links after Atlas page deletion", () => {
    expect(modelAtlasSiteConfig.homeFeaturedLinks).toEqual([
      {
        kind: "route",
        routeSurface: "browse",
        titleKey: "atlasLinkTitle",
        descriptionKey: "atlasLinkDescription",
      },
    ]);
  });

  test("preserves localized browse href on vietnamese home", () => {
    expect(
      resolveSiteConfigHomeFeaturedLinkHrefs(modelAtlasSiteConfig, "vi"),
    ).toEqual(["/vi/browse"]);
  });

  test("preserves localized browse href on japanese home", () => {
    expect(
      resolveSiteConfigHomeFeaturedLinkHrefs(modelAtlasSiteConfig, "ja"),
    ).toEqual(["/ja/browse"]);
  });
});
