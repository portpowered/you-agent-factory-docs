import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { RouteLocaleEffect } from "@/features/i18n/RouteLocaleEffect";
import type { SiteLocale } from "@/lib/i18n/locale-routing";

describe("RouteLocaleEffect", () => {
  afterEach(() => {
    cleanup();
    document.documentElement.lang = "";
  });

  test("sets document.documentElement.lang to the active locale", () => {
    const locale: SiteLocale = "ja";

    render(<RouteLocaleEffect locale={locale} />);

    expect(document.documentElement.lang).toBe("ja");
  });

  test("updates document.documentElement.lang when locale changes", () => {
    const { rerender } = render(<RouteLocaleEffect locale="en" />);
    expect(document.documentElement.lang).toBe("en");

    rerender(<RouteLocaleEffect locale="zh-CN" />);
    expect(document.documentElement.lang).toBe("zh-CN");
  });
});
