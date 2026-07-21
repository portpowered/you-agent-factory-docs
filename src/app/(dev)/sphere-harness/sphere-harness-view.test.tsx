import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { ParticleSphere } from "@/features/landing-page/components/ParticleSphere";
import { SphereHarnessView } from "./sphere-harness-view";

describe("sphere-harness", () => {
  afterEach(() => {
    cleanup();
  });

  test("public ParticleSphere export is importable for later skeleton integrate", () => {
    expect(typeof ParticleSphere).toBe("function");
  });

  test("renders ParticleSphere alone in a fixed-square stage without landing chrome", () => {
    const { container } = render(<SphereHarnessView />);

    const harness = container.querySelector("[data-sphere-harness]");
    expect(harness).toBeTruthy();

    const stage = container.querySelector("[data-sphere-harness-stage]");
    expect(stage).toBeTruthy();
    expect(stage?.className).toContain("aspect-square");

    expect(container.querySelector("[data-particle-sphere]")).toBeTruthy();
    expect(
      container.querySelector("canvas[data-particle-sphere-canvas]"),
    ).toBeTruthy();

    // Sphere-only: no sibling-lane chrome markers.
    expect(container.querySelector("[data-whale]")).toBeNull();
    expect(container.querySelector("[data-carousel]")).toBeNull();
    expect(container.querySelector("[data-hero-art]")).toBeNull();
    expect(container.querySelector("footer")).toBeNull();
  });
});
