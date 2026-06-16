import { PREFERS_REDUCED_MOTION_MEDIA_QUERY } from "../../src/lib/media-preferences";
import { RESPONSIVE_BREAKPOINTS_PX } from "../../src/lib/responsive-tokens";

type MockMatchMediaOptions = {
  width: number;
  prefersReducedMotion?: boolean;
};

function createMediaQueryList(query: string, matches: boolean): MediaQueryList {
  return {
    addEventListener: () => {},
    addListener: () => {},
    dispatchEvent: () => false,
    matches,
    media: query,
    onchange: null,
    removeEventListener: () => {},
    removeListener: () => {},
  } as MediaQueryList;
}

/** Shared viewport and reduced-motion matchMedia stub for shell hook tests. */
export function mockMatchMedia({
  width,
  prefersReducedMotion = false,
}: MockMatchMediaOptions): void {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true,
  });

  window.matchMedia = (query: string) => {
    if (query === PREFERS_REDUCED_MOTION_MEDIA_QUERY) {
      return createMediaQueryList(query, prefersReducedMotion);
    }

    const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/);
    const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/);

    let matches = false;

    if (maxWidthMatch) {
      matches = width <= Number(maxWidthMatch[1]);
    } else if (minWidthMatch) {
      matches = width >= Number(minWidthMatch[1]);
    }

    return createMediaQueryList(query, matches);
  };
}

export { RESPONSIVE_BREAKPOINTS_PX };
