import { afterEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { PublicSearchPanel } from "../../src/components/search/public-search-panel";
import type { PublicSearchArtifact } from "../../src/lib/content";
import { renderWithLocalization } from "../helpers/render-with-localization";

const artifact: PublicSearchArtifact = {
  version: 1,
  entries: [
    {
      id: "glossary/agent@en",
      canonicalId: "glossary/agent",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "glossary",
      url: "/glossary/agent",
      title: "Agent",
      description: "Definition of an AI agent in the factory documentation.",
      headings: ["What is an agent?"],
      body: "An agent is a model-guided worker that can act on tools and files.",
      tags: ["agent", "glossary"],
      section: "glossary",
      searchPriority: 9,
    },
  ],
};

function createArtifactResponse(): Response {
  return new Response(JSON.stringify(artifact), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function submitQuery(query: string) {
  fireEvent.change(screen.getByRole("searchbox", { name: "Search query" }), {
    target: { value: query },
  });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
}

afterEach(() => {
  mock.restore();
});

describe("public search panel", () => {
  test("renders success results from the generated public search artifact", async () => {
    globalThis.fetch = mock(async () =>
      createArtifactResponse(),
    ) as unknown as typeof fetch;

    renderWithLocalization(<PublicSearchPanel />);

    submitQuery("agent");

    expect(
      await screen.findByRole("heading", { name: "Results" }),
    ).toBeTruthy();
    expect(screen.getByText("Agent")).toBeTruthy();
    expect(
      screen.getByText(
        "Definition of an AI agent in the factory documentation.",
      ),
    ).toBeTruthy();
  });

  test("renders a loading state while the artifact request is pending", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    const pendingFetch = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    globalThis.fetch = mock(
      async () => pendingFetch,
    ) as unknown as typeof fetch;

    renderWithLocalization(<PublicSearchPanel />);

    submitQuery("agent");

    expect(
      screen.getByRole("heading", { name: "Loading search results" }),
    ).toBeTruthy();

    resolveFetch?.(createArtifactResponse());

    await screen.findByText("Agent");
  });

  test("renders an empty state when the artifact returns no matches", async () => {
    globalThis.fetch = mock(async () =>
      createArtifactResponse(),
    ) as unknown as typeof fetch;

    renderWithLocalization(<PublicSearchPanel />);

    submitQuery("missing");

    expect(
      await screen.findByRole("heading", { name: "No matching results" }),
    ).toBeTruthy();
  });

  test("renders an error state when the artifact cannot be loaded", async () => {
    globalThis.fetch = mock(
      async () => new Response("missing", { status: 500 }),
    ) as unknown as typeof fetch;

    renderWithLocalization(<PublicSearchPanel />);

    submitQuery("agent");

    expect(
      await screen.findByRole("heading", { name: "Search unavailable" }),
    ).toBeTruthy();
    await waitFor(() => {
      expect(
        screen.getByText(
          "The generated public search artifact could not be loaded for this request.",
        ),
      ).toBeTruthy();
    });
  });
});
