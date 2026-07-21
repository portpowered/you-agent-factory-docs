/**
 * Proves the public `@/features/references/api` barrel presents Fumadocs
 * `ApiReferenceAPIPage` as the published primary operation renderer and does
 * not re-export the superseded custom operation chrome.
 */

import { describe, expect, test } from "bun:test";
import * as apiBarrel from "@/features/references/api";

describe("API ownership barrel — published primary renderer", () => {
  test("names ApiReferenceAPIPage as the published primary operation renderer", () => {
    expect(apiBarrel.API_PUBLISHED_PRIMARY_OPERATION_RENDERER).toBe(
      "ApiReferenceAPIPage",
    );
    expect(typeof apiBarrel.ApiReferenceAPIPage).toBe("function");
  });

  test("keeps thin adapters Fumadocs does not replace on the barrel", () => {
    expect(typeof apiBarrel.ApiSseOperationSummaryPanel).toBe("function");
    expect(typeof apiBarrel.ApiLocalServerBaseUrlNotice).toBe("function");
    expect(typeof apiBarrel.ApiSurface).toBe("function");
    expect(typeof apiBarrel.ApiReferenceHashController).toBe("function");
    expect(typeof apiBarrel.ApiOperationNavigation).toBe("function");
  });

  test("does not present superseded custom operation chrome as barrel exports", () => {
    const barrel = apiBarrel as Record<string, unknown>;
    expect(barrel.ApiOperationSection).toBeUndefined();
    expect(barrel.ApiMethodBadge).toBeUndefined();
    expect(barrel.ApiOperationExamples).toBeUndefined();
    expect(barrel.ApiResponseMediaType).toBeUndefined();
  });
});
