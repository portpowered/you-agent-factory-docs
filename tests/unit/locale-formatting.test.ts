import { describe, expect, test } from "bun:test";
import { createLocaleFormatters } from "../../src/localization/lib/create-formatters";
import { getIntlLocaleTag } from "../../src/localization/lib/locale-intl-tag";

describe("locale-aware formatting groundwork", () => {
  const sampleDate = new Date("2024-06-15T12:00:00.000Z");
  const sampleNumber = 1234.5;

  test("maps supported locales to Intl BCP 47 tags", () => {
    expect(getIntlLocaleTag("en")).toBe("en-US");
    expect(getIntlLocaleTag("fr")).toBe("fr-FR");
    expect(getIntlLocaleTag("ja")).toBe("ja-JP");
    expect(getIntlLocaleTag("es")).toBe("es-ES");
  });

  test("formats dates according to the active locale", () => {
    const enFormatters = createLocaleFormatters("en");
    const frFormatters = createLocaleFormatters("fr");

    const enDate = enFormatters.formatDate(sampleDate, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
    const frDate = frFormatters.formatDate(sampleDate, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });

    expect(enDate).toBe("June 15, 2024");
    expect(frDate).toBe("15 juin 2024");
  });

  test("formats numbers according to the active locale", () => {
    const enFormatters = createLocaleFormatters("en");
    const frFormatters = createLocaleFormatters("fr");

    expect(enFormatters.formatNumber(sampleNumber)).toBe(
      new Intl.NumberFormat("en-US").format(sampleNumber),
    );
    expect(frFormatters.formatNumber(sampleNumber)).toBe(
      new Intl.NumberFormat("fr-FR").format(sampleNumber),
    );
  });

  test("accepts numeric timestamps for date formatting", () => {
    const formatters = createLocaleFormatters("en");

    expect(
      formatters.formatDate(sampleDate.getTime(), { timeZone: "UTC" }),
    ).toBe(formatters.formatDate(sampleDate, { timeZone: "UTC" }));
  });
});
