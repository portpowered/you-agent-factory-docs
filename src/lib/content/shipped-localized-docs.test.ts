import { describe, expect, test } from "bun:test";
import { supportedLocales } from "@/lib/i18n/locale-routing";
import {
  getShippedLocalizedDocsSlugs,
  isShippedLocalizedDocsSlug,
  type NonDefaultLocale,
  resolveShippedLocalizedDocsManifest,
  type ShippedLocalizedDocsManifest,
} from "./shipped-localized-docs";

const nonDefaultLocales = supportedLocales.filter(
  (locale): locale is NonDefaultLocale => locale !== "en",
);

describe("shipped localized docs client contract", () => {
  test("non-default locales include zh-CN alongside ja and vi", () => {
    expect(nonDefaultLocales).toEqual(["ja", "zh-CN", "vi"]);
  });

  test("resolved manifest always includes an empty-capable zh-CN bucket", () => {
    const empty = resolveShippedLocalizedDocsManifest({
      ja: [],
      "zh-CN": [],
      vi: [],
    });

    expect(Object.keys(empty).sort()).toEqual(["ja", "vi", "zh-CN"]);
    expect(empty["zh-CN"]).toEqual([]);
    expect(getShippedLocalizedDocsSlugs("zh-CN", empty)).toEqual([]);
  });

  test("empty or absent zh-CN shipped list keeps docs unavailable in Chinese", () => {
    const withEmptyZhCn: ShippedLocalizedDocsManifest =
      resolveShippedLocalizedDocsManifest({
        ja: ["glossary/token"],
        "zh-CN": [],
        vi: ["glossary/token"],
      });

    expect(
      isShippedLocalizedDocsSlug("glossary/token", "zh-CN", withEmptyZhCn),
    ).toBe(false);
    expect(
      isShippedLocalizedDocsSlug("glossary/token", "ja", withEmptyZhCn),
    ).toBe(true);
    expect(
      isShippedLocalizedDocsSlug("glossary/token", "en", withEmptyZhCn),
    ).toBe(true);

    const withoutZhCnOverride = resolveShippedLocalizedDocsManifest({
      ja: ["glossary/token"],
      vi: ["glossary/token"],
    });
    expect(withoutZhCnOverride["zh-CN"]).toEqual(
      resolveShippedLocalizedDocsManifest()["zh-CN"],
    );
    expect(
      isShippedLocalizedDocsSlug(
        "glossary/token",
        "zh-CN",
        withoutZhCnOverride,
      ),
    ).toBe(false);
  });

  test("committed generated manifest treats zh-CN as a first-class empty locale", () => {
    const committed = resolveShippedLocalizedDocsManifest();
    expect(committed).toHaveProperty("zh-CN");
    expect(Array.isArray(committed["zh-CN"])).toBe(true);
    expect(isShippedLocalizedDocsSlug("glossary/token", "zh-CN")).toBe(false);
    expect(
      isShippedLocalizedDocsSlug("modules/grouped-query-attention", "zh-CN"),
    ).toBe(false);
  });
});
