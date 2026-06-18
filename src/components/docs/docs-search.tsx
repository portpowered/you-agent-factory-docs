"use client";

import { joinClassNames } from "@/lib/classnames";
import type {
  PublicSearchOramaHit,
  PublicSearchOramaIndex,
} from "@/lib/content/orama-search";
import {
  createPublicSearchOramaIndex,
  searchPublicSearchOramaIndex,
} from "@/lib/content/orama-search";
import { parsePublicSearchArtifact } from "@/lib/content/parse-public-search-artifact";
import { withBasePath } from "@/lib/site";
import { useLocale } from "@/localization/hooks/use-locale";
import { useMessages } from "@/localization/hooks/use-messages";
import Link from "next/link";
import { useEffect, useState } from "react";

type SearchIndexState =
  | {
      status: "loading";
    }
  | {
      status: "error";
    }
  | {
      status: "ready";
      index: PublicSearchOramaIndex;
    };

type SearchResultState =
  | {
      status: "idle";
    }
  | {
      status: "searching";
    }
  | {
      status: "error";
    }
  | {
      status: "empty";
    }
  | {
      status: "success";
      hits: PublicSearchOramaHit[];
      count: number;
    };

const PUBLIC_SEARCH_ARTIFACT_PATH = withBasePath(
  "/search/public-search-index.json",
);
const SEARCH_RESULT_LIMIT = 5;
const SEARCH_STATUS_CLASS_NAME = "m-0 text-sm text-muted-foreground";
const SEARCH_ERROR_CLASS_NAME = "text-red-600 dark:text-red-400";

export function DocsSearch() {
  const locale = useLocale();
  const { t } = useMessages();
  const [query, setQuery] = useState("");
  const [indexState, setIndexState] = useState<SearchIndexState>({
    status: "loading",
  });
  const [resultState, setResultState] = useState<SearchResultState>({
    status: "idle",
  });

  useEffect(() => {
    let isCancelled = false;

    async function loadIndex() {
      try {
        const response = await fetch(PUBLIC_SEARCH_ARTIFACT_PATH);

        if (!response.ok) {
          throw new Error(
            `Search artifact request failed with ${response.status}`,
          );
        }

        const source = await response.text();
        const artifact = parsePublicSearchArtifact(source);
        const index = await createPublicSearchOramaIndex(artifact);

        if (isCancelled) {
          return;
        }

        setIndexState({
          status: "ready",
          index,
        });
      } catch {
        if (isCancelled) {
          return;
        }

        setIndexState({
          status: "error",
        });
      }
    }

    void loadIndex();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (indexState.status !== "ready") {
      return;
    }

    const readyIndex = indexState.index;

    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
      setResultState({
        status: "idle",
      });
      return;
    }

    async function runSearch() {
      setResultState({
        status: "searching",
      });

      try {
        const result = await searchPublicSearchOramaIndex(readyIndex, {
          term: trimmedQuery,
          locale,
          limit: SEARCH_RESULT_LIMIT,
        });

        if (isCancelled) {
          return;
        }

        if (result.count === 0) {
          setResultState({
            status: "empty",
          });
          return;
        }

        setResultState({
          status: "success",
          hits: result.hits,
          count: result.count,
        });
      } catch {
        if (isCancelled) {
          return;
        }

        setResultState({
          status: "error",
        });
      }
    }

    void runSearch();

    return () => {
      isCancelled = true;
    };
  }, [indexState, locale, query]);

  return (
    <section
      aria-labelledby="docs-search-title"
      className="mb-6 grid gap-4 rounded-xl border bg-card p-4"
    >
      <div className="grid gap-4">
        <div>
          <h2
            className="m-0 text-base font-semibold text-foreground"
            id="docs-search-title"
          >
            {t("docs.searchTitle")}
          </h2>
          <p className="mb-0 mt-1 text-sm text-muted-foreground">
            {t("docs.searchHelperText")}
          </p>
        </div>
        <form
          aria-labelledby="docs-search-title"
          className="grid gap-2"
          onSubmit={(event) => event.preventDefault()}
        >
          <label
            className="text-sm font-semibold text-foreground"
            htmlFor="docs-search-input"
          >
            {t("docs.searchLabel")}
          </label>
          <input
            className="min-h-11 rounded-lg border bg-background px-3.5 py-3 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            id="docs-search-input"
            name="docs-search-input"
            placeholder={t("docs.searchPlaceholder")}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </form>
      </div>

      {indexState.status === "loading" ? (
        <p aria-live="polite" className={SEARCH_STATUS_CLASS_NAME}>
          {t("docs.searchLoading")}
        </p>
      ) : null}

      {indexState.status === "error" ? (
        <p
          aria-live="polite"
          className={joinClassNames(
            SEARCH_STATUS_CLASS_NAME,
            SEARCH_ERROR_CLASS_NAME,
          )}
        >
          {t("docs.searchError")}
        </p>
      ) : null}

      {indexState.status === "ready" && resultState.status === "idle" ? (
        <p aria-live="polite" className={SEARCH_STATUS_CLASS_NAME}>
          {t("docs.searchEmptyQuery")}
        </p>
      ) : null}

      {indexState.status === "ready" && resultState.status === "searching" ? (
        <p aria-live="polite" className={SEARCH_STATUS_CLASS_NAME}>
          {t("docs.searchSearching")}
        </p>
      ) : null}

      {indexState.status === "ready" && resultState.status === "error" ? (
        <p
          aria-live="polite"
          className={joinClassNames(
            SEARCH_STATUS_CLASS_NAME,
            SEARCH_ERROR_CLASS_NAME,
          )}
        >
          {t("docs.searchError")}
        </p>
      ) : null}

      {indexState.status === "ready" && resultState.status === "empty" ? (
        <p aria-live="polite" className={SEARCH_STATUS_CLASS_NAME}>
          {t("docs.searchNoResults")}
        </p>
      ) : null}

      {indexState.status === "ready" && resultState.status === "success" ? (
        <div className="grid gap-3">
          <p aria-live="polite" className={SEARCH_STATUS_CLASS_NAME}>
            {resultState.count} {t("docs.searchResultsLabel")}
          </p>
          <ul className="m-0 grid list-none gap-3 p-0">
            {resultState.hits.map((hit) => (
              <li className="rounded-lg border bg-card" key={hit.id}>
                <Link
                  className="group grid gap-1.5 rounded-lg px-4 py-3 no-underline transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  href={hit.entry.url}
                >
                  <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-accent group-hover:underline">
                    {hit.entry.title}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {hit.entry.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
