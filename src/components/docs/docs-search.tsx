"use client";

import { Input, Label } from "@/components/ui";
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
    <section aria-labelledby="docs-search-title" className="docs-search">
      <div className="docs-search__header">
        <div>
          <h2 className="docs-search__title" id="docs-search-title">
            {t("docs.searchTitle")}
          </h2>
          <p className="docs-search__helper">{t("docs.searchHelperText")}</p>
        </div>
        <form
          aria-labelledby="docs-search-title"
          className="docs-search__form"
          onSubmit={(event) => event.preventDefault()}
        >
          <Label className="docs-search__label" htmlFor="docs-search-input">
            {t("docs.searchLabel")}
          </Label>
          <Input
            className="docs-search__input"
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
        <p aria-live="polite" className="docs-search__status">
          {t("docs.searchLoading")}
        </p>
      ) : null}

      {indexState.status === "error" ? (
        <p
          aria-live="polite"
          className="docs-search__status docs-search__status--error"
        >
          {t("docs.searchError")}
        </p>
      ) : null}

      {indexState.status === "ready" && resultState.status === "idle" ? (
        <p aria-live="polite" className="docs-search__status">
          {t("docs.searchEmptyQuery")}
        </p>
      ) : null}

      {indexState.status === "ready" && resultState.status === "searching" ? (
        <p aria-live="polite" className="docs-search__status">
          {t("docs.searchSearching")}
        </p>
      ) : null}

      {indexState.status === "ready" && resultState.status === "error" ? (
        <p
          aria-live="polite"
          className="docs-search__status docs-search__status--error"
        >
          {t("docs.searchError")}
        </p>
      ) : null}

      {indexState.status === "ready" && resultState.status === "empty" ? (
        <p aria-live="polite" className="docs-search__status">
          {t("docs.searchNoResults")}
        </p>
      ) : null}

      {indexState.status === "ready" && resultState.status === "success" ? (
        <div className="docs-search__results">
          <p aria-live="polite" className="docs-search__status">
            {resultState.count} {t("docs.searchResultsLabel")}
          </p>
          <ul className="docs-search__results-list">
            {resultState.hits.map((hit) => (
              <li key={hit.id} className="docs-search__result">
                <Link className="docs-search__result-link" href={hit.entry.url}>
                  <span className="docs-search__result-title">
                    {hit.entry.title}
                  </span>
                  <span className="docs-search__result-description">
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
