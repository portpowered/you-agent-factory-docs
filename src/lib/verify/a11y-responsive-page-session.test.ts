import { describe, expect, test } from "bun:test";
import { resolveA11yResponsiveProbeUrl } from "./a11y-responsive-page-session";

describe("resolveA11yResponsiveProbeUrl", () => {
  test("joins verify base URL with site-relative paths", () => {
    expect(resolveA11yResponsiveProbeUrl("http://127.0.0.1:3456", "/")).toBe(
      "http://127.0.0.1:3456/",
    );
    expect(
      resolveA11yResponsiveProbeUrl("http://127.0.0.1:3456/", "/browse"),
    ).toBe("http://127.0.0.1:3456/browse");
  });

  test("applies project-site basePath without double slashes", () => {
    expect(
      resolveA11yResponsiveProbeUrl(
        "http://127.0.0.1:3456",
        "/docs/documentation/harness-support",
        "/you-agent-factory-docs",
      ),
    ).toBe(
      "http://127.0.0.1:3456/you-agent-factory-docs/docs/documentation/harness-support",
    );
    expect(
      resolveA11yResponsiveProbeUrl(
        "http://127.0.0.1:3456",
        "/",
        "/you-agent-factory-docs",
      ),
    ).toBe("http://127.0.0.1:3456/you-agent-factory-docs/");
  });
});
