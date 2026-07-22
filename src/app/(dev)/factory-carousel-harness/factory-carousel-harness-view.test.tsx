import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import {
  FactoryCarousel,
  FactorySlide,
  type FactorySlideData,
} from "@/features/landing-page";
import {
  FACTORY_CAROUSEL_HARNESS_SLIDES,
  FactoryCarouselHarnessView,
} from "./factory-carousel-harness-view";

describe("factory-carousel-harness", () => {
  afterEach(() => {
    cleanup();
  });

  test("public FactoryCarousel / FactorySlide exports are importable for skeleton integrate", () => {
    expect(typeof FactoryCarousel).toBe("function");
    expect(typeof FactorySlide).toBe("function");
    const sample: FactorySlideData = {
      id: "sample",
      title: "Sample",
      blurb: "Blurb",
      command: "you --help",
    };
    expect(sample.id).toBe("sample");
  });

  test("fixture slides mirror the current local factory set", () => {
    expect(FACTORY_CAROUSEL_HARNESS_SLIDES.length).toBe(8);
    for (const slide of FACTORY_CAROUSEL_HARNESS_SLIDES) {
      expect(slide.id.length).toBeGreaterThan(0);
      expect(slide.title.length).toBeGreaterThan(0);
      expect(slide.blurb.length).toBeGreaterThan(0);
      expect(typeof slide.command).toBe("string");
    }
  });

  test("renders FactoryCarousel alone on a neutral background without landing chrome", () => {
    const { container } = render(<FactoryCarouselHarnessView />);

    const harness = container.querySelector("[data-factory-carousel-harness]");
    expect(harness).toBeTruthy();
    expect(harness?.className).toContain("bg-neutral-100");

    expect(
      container.querySelector("[data-factory-carousel-harness-stage]"),
    ).toBeTruthy();
    expect(container.querySelector("[data-factory-carousel]")).toBeTruthy();

    expect(
      container.querySelector('[data-carousel-slide="slide-ralph"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-carousel-slide="slide-loop"]'),
    ).toBeTruthy();

    // Carousel-only: no sibling-lane chrome markers.
    expect(container.querySelector("[data-landing-page]")).toBeNull();
    expect(container.querySelector("[data-whale]")).toBeNull();
    expect(container.querySelector("[data-particle-sphere]")).toBeNull();
    expect(container.querySelector("[data-hero-art]")).toBeNull();
    expect(container.querySelector("footer")).toBeNull();
  });
});
