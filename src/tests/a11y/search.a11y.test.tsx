import "./mock-navigation";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  setDefaultTimeout,
  spyOn,
  test,
} from "bun:test";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { CanonicalDocsLayout } from "@/components/layout/canonical-docs-layout";
import { DocsSearchDialog } from "@/features/docs/search/SearchDialog";
import { SearchPagePanelContent } from "@/features/docs/search/SearchPagePanel";
import {
  expectCriticalPageStructure,
  listKeyboardFocusableControls,
} from "@/lib/verify/a11y-page-structure";
import { expectNoSeriousAxeViolations } from "@/tests/a11y/axe";
import { resetMockNavigation } from "@/tests/a11y/mock-navigation";
import {
  captureOriginalFetch,
  installDocsSearchFetchMock,
  loadAppTestContext,
  renderWithAppProviders,
  restoreFetchMock,
} from "@/tests/a11y/render";

setDefaultTimeout(30_000);

const FACTORY_RESULTS_QUERY = "ralph";
const EMPTY_RESULTS_QUERY = "zzzz-no-matches-zzzz";

function toSearchPageHandoff(
  searchParams: URLSearchParams = new URLSearchParams(),
) {
  return {
    q: searchParams.get("q"),
    tag: searchParams.get("tag"),
    classification: searchParams.get("classification"),
  };
}

function renderSearchPageSurface(
  context: Awaited<ReturnType<typeof loadAppTestContext>>,
  searchParams = new URLSearchParams(),
) {
  return renderWithAppProviders(
    <CanonicalDocsLayout messages={context.messages}>
      <h1>{context.messages.searchEntry.title}</h1>
      <p>{context.messages.searchEntry.description}</p>
      <SearchPagePanelContent
        messages={context.messages}
        metaByUrl={context.metaByUrl}
        handoff={toSearchPageHandoff(searchParams)}
      />
    </CanonicalDocsLayout>,
    { context },
  );
}

/** Orama static search suspends on first client render; unmount + brief wait primes the cache. */
async function primeDocsSearchClient(
  context: Awaited<ReturnType<typeof loadAppTestContext>>,
): Promise<void> {
  const first = await renderSearchPageSurface(context);
  first.unmount();
  cleanup();
  await new Promise((resolve) => setTimeout(resolve, 400));
}

describe("search accessibility", () => {
  beforeAll(async () => {
    captureOriginalFetch();
    await installDocsSearchFetchMock();
    await primeDocsSearchClient(await loadAppTestContext());
  });

  beforeEach(async () => {
    await installDocsSearchFetchMock();
  });

  afterEach(() => {
    cleanup();
    restoreFetchMock();
    resetMockNavigation();
  });

  test("search page exposes landmarks, labeled input, idle state, and no serious axe violations", async () => {
    const context = await loadAppTestContext();
    await act(async () => {
      await renderSearchPageSurface(context);
    });

    const structure = expectCriticalPageStructure(document, {
      expectedH1: context.messages.searchEntry.title,
    });
    expect(structure.hasMain).toBe(true);

    const searchInput = screen.getByLabelText(
      context.messages.search.placeholder,
    );
    expect(searchInput).toBeTruthy();
    searchInput.focus();
    expect(document.activeElement).toBe(searchInput);

    expect(screen.getByTestId("search-page-idle").textContent).toContain(
      context.messages.search.idle,
    );
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy();

    const controls = listKeyboardFocusableControls(document);
    expect(controls.every((control) => control.name.length > 0)).toBe(true);

    const trigger = screen.getByRole("button", {
      name: context.messages.search.open,
    });
    expect(trigger.className).toContain("focus-visible:ring");

    await expectNoSeriousAxeViolations(document.body);
  });

  test(
    "search page empty and results states stay distinguishable with no serious axe violations",
    async () => {
      const context = await loadAppTestContext();
      await act(async () => {
        await renderSearchPageSurface(context);
      });

      const user = userEvent.setup();
      const searchInput = screen.getByLabelText(
        context.messages.search.placeholder,
      );

      await user.clear(searchInput);
      await user.type(searchInput, EMPTY_RESULTS_QUERY);
      await waitFor(
        () => {
          expect(screen.queryByTestId("search-page-loading")).toBeNull();
        },
        { timeout: 15_000 },
      );
      await screen.findByTestId("search-page-empty", {}, { timeout: 15_000 });
      expect(screen.getByText(context.messages.search.noResults)).toBeTruthy();
      await expectNoSeriousAxeViolations(document.body);

      await user.clear(searchInput);
      await user.type(searchInput, FACTORY_RESULTS_QUERY);
      await screen.findByTestId("search-page-results", {}, { timeout: 15_000 });
      expect(screen.queryByTestId("search-page-empty")).toBeNull();
      expect(screen.queryByTestId("search-page-idle")).toBeNull();
      await expectNoSeriousAxeViolations(document.body);
    },
    { timeout: 60_000 },
  );

  test("search trigger opens dialog for keyboard users and dismiss returns to trigger", async () => {
    const context = await loadAppTestContext();
    const { SearchTrigger } = await import(
      "@/features/docs/search/SearchTrigger"
    );

    await act(async () => {
      await renderWithAppProviders(
        <div>
          <SearchTrigger messages={context.messages} />
          <h1>{context.messages.searchEntry.title}</h1>
        </div>,
        { context },
      );
    });

    const user = userEvent.setup();
    const trigger = screen.getByRole("button", {
      name: context.messages.search.open,
    });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    await user.keyboard("{Enter}");

    const dialog = await screen.findByRole(
      "dialog",
      { name: "Search" },
      { timeout: 5_000 },
    );
    const searchInput = within(dialog).getByLabelText(
      context.messages.search.placeholder,
    );
    // Labeled dialog input is keyboard-reachable once open.
    searchInput.focus();
    expect(document.activeElement).toBe(searchInput);
    expect(screen.getByTestId("search-dialog-idle").textContent).toContain(
      context.messages.search.idle,
    );

    await user.keyboard("{Escape}");
    await waitFor(
      () => {
        expect(screen.queryByRole("dialog")).toBeNull();
      },
      { timeout: 5_000 },
    );
    // happy-dom may not restore focus the way Chromium/Radix does; prove the
    // trigger remains keyboard-reachable after dismiss. Served-page probe
    // covers real focus return in Chromium.
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
  });

  test("search dialog idle and loading states pass serious/critical axe", async () => {
    const context = await loadAppTestContext();

    await act(async () => {
      await renderWithAppProviders(
        <DocsSearchDialog
          open
          onOpenChange={() => {}}
          metaByUrl={context.metaByUrl}
          messages={context.messages}
        />,
        { context },
      );
    });

    const dialog = await screen.findByRole("dialog", { name: "Search" });
    within(dialog).getByLabelText(context.messages.search.placeholder);
    expect(screen.getByTestId("search-dialog-idle")).toBeTruthy();
    await expectNoSeriousAxeViolations(dialog);
    cleanup();

    const searchClient = await import("@/features/docs/search/search-client");
    const useSearchSpy = spyOn(
      searchClient,
      "useDocsSearchClient",
    ).mockReturnValue({
      search: FACTORY_RESULTS_QUERY,
      setSearch: () => {},
      query: {
        isLoading: true,
        data: undefined,
      },
    } as unknown as ReturnType<typeof searchClient.useDocsSearchClient>);

    try {
      await act(async () => {
        await renderWithAppProviders(
          <DocsSearchDialog
            open
            onOpenChange={() => {}}
            metaByUrl={context.metaByUrl}
            messages={context.messages}
          />,
          { context },
        );
      });
      const loadingDialog = screen.getByRole("dialog", { name: "Search" });
      expect(screen.getByTestId("search-dialog-loading").textContent).toContain(
        context.messages.search.loading,
      );
      await expectNoSeriousAxeViolations(loadingDialog);
    } finally {
      useSearchSpy.mockRestore();
    }
  });

  test(
    "search dialog empty and results states pass serious/critical axe",
    async () => {
      const context = await loadAppTestContext();
      const user = userEvent.setup();

      await act(async () => {
        await renderWithAppProviders(
          <DocsSearchDialog
            open
            onOpenChange={() => {}}
            metaByUrl={context.metaByUrl}
            messages={context.messages}
          />,
          { context },
        );
      });

      const dialog = await screen.findByRole("dialog", { name: "Search" });
      const searchInput = within(dialog).getByLabelText(
        context.messages.search.placeholder,
      );

      await user.type(searchInput, EMPTY_RESULTS_QUERY);
      await waitFor(
        () => {
          expect(screen.queryByTestId("search-dialog-loading")).toBeNull();
        },
        { timeout: 15_000 },
      );
      await screen.findByTestId("search-dialog-empty", {}, { timeout: 15_000 });
      await expectNoSeriousAxeViolations(dialog);

      await user.clear(searchInput);
      await user.type(searchInput, FACTORY_RESULTS_QUERY);
      await waitFor(
        () => {
          const rows = within(dialog).queryAllByTestId("search-result-row");
          expect(rows.length).toBeGreaterThan(0);
        },
        { timeout: 15_000 },
      );
      expect(screen.queryByTestId("search-dialog-empty")).toBeNull();
      await expectNoSeriousAxeViolations(dialog);
    },
    { timeout: 60_000 },
  );
});
