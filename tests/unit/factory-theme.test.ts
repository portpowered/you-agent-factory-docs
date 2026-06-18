import { describe, expect, test } from "bun:test";
import {
  BUTTON_SIZE_CLASS_NAMES,
  BUTTON_VARIANT_CLASS_NAMES,
  getContentWidthClassName,
  getStackClassName,
  getSurfaceClassName,
} from "../../src/components/ui/factory-theme";

describe("factory token grammar helpers", () => {
  test("encodes shared surface tones, spacing, and radii through one helper", () => {
    const heroSurfaceClassName = getSurfaceClassName({
      padding: "spacious",
      tone: "hero",
    });
    const mutedSurfaceClassName = getSurfaceClassName({
      padding: "compact",
      tone: "muted",
    });

    expect(heroSurfaceClassName).toContain("ui-surface--hero");
    expect(heroSurfaceClassName).toContain("ui-surface-padding--spacious");
    expect(heroSurfaceClassName).toContain("ui-surface-radius--default");
    expect(mutedSurfaceClassName).toContain("ui-surface--muted");
    expect(mutedSurfaceClassName).toContain("ui-surface-padding--compact");
  });

  test("publishes layout and control token hooks for reusable UI primitives", () => {
    expect(getStackClassName({ align: "items-center" })).toContain(
      "ui-stack-gap--section",
    );
    expect(getStackClassName({ align: "items-center" })).toContain(
      "ui-stack-align--center",
    );
    expect(getContentWidthClassName("prose")).toContain("ui-layout--prose");
    expect(BUTTON_VARIANT_CLASS_NAMES.primary).toBe("ui-button--primary");
    expect(BUTTON_SIZE_CLASS_NAMES.default).toBe("ui-button-size--default");
  });
});
