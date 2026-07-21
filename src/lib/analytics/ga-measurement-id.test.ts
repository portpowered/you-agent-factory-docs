import { describe, expect, test } from "bun:test";
import {
  GA_MEASUREMENT_ID_ENV,
  GA_MEASUREMENT_ID_FALLBACK,
  resolveGaMeasurementId,
} from "./ga-measurement-id";

describe("resolveGaMeasurementId", () => {
  test("returns the trimmed env value when NEXT_PUBLIC_GA_MEASUREMENT_ID is set", () => {
    expect(
      resolveGaMeasurementId({
        [GA_MEASUREMENT_ID_ENV]: "G-CUSTOM12345",
      }),
    ).toBe("G-CUSTOM12345");
    expect(
      resolveGaMeasurementId({
        [GA_MEASUREMENT_ID_ENV]: "  G-PADDED999  ",
      }),
    ).toBe("G-PADDED999");
  });

  test("falls back to G-80P18Q3LWQ when the env var is unset", () => {
    expect(resolveGaMeasurementId({})).toBe(GA_MEASUREMENT_ID_FALLBACK);
    expect(resolveGaMeasurementId({})).toBe("G-80P18Q3LWQ");
  });

  test("falls back when the env var is whitespace-only", () => {
    expect(
      resolveGaMeasurementId({
        [GA_MEASUREMENT_ID_ENV]: "   ",
      }),
    ).toBe(GA_MEASUREMENT_ID_FALLBACK);
    expect(
      resolveGaMeasurementId({
        [GA_MEASUREMENT_ID_ENV]: "\t\n",
      }),
    ).toBe(GA_MEASUREMENT_ID_FALLBACK);
  });

  test("returns empty for an explicit empty-string omit override", () => {
    expect(
      resolveGaMeasurementId({
        [GA_MEASUREMENT_ID_ENV]: "",
      }),
    ).toBe("");
  });

  test("does not throw when env is unset", () => {
    expect(() => resolveGaMeasurementId({})).not.toThrow();
    expect(() => resolveGaMeasurementId()).not.toThrow();
  });
});
