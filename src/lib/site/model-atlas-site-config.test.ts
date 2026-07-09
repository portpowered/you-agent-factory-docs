import { describe, expect, test } from "bun:test";
import { SCAFFOLD_ID, SITE_BRAND_NAME, SITE_HEADING } from "@/lib/scaffold";
import {
  MODEL_ATLAS_REPOSITORY_URL,
  modelAtlasSiteConfig,
} from "./model-atlas-site-config";
import { SITE_COLLECTION_FAMILIES } from "./site-config.contract";

describe("model atlas site config", () => {
  test("contains current scaffold brand values", () => {
    expect(modelAtlasSiteConfig.brand).toEqual({
      scaffoldId: SCAFFOLD_ID,
      brandName: SITE_BRAND_NAME,
      siteHeading: SITE_HEADING,
    });
    expect(modelAtlasSiteConfig.brand.scaffoldId).toBe(
      "model-reference-scaffold",
    );
    expect(modelAtlasSiteConfig.brand.brandName).toBe("Model Atlas");
    expect(modelAtlasSiteConfig.brand.siteHeading).toBe("Model Reference");
  });

  test("contains current repository URL", () => {
    expect(modelAtlasSiteConfig.repositoryUrl).toBe(MODEL_ATLAS_REPOSITORY_URL);
    expect(modelAtlasSiteConfig.repositoryUrl).toBe(
      "https://github.com/portpowered/ai-model-reference",
    );
  });

  test("orders primary nav for home, blog, and tags without topology or timeline", () => {
    expect(
      modelAtlasSiteConfig.primaryNav.map((entry) => entry.routeSurface),
    ).toEqual(["home", "blogIndex", "tagsIndex"]);
    expect(
      modelAtlasSiteConfig.primaryNav.map((entry) => entry.labelKey),
    ).toEqual(["home", "blog", "tags"]);
  });

  test("includes all Model Atlas collection family placeholders", () => {
    expect(
      modelAtlasSiteConfig.collections.map((entry) => entry.family),
    ).toEqual([...SITE_COLLECTION_FAMILIES]);
  });

  test("includes browse-only home featured link placeholders after Atlas page deletion", () => {
    expect(modelAtlasSiteConfig.homeFeaturedLinks).toEqual([
      {
        kind: "route",
        routeSurface: "browse",
        titleKey: "atlasLinkTitle",
        descriptionKey: "atlasLinkDescription",
      },
    ]);
  });
});
