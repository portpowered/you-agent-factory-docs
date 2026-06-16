import { describe, expect, test } from "bun:test";
import { renderHook } from "@testing-library/react";
import { LocalizationProvider } from "../../src/localization/context/localization-context";
import { useFormatters } from "../../src/localization/hooks/use-formatters";

describe("useFormatters hook", () => {
  const sampleDate = new Date("2024-06-15T12:00:00.000Z");

  test("returns formatters aligned with the active locale from LocalizationProvider", () => {
    const { result, rerender } = renderHook(() => useFormatters(), {
      wrapper: ({ children }) => (
        <LocalizationProvider locale="en">{children}</LocalizationProvider>
      ),
    });

    expect(
      result.current.formatDate(sampleDate, {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }),
    ).toBe("June 15, 2024");
    expect(result.current.formatNumber(1234.5)).toBe(
      new Intl.NumberFormat("en-US").format(1234.5),
    );
  });

  test("updates formatting output when the provider locale changes", () => {
    let locale = "en";

    const { result, rerender } = renderHook(() => useFormatters(), {
      wrapper: ({ children }) => (
        <LocalizationProvider locale={locale}>{children}</LocalizationProvider>
      ),
    });

    expect(result.current.formatNumber(1234.5)).toBe(
      new Intl.NumberFormat("en-US").format(1234.5),
    );

    locale = "fr";
    rerender();

    expect(result.current.formatNumber(1234.5)).toBe(
      new Intl.NumberFormat("fr-FR").format(1234.5),
    );
  });
});
