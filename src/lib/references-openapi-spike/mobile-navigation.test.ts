import { describe, expect, test } from "bun:test";
import {
  isSpikeMobileNavMarkupReady,
  probeSpikeMobileNavHtml,
  SPIKE_MOBILE_NAV_ATTR,
  SPIKE_MOBILE_NAV_CONTRACT,
  SPIKE_MOBILE_NAV_LIST_ATTR,
  SPIKE_OPERATION_NAV_ARIA_LABEL,
  SPIKE_PHONE_VIEWPORT,
} from "./mobile-navigation";

describe("W01 OpenAPI spike mobile navigation contract", () => {
  test("phone viewport matches factory mobile critical width", () => {
    expect(SPIKE_PHONE_VIEWPORT.width).toBe(390);
    expect(SPIKE_PHONE_VIEWPORT.height).toBe(844);
    expect(SPIKE_MOBILE_NAV_CONTRACT.collapseMechanism).toBe("details-summary");
    expect(SPIKE_MOBILE_NAV_CONTRACT.defaultOpen).toBe(false);
  });

  test("HTML probe detects collapsed details nav with deep links", () => {
    const html = `
      <details ${SPIKE_MOBILE_NAV_ATTR}="">
        <summary>Operation deep links (2)</summary>
        <nav aria-label="${SPIKE_OPERATION_NAV_ARIA_LABEL}">
          <ul ${SPIKE_MOBILE_NAV_LIST_ATTR}="">
            <li><a data-openapi-spike-nav-link="a" href="#a">a</a></li>
            <li><a data-openapi-spike-nav-link="b" href="#b">b</a></li>
          </ul>
        </nav>
      </details>
    `;
    const probe = probeSpikeMobileNavHtml(html);
    expect(probe.hasDetailsHost).toBe(true);
    expect(probe.hasSummary).toBe(true);
    expect(probe.detailsOpenByDefault).toBe(false);
    expect(probe.navAriaLabelPresent).toBe(true);
    expect(probe.listMarkerPresent).toBe(true);
    expect(probe.deepLinkCount).toBe(2);
    expect(isSpikeMobileNavMarkupReady(probe, 2)).toBe(true);
  });

  test("rejects always-open details and missing markers", () => {
    const openHtml = `<details ${SPIKE_MOBILE_NAV_ATTR}="" open><summary>x</summary></details>`;
    const openProbe = probeSpikeMobileNavHtml(openHtml);
    expect(openProbe.detailsOpenByDefault).toBe(true);
    expect(isSpikeMobileNavMarkupReady(openProbe, 0)).toBe(false);

    const bare = probeSpikeMobileNavHtml("<main>no nav</main>");
    expect(isSpikeMobileNavMarkupReady(bare, 45)).toBe(false);
  });
});
