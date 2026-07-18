import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ApiLocalServerBaseUrlNotice } from "./api-local-server-base-url";
import { ApiNavigationVerificationHarness } from "./api-navigation-verification-harness";
import { buildApiLocalServerBaseUrlFromArtifact } from "./load-local-server-base-url";
import { buildApiOperationDetailsFromArtifact } from "./load-operation-details";
import { buildApiOperationNavigationFromArtifact } from "./load-operation-navigation";
import {
  API_LOCAL_SERVER_BASE_URL_ATTR,
  API_LOCAL_SERVER_DEFAULT_DESCRIPTION,
  API_LOCAL_SERVER_DOCS_HOST_DISCLAIMER,
  apiLocalServerCopyAvoidsDocsHostAsApi,
  projectApiLocalServerBaseUrls,
  resolvePrimaryApiLocalServerBaseUrl,
} from "./local-server-base-url";
import { API_PLAYGROUND_SUPPRESSED_ATTR } from "./playground-suppression";

afterEach(() => {
  cleanup();
});

describe("projectApiLocalServerBaseUrls", () => {
  test("projects published OpenAPI servers with docs-host disclaimer", () => {
    const servers = projectApiLocalServerBaseUrls({
      servers: [
        {
          url: "http://localhost:7437",
          description: "Local Agent Factory API server",
        },
      ],
    });

    expect(servers).toHaveLength(1);
    const primary = servers[0];
    expect(primary).toBeDefined();
    if (primary === undefined) {
      throw new Error("expected projected local server");
    }
    expect(primary.url).toBe("http://localhost:7437");
    expect(primary.description).toBe("Local Agent Factory API server");
    expect(primary.docsHostDisclaimer).toBe(
      API_LOCAL_SERVER_DOCS_HOST_DISCLAIMER,
    );
    expect(apiLocalServerCopyAvoidsDocsHostAsApi(primary)).toBe(true);
  });

  test("skips invalid entries and falls back description", () => {
    const servers = projectApiLocalServerBaseUrls({
      servers: [
        { url: "   " },
        { url: "http://localhost:9000" },
        { description: "missing url" },
      ],
    });
    expect(servers).toEqual([
      {
        url: "http://localhost:9000",
        description: API_LOCAL_SERVER_DEFAULT_DESCRIPTION,
        docsHostDisclaimer: API_LOCAL_SERVER_DOCS_HOST_DISCLAIMER,
      },
    ]);
  });

  test("returns empty when servers are absent", () => {
    expect(projectApiLocalServerBaseUrls({})).toEqual([]);
    expect(resolvePrimaryApiLocalServerBaseUrl({})).toBeUndefined();
  });
});

describe("buildApiLocalServerBaseUrlFromArtifact", () => {
  test("loads the package OpenAPI local server base URL", () => {
    const projection = buildApiLocalServerBaseUrlFromArtifact();
    expect(projection.servers.length).toBeGreaterThanOrEqual(1);
    expect(projection.primary?.url).toBe("http://localhost:7437");
    expect(projection.primary?.description.toLowerCase()).toContain("local");
    const primary = projection.primary;
    expect(primary).toBeDefined();
    if (primary === undefined) {
      throw new Error("expected primary local server from package artifact");
    }
    expect(apiLocalServerCopyAvoidsDocsHostAsApi(primary)).toBe(true);
  });
});

describe("ApiLocalServerBaseUrlNotice", () => {
  test("renders base URL, disclaimer, and static-examples note", () => {
    const server = {
      url: "http://localhost:7437",
      description: "Local Agent Factory API server",
      docsHostDisclaimer: API_LOCAL_SERVER_DOCS_HOST_DISCLAIMER,
    };
    const { container } = render(
      <ApiLocalServerBaseUrlNotice server={server} />,
    );

    const notice = screen.getByTestId("api-local-server-base-url");
    expect(notice.getAttribute(API_LOCAL_SERVER_BASE_URL_ATTR)).toBe(
      server.url,
    );
    expect(notice.getAttribute("data-api-playground-suppressed")).toBe("");
    expect(screen.getByText("Local server base URL")).toBeTruthy();
    expect(screen.getByText(server.description)).toBeTruthy();
    expect(
      container.querySelector("[data-api-local-server-url]")?.textContent,
    ).toBe(server.url);
    expect(
      container.querySelector("[data-api-local-server-docs-host-disclaimer]")
        ?.textContent,
    ).toBe(API_LOCAL_SERVER_DOCS_HOST_DISCLAIMER);
    expect(
      container.querySelector("[data-api-static-examples-note]")?.textContent,
    ).toContain("static");
    expect(container.querySelector('button[type="submit"]')).toBeNull();
    expect(container.textContent).not.toMatch(/\bSend\b/);
    expect(container.textContent?.toLowerCase()).not.toContain("try it");
  });
});

describe("ApiNavigationVerificationHarness playground suppression", () => {
  test("shows local server notice and omits live-execution controls", () => {
    const { model } = buildApiOperationNavigationFromArtifact();
    const { byAnchor } = buildApiOperationDetailsFromArtifact();
    const { primary } = buildApiLocalServerBaseUrlFromArtifact();
    expect(primary).toBeDefined();

    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={byAnchor}
        localServerBaseUrl={primary}
        model={model}
      />,
    );

    const root = container.querySelector(
      "[data-api-navigation-verification-harness]",
    );
    expect(root?.getAttribute(API_PLAYGROUND_SUPPRESSED_ATTR)).toBe("true");
    expect(screen.getByTestId("api-local-server-base-url")).toBeTruthy();
    expect(screen.getByText("http://localhost:7437")).toBeTruthy();
    expect(
      screen.getByText(API_LOCAL_SERVER_DOCS_HOST_DISCLAIMER),
    ).toBeTruthy();

    // No Send / try-it / credential-entry controls on the production surface.
    expect(container.querySelector('button[type="submit"]')).toBeNull();
    expect(container.querySelector('[data-type="authorization"]')).toBeNull();
    expect(container.querySelector('input[type="password"]')).toBeNull();
    expect(
      container.querySelector('button, [role="button"]')?.textContent,
    ).not.toMatch(/^Send$/);
    const submitLike = Array.from(
      container.querySelectorAll("button, [role='button']"),
    ).filter((el) => /^\s*Send\s*$/i.test(el.textContent ?? ""));
    expect(submitLike).toHaveLength(0);
    const tryIt = Array.from(
      container.querySelectorAll("button, [role='button'], a"),
    ).filter((el) => /try\s*it/i.test(el.textContent ?? ""));
    expect(tryIt).toHaveLength(0);

    // Static authored examples remain without requiring a live Factory host.
    expect(
      container.querySelector("[data-api-examples='present']"),
    ).toBeTruthy();
  });
});
