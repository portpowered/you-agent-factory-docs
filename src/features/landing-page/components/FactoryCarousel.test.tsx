import { afterEach, describe, expect, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { landingPageTheme } from "@/features/landing-page/landing-page.theme";
import {
  FactoryCarousel,
  getCarouselSlideDepth,
  wrapCarouselIndex,
} from "./FactoryCarousel";
import type { FactorySlideData } from "./FactorySlide";

const fixtureSlides: FactorySlideData[] = [
  {
    id: "slide-install",
    title: "Install",
    blurb: "Add the factory CLI and run your first named workflow.",
    command: "you run --named @goal/example",
  },
  {
    id: "slide-loop",
    title: "Loop",
    blurb: "Keep write-review loops persistent across sessions.",
    command: "you run --named @loop/write-review",
  },
  {
    id: "slide-worktree",
    title: "Worktree",
    blurb: "Isolate agent work in durable git worktrees.",
    command: "you run --named @goal/worktree",
  },
  {
    id: "slide-harness",
    title: "Harness",
    blurb: "Prove features alone before the skeleton absorbs them.",
    command: "you docs agents",
  },
];

function mockPrefersReducedMotion(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion: reduce"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

const originalMatchMedia = window.matchMedia;

function slideEl(id: string): HTMLElement {
  const el = document.querySelector(
    `[data-carousel-slide="${id}"]`,
  ) as HTMLElement | null;
  expect(el).toBeTruthy();
  return el as HTMLElement;
}

describe("getCarouselSlideDepth", () => {
  const theme = landingPageTheme.carousel;

  test("marks active slide with full scale, opacity, and highest z", () => {
    const depth = getCarouselSlideDepth(1, 1, theme);
    expect(depth.role).toBe("active");
    expect(depth.scale).toBe(theme.activeScale);
    expect(depth.opacity).toBe(1);
    expect(depth.zIndex).toBeGreaterThan(20);
    expect(depth.translateX).toBe("0%");
  });

  test("recesses neighbors with reduced scale, opacity, and lower z", () => {
    const left = getCarouselSlideDepth(0, 1, theme);
    const right = getCarouselSlideDepth(2, 1, theme);

    expect(left.role).toBe("neighbor");
    expect(right.role).toBe("neighbor");
    expect(left.scale).toBe(theme.neighborScale);
    expect(left.opacity).toBe(theme.neighborOpacity);
    expect(left.scale).toBeLessThan(theme.activeScale);
    expect(left.opacity).toBeLessThan(1);
    expect(left.zIndex).toBeLessThan(getCarouselSlideDepth(1, 1, theme).zIndex);
    expect(left.translateX.startsWith("-")).toBe(true);
    expect(right.translateX.startsWith("-")).toBe(false);
  });

  test("recesses far slides further than neighbors", () => {
    const neighbor = getCarouselSlideDepth(1, 0, theme);
    const far = getCarouselSlideDepth(3, 0, theme);

    expect(far.role).toBe("far");
    expect(far.scale).toBe(theme.farScale);
    expect(far.opacity).toBe(theme.farOpacity);
    expect(far.scale).toBeLessThan(neighbor.scale);
    expect(far.opacity).toBeLessThan(neighbor.opacity);
    expect(far.zIndex).toBeLessThan(neighbor.zIndex);
  });
});

describe("FactoryCarousel", () => {
  afterEach(() => {
    cleanup();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
  });

  test("renders a stable empty state for slides: []", () => {
    render(<FactoryCarousel slides={[]} />);

    const root = document.querySelector("[data-factory-carousel]");
    expect(root).toBeTruthy();
    expect(root?.hasAttribute("data-carousel-empty")).toBe(true);
    expect(document.querySelector("[data-carousel-slide]")).toBeNull();
    expect(screen.getByText("No factory slides")).toBeTruthy();
  });

  test("composes FactorySlide content for each slide", () => {
    mockPrefersReducedMotion(false);
    render(<FactoryCarousel slides={fixtureSlides} />);

    expect(slideEl("slide-install").textContent).toContain("Install");
    expect(slideEl("slide-loop").textContent).toContain("Loop");
    expect(slideEl("slide-worktree").textContent).toContain("Worktree");
    expect(slideEl("slide-harness").textContent).toContain("Harness");

    expect(
      document.querySelector('[data-factory-slide="slide-install"]'),
    ).toBeTruthy();
    expect(document.querySelectorAll("[data-terminal]").length).toBe(
      fixtureSlides.length,
    );
  });

  test("active slide is the wide feature card and rails overlap it", async () => {
    mockPrefersReducedMotion(false);
    render(<FactoryCarousel slides={fixtureSlides} initialIndex={1} />);

    await waitFor(() => {
      expect(
        document
          .querySelector("[data-factory-carousel]")
          ?.getAttribute("data-carousel-motion"),
      ).toBe("depth");
    });

    const active = slideEl("slide-loop");
    const neighborLeft = slideEl("slide-install");
    const neighborRight = slideEl("slide-worktree");
    const far = slideEl("slide-harness");

    expect(active.getAttribute("data-active")).toBe("true");
    expect(active.getAttribute("data-carousel-depth")).toBe("active");
    const activeContent = active.querySelector(":scope > div");
    const neighborLeftContent = neighborLeft.querySelector(":scope > div");
    const neighborRightContent = neighborRight.querySelector(":scope > div");
    const farContent = far.querySelector(":scope > div");
    expect(activeContent?.hasAttribute("inert")).toBe(false);
    expect(activeContent?.getAttribute("aria-hidden")).toBeNull();
    expect(neighborLeft.getAttribute("data-carousel-depth")).toBe("neighbor");
    expect(neighborRight.getAttribute("data-carousel-depth")).toBe("neighbor");
    expect(far.getAttribute("data-carousel-depth")).toBe("far");
    expect(neighborLeftContent?.getAttribute("aria-hidden")).toBe("true");
    expect(neighborRightContent?.getAttribute("aria-hidden")).toBe("true");
    expect(farContent?.getAttribute("aria-hidden")).toBe("true");
    expect(neighborLeftContent?.hasAttribute("inert")).toBe(true);
    expect(neighborRightContent?.hasAttribute("inert")).toBe(true);
    expect(farContent?.hasAttribute("inert")).toBe(true);
    expect(
      neighborLeft.querySelector('[data-carousel-select="slide-install"]'),
    ).toBeTruthy();

    expect(active.getAttribute("data-carousel-slot")).toBe("feature");
    expect(neighborLeft.getAttribute("data-carousel-slot")).toBe("rail");
    expect(neighborRight.getAttribute("data-carousel-slot")).toBe("rail");
    expect(far.getAttribute("data-carousel-slot")).toBe("rail");
    expect(active.style.left).toBe("9%");
    expect(active.style.width).toBe("82%");
    expect(neighborLeft.style.left).toBe("0.5%");
    expect(neighborRight.style.left).toBe("55%");
    expect(Number(neighborLeft.style.zIndex)).toBeGreaterThan(
      Number(active.style.zIndex),
    );
    expect(active.style.transitionDuration).toBe(
      `${landingPageTheme.carousel.transitionMs}ms`,
    );
  });

  test("prefers-reduced-motion keeps the collage and removes travel", async () => {
    mockPrefersReducedMotion(true);
    render(<FactoryCarousel slides={fixtureSlides} initialIndex={1} />);

    await waitFor(() => {
      expect(
        document
          .querySelector("[data-factory-carousel]")
          ?.getAttribute("data-carousel-motion"),
      ).toBe("static");
    });

    const slides = document.querySelectorAll("[data-carousel-slide]");
    expect(slides.length).toBe(fixtureSlides.length);
    expect(slideEl("slide-loop").getAttribute("data-active")).toBe("true");
    expect(slideEl("slide-loop").getAttribute("data-carousel-depth")).toBe(
      "active",
    );
    expect(slideEl("slide-install").getAttribute("data-carousel-slot")).toBe(
      "rail",
    );
    expect(slideEl("slide-loop").style.transitionDuration).toBe("0ms");
    expect(
      document.querySelectorAll("[data-carousel-depth='neighbor']").length,
    ).toBeGreaterThan(0);
    expect(slideEl("slide-loop").textContent).toContain("Loop");
    expect(slideEl("slide-install").textContent).toContain("Install");
  });

  test("reduced-motion path still advances via buttons and keyboard", async () => {
    mockPrefersReducedMotion(true);
    const user = userEvent.setup();
    render(<FactoryCarousel slides={fixtureSlides} initialIndex={0} />);

    await waitFor(() => {
      expect(
        document
          .querySelector("[data-factory-carousel]")
          ?.getAttribute("data-carousel-motion"),
      ).toBe("static");
    });

    const root = screen.getByRole("region", { name: "Factory carousel" });
    expect(root.getAttribute("data-carousel-active-index")).toBe("0");
    expect(slideEl("slide-install").getAttribute("data-active")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(root.getAttribute("data-carousel-active-index")).toBe("1");
    expect(slideEl("slide-loop").getAttribute("data-active")).toBe("true");
    expect(document.querySelectorAll("[data-carousel-slide]").length).toBe(
      fixtureSlides.length,
    );

    root.focus();
    await user.keyboard("{ArrowRight}");
    expect(root.getAttribute("data-carousel-active-index")).toBe("2");
    expect(slideEl("slide-worktree").getAttribute("data-active")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(root.getAttribute("data-carousel-active-index")).toBe("1");
    expect(slideEl("slide-loop").getAttribute("data-active")).toBe("true");
  });

  test("changing activeIndex updates which slide is primary without remounting", async () => {
    mockPrefersReducedMotion(false);
    const { rerender, container } = render(
      <FactoryCarousel slides={fixtureSlides} activeIndex={0} />,
    );

    await waitFor(() => {
      expect(
        container
          .querySelector("[data-factory-carousel]")
          ?.getAttribute("data-carousel-motion"),
      ).toBe("depth");
    });

    const root = container.querySelector("[data-factory-carousel]");
    expect(root?.getAttribute("data-carousel-active-index")).toBe("0");
    expect(slideEl("slide-install").getAttribute("data-active")).toBe("true");
    expect(slideEl("slide-loop").getAttribute("data-active")).toBeNull();

    rerender(<FactoryCarousel slides={fixtureSlides} activeIndex={2} />);

    expect(root?.getAttribute("data-carousel-active-index")).toBe("2");
    expect(slideEl("slide-worktree").getAttribute("data-active")).toBe("true");
    expect(slideEl("slide-install").getAttribute("data-active")).toBeNull();
    expect(slideEl("slide-worktree").getAttribute("data-carousel-depth")).toBe(
      "active",
    );
    expect(slideEl("slide-loop").getAttribute("data-carousel-depth")).toBe(
      "neighbor",
    );
  });

  test("next and previous buttons change which slide is active and wrap", async () => {
    mockPrefersReducedMotion(false);
    const user = userEvent.setup();
    render(<FactoryCarousel slides={fixtureSlides} initialIndex={0} />);

    const root = document.querySelector("[data-factory-carousel]");
    expect(root?.getAttribute("data-carousel-active-index")).toBe("0");
    expect(slideEl("slide-install").getAttribute("data-active")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(root?.getAttribute("data-carousel-active-index")).toBe("1");
    expect(slideEl("slide-loop").getAttribute("data-active")).toBe("true");
    expect(slideEl("slide-install").getAttribute("data-active")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(root?.getAttribute("data-carousel-active-index")).toBe("0");
    expect(slideEl("slide-install").getAttribute("data-active")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(root?.getAttribute("data-carousel-active-index")).toBe("3");
    expect(slideEl("slide-harness").getAttribute("data-active")).toBe("true");
  });

  test("clicking a visible rail card promotes it to the active feature", async () => {
    mockPrefersReducedMotion(false);
    const user = userEvent.setup();
    render(<FactoryCarousel slides={fixtureSlides} initialIndex={1} />);

    await user.click(
      screen.getByRole("button", { name: "Show Worktree factory" }),
    );

    expect(slideEl("slide-worktree").getAttribute("data-active")).toBe("true");
    expect(
      document
        .querySelector("[data-factory-carousel]")
        ?.getAttribute("data-carousel-active-index"),
    ).toBe("2");
  });

  test("desktop factory selectors change state and rotate card positions", async () => {
    mockPrefersReducedMotion(false);
    const user = userEvent.setup();
    render(<FactoryCarousel slides={fixtureSlides} initialIndex={1} />);

    const root = screen.getByRole("region", { name: "Factory carousel" });
    const selectorHost = document.querySelector(
      "[data-carousel-factory-selectors]",
    );
    const worktreeSelector = document.querySelector(
      '[data-carousel-factory-selector="slide-worktree"]',
    ) as HTMLButtonElement;

    expect(selectorHost?.className).toContain("md:flex");
    expect(worktreeSelector.getAttribute("aria-pressed")).toBe("false");
    expect(slideEl("slide-loop").style.left).toBe("9%");
    expect(slideEl("slide-worktree").style.left).toBe("55%");

    await user.click(worktreeSelector);

    expect(root.getAttribute("data-carousel-active-index")).toBe("2");
    expect(worktreeSelector.getAttribute("aria-pressed")).toBe("true");
    expect(slideEl("slide-worktree").getAttribute("data-active")).toBe("true");
    expect(slideEl("slide-worktree").style.left).toBe("9%");
    expect(slideEl("slide-worktree").style.width).toBe("82%");
    expect(slideEl("slide-loop").style.left).toBe("0.5%");
    expect(slideEl("slide-loop").style.width).toBe("14.5%");
  });

  test("ArrowLeft and ArrowRight on the focused carousel change the active slide", async () => {
    mockPrefersReducedMotion(false);
    const user = userEvent.setup();
    render(<FactoryCarousel slides={fixtureSlides} initialIndex={1} />);

    const root = screen.getByRole("region", { name: "Factory carousel" });
    root.focus();
    expect(document.activeElement).toBe(root);
    expect(slideEl("slide-loop").getAttribute("data-active")).toBe("true");

    await user.keyboard("{ArrowRight}");
    expect(root.getAttribute("data-carousel-active-index")).toBe("2");
    expect(slideEl("slide-worktree").getAttribute("data-active")).toBe("true");

    await user.keyboard("{ArrowLeft}");
    expect(root.getAttribute("data-carousel-active-index")).toBe("1");
    expect(slideEl("slide-loop").getAttribute("data-active")).toBe("true");
  });

  test("pointer drag past threshold changes the active slide", () => {
    mockPrefersReducedMotion(false);
    render(<FactoryCarousel slides={fixtureSlides} initialIndex={1} />);

    const track = document.querySelector(
      "[data-carousel-track]",
    ) as HTMLElement;
    const root = document.querySelector("[data-factory-carousel]");
    const threshold = landingPageTheme.carousel.dragThresholdPx;

    fireEvent.pointerDown(track, {
      button: 0,
      pointerId: 1,
      clientX: 200,
    });
    fireEvent.pointerUp(track, {
      pointerId: 1,
      clientX: 200 - (threshold + 10),
    });

    expect(root?.getAttribute("data-carousel-active-index")).toBe("2");
    expect(slideEl("slide-worktree").getAttribute("data-active")).toBe("true");

    fireEvent.pointerDown(track, {
      button: 0,
      pointerId: 2,
      clientX: 200,
    });
    fireEvent.pointerUp(track, {
      pointerId: 2,
      clientX: 200 + (threshold + 10),
    });

    expect(root?.getAttribute("data-carousel-active-index")).toBe("1");
    expect(slideEl("slide-loop").getAttribute("data-active")).toBe("true");
  });

  test("exposes carousel semantics and labeled prev/next controls", () => {
    mockPrefersReducedMotion(false);
    render(<FactoryCarousel slides={fixtureSlides} />);

    const root = screen.getByRole("region", { name: "Factory carousel" });
    expect(root.getAttribute("aria-roledescription")).toBe("carousel");
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next slide" })).toBeTruthy();
    expect(screen.getByText(/Slide 1 of 4: Install/)).toBeTruthy();
  });
});

describe("wrapCarouselIndex", () => {
  test("wraps forward and backward across ends", () => {
    expect(wrapCarouselIndex(0, 4, -1)).toBe(3);
    expect(wrapCarouselIndex(3, 4, 1)).toBe(0);
    expect(wrapCarouselIndex(1, 4, 1)).toBe(2);
    expect(wrapCarouselIndex(0, 0, 1)).toBe(0);
  });
});
