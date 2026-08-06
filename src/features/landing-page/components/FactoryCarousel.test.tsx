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
  CAROUSEL_FEATURE_WIDTH_PERCENT,
  FactoryCarousel,
  getCarouselSignedOffset,
  getCarouselSlideDepth,
  getCarouselTrackPlacement,
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

describe("getCarouselSignedOffset", () => {
  test("takes the shorter way around so the track keeps rotating", () => {
    // Last slide → first is one step forward, not seven steps back.
    expect(getCarouselSignedOffset(0, 7, 8)).toBe(1);
    expect(getCarouselSignedOffset(7, 0, 8)).toBe(-1);
    expect(getCarouselSignedOffset(3, 3, 8)).toBe(0);
    expect(getCarouselSignedOffset(5, 3, 8)).toBe(2);
  });
});

describe("getCarouselTrackPlacement", () => {
  test("focused slide is wide and centred; neighbours are narrow and offset", () => {
    const active = getCarouselTrackPlacement(2, 2, 8);
    const next = getCarouselTrackPlacement(3, 2, 8);
    const previous = getCarouselTrackPlacement(1, 2, 8);

    expect(active.centerPercent).toBe(50);
    expect(active.widthPercent).toBe(CAROUSEL_FEATURE_WIDTH_PERCENT);
    expect(next.centerPercent).toBeGreaterThan(50);
    expect(previous.centerPercent).toBeLessThan(50);
    // Entering focus widens the plate; leaving it shrinks again.
    expect(active.widthPercent).toBeGreaterThan(next.widthPercent);
    expect(active.zIndex).toBeGreaterThan(next.zIndex);
  });

  test("parks slides beyond the second ring fully transparent", () => {
    expect(getCarouselTrackPlacement(6, 2, 12).opacity).toBe(0);
    expect(getCarouselTrackPlacement(4, 2, 12).opacity).toBeGreaterThan(0);
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
    /**
     * Every slide occupies the same box and differs only by transform, so
     * position is read off the transform rather than off `left`/`width`. That
     * is the point of the layout: cards travel along the track instead of
     * resizing between a rail slot and a feature slot.
     */
    expect(active.style.left).toBe("50%");
    expect(active.style.width).toBe(`${CAROUSEL_FEATURE_WIDTH_PERCENT}%`);
    expect(Number.parseFloat(neighborLeft.style.left)).toBeLessThan(50);
    expect(Number.parseFloat(neighborRight.style.left)).toBeGreaterThan(50);
    expect(Number.parseFloat(neighborLeft.style.width)).toBeLessThan(
      CAROUSEL_FEATURE_WIDTH_PERCENT,
    );
    expect(active.getAttribute("data-carousel-slide-offset")).toBe("0");
    expect(neighborLeft.getAttribute("data-carousel-slide-offset")).toBe("-1");
    expect(neighborRight.getAttribute("data-carousel-slide-offset")).toBe("1");
    expect(Number(active.style.zIndex)).toBeGreaterThan(
      Number(neighborLeft.style.zIndex),
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
    expect(slideEl("slide-loop").style.left).toBe("50%");
    expect(
      Number.parseFloat(slideEl("slide-worktree").style.left),
    ).toBeGreaterThan(50);

    await user.click(worktreeSelector);

    expect(root.getAttribute("data-carousel-active-index")).toBe("2");
    expect(worktreeSelector.getAttribute("aria-pressed")).toBe("true");
    expect(slideEl("slide-worktree").getAttribute("data-active")).toBe("true");
    // The clicked card travels to the centre and the previous active card
    // travels one step left — neither changes size.
    expect(slideEl("slide-worktree").style.left).toBe("50%");
    expect(Number.parseFloat(slideEl("slide-loop").style.left)).toBeLessThan(
      50,
    );
    expect(slideEl("slide-worktree").style.width).toBe(
      `${CAROUSEL_FEATURE_WIDTH_PERCENT}%`,
    );
    expect(Number.parseFloat(slideEl("slide-loop").style.width)).toBeLessThan(
      CAROUSEL_FEATURE_WIDTH_PERCENT,
    );
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

describe("carousel travel and autoplay", () => {
  afterEach(() => {
    cleanup();
  });

  test("track follows the pointer while dragging, then eases back on release", () => {
    mockPrefersReducedMotion(false);
    render(<FactoryCarousel slides={fixtureSlides} />);

    const track = document.querySelector(
      "[data-carousel-track]",
    ) as HTMLElement;
    expect(track.style.transform).toBe("");

    fireEvent.pointerDown(track, { button: 0, pointerId: 1, clientX: 300 });
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 200 });

    // Follows the gesture rather than sitting still until release.
    expect(track.style.transform).toContain("translateX(");
    expect(track.getAttribute("data-carousel-dragging")).toBe("true");
    expect(track.style.transition).toBe("none");

    fireEvent.pointerUp(track, { pointerId: 1, clientX: 200 });

    expect(track.style.transform).toBe("");
    expect(track.getAttribute("data-carousel-dragging")).toBeNull();
    expect(track.style.transition).toContain(
      `${landingPageTheme.carousel.transitionMs}ms`,
    );
  });

  test("autoplay runs by default and pauses on hover and focus", () => {
    mockPrefersReducedMotion(false);
    render(<FactoryCarousel slides={fixtureSlides} />);

    const root = screen.getByRole("region", { name: "Factory carousel" });
    expect(root.getAttribute("data-carousel-autoplay")).toBe("running");

    fireEvent.mouseEnter(root);
    expect(root.getAttribute("data-carousel-autoplay")).toBe("paused");

    fireEvent.mouseLeave(root);
    expect(root.getAttribute("data-carousel-autoplay")).toBe("running");

    fireEvent.focus(root);
    expect(root.getAttribute("data-carousel-autoplay")).toBe("paused");
  });

  test("autoplay advances the active slide after the dwell time", async () => {
    mockPrefersReducedMotion(false);
    render(<FactoryCarousel autoPlayMs={30} slides={fixtureSlides} />);

    const root = screen.getByRole("region", { name: "Factory carousel" });
    expect(root.getAttribute("data-carousel-active-index")).toBe("0");

    await waitFor(
      () => {
        expect(root.getAttribute("data-carousel-active-index")).not.toBe("0");
      },
      { timeout: 2000 },
    );
  });

  test("autoplay never runs under reduced motion", () => {
    mockPrefersReducedMotion(true);
    render(<FactoryCarousel slides={fixtureSlides} />);

    const root = screen.getByRole("region", { name: "Factory carousel" });
    expect(root.getAttribute("data-carousel-autoplay")).toBe("paused");
  });

  test("autoPlayMs=0 disables autoplay without disabling manual controls", async () => {
    mockPrefersReducedMotion(false);
    const user = userEvent.setup();
    render(<FactoryCarousel autoPlayMs={0} slides={fixtureSlides} />);

    const root = screen.getByRole("region", { name: "Factory carousel" });
    expect(root.getAttribute("data-carousel-autoplay")).toBe("paused");

    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(root.getAttribute("data-carousel-active-index")).toBe("1");
  });

  test("live region is silent while auto-rotating and polite once the reader takes over", () => {
    mockPrefersReducedMotion(false);
    render(<FactoryCarousel slides={fixtureSlides} />);

    const root = screen.getByRole("region", { name: "Factory carousel" });
    const status = document.querySelector(
      "[data-carousel-status]",
    ) as HTMLElement;
    expect(status.getAttribute("aria-live")).toBe("off");

    fireEvent.mouseEnter(root);
    expect(status.getAttribute("aria-live")).toBe("polite");
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
