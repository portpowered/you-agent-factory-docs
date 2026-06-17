"use client";

import type { PublicSearchArtifact } from "@/lib/content";
import {
  fetchPublicSearchArtifact,
  searchPublicSearchArtifact,
} from "@/lib/search/public-search";
import { useLocale } from "@/localization";
import { useMessages } from "@/localization/hooks/use-messages";
import { type FormEvent, useRef, useState } from "react";

type SearchPanelStatus = "idle" | "loading" | "success" | "error";

type SearchPanelState = {
  status: SearchPanelStatus;
  submittedQuery: string;
  errorMessage?: string;
};

const INITIAL_STATE: SearchPanelState = {
  status: "idle",
  submittedQuery: "",
};

type ResultLinkLabelProps = {
  href: string;
  title: string;
};

function ResultLinkLabel({ href, title }: ResultLinkLabelProps) {
  return (
    <span className="public-search__result-link-label">
      <span>{title}</span>
      <span className="public-search__result-url">{href}</span>
    </span>
  );
}

export function PublicSearchPanel() {
  const { t } = useMessages();
  const locale = useLocale();
  const artifactRef = useRef<PublicSearchArtifact | null>(null);
  const requestIdRef = useRef(0);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchPanelState>(INITIAL_STATE);
  const [results, setResults] = useState<
    ReturnType<typeof searchPublicSearchArtifact>
  >([]);

  const trimmedQuery = query.trim();

  async function loadArtifact(): Promise<PublicSearchArtifact> {
    if (artifactRef.current) {
      return artifactRef.current;
    }

    const artifact = await fetchPublicSearchArtifact();
    artifactRef.current = artifact;
    return artifact;
  }

  async function submitSearch(searchQuery: string): Promise<void> {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setState({
      status: "loading",
      submittedQuery: searchQuery,
    });

    try {
      const artifact = await loadArtifact();
      const nextResults = searchPublicSearchArtifact(artifact, searchQuery, {
        limit: 8,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setResults(nextResults);
      setState({
        status: "success",
        submittedQuery: searchQuery,
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setResults([]);
      setState({
        status: "error",
        submittedQuery: searchQuery,
        errorMessage:
          error instanceof Error ? error.message : t("docs.search.errorBody"),
      });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (trimmedQuery.length === 0) {
      setResults([]);
      setState(INITIAL_STATE);
      return;
    }

    void submitSearch(trimmedQuery);
  }

  return (
    <section
      aria-labelledby="public-search-title"
      className="public-search docs-shell__search"
    >
      <div className="public-search__intro">
        <p className="public-search__eyebrow">{t("docs.search.eyebrow")}</p>
        <h2 id="public-search-title">{t("docs.search.title")}</h2>
        <p className="public-search__description">
          {t("docs.search.description")}
        </p>
      </div>
      <form
        aria-describedby="public-search-help"
        className="public-search__form"
        onSubmit={handleSubmit}
      >
        <label className="public-search__label" htmlFor="public-search-query">
          {t("docs.search.label")}
        </label>
        <div className="public-search__controls">
          <input
            aria-label={t("docs.search.label")}
            className="public-search__input"
            id="public-search-query"
            name="query"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={t("docs.search.placeholder")}
            type="search"
            value={query}
          />
          <button
            className="public-search__submit"
            disabled={trimmedQuery.length === 0 || state.status === "loading"}
            type="submit"
          >
            {state.status === "loading"
              ? t("docs.search.loadingButtonLabel")
              : t("docs.search.submitLabel")}
          </button>
        </div>
        <p className="public-search__help" id="public-search-help">
          {t("docs.search.helperText")} {locale.toUpperCase()}
        </p>
      </form>
      <div className="public-search__results" data-state={state.status}>
        {state.status === "idle" ? (
          <p className="public-search__placeholder">
            {t("docs.search.idleBody")}
          </p>
        ) : null}
        {state.status === "loading" ? (
          <div aria-live="polite" className="public-search__status-card">
            <h3>{t("docs.search.loadingTitle")}</h3>
            <p>{t("docs.search.loadingBody")}</p>
          </div>
        ) : null}
        {state.status === "error" ? (
          <div className="public-search__status-card" role="alert">
            <h3>{t("docs.search.errorTitle")}</h3>
            <p>{t("docs.search.errorBody")}</p>
            {state.errorMessage ? (
              <p className="public-search__error-detail">
                {state.errorMessage}
              </p>
            ) : null}
          </div>
        ) : null}
        {state.status === "success" && results.length === 0 ? (
          <div aria-live="polite" className="public-search__status-card">
            <h3>{t("docs.search.emptyTitle")}</h3>
            <p>{t("docs.search.emptyBody")}</p>
          </div>
        ) : null}
        {state.status === "success" && results.length > 0 ? (
          <div className="public-search__success">
            <div className="public-search__results-summary">
              <h3>{t("docs.search.resultsTitle")}</h3>
              <p>
                {t("docs.search.resultsSummary")}{" "}
                <strong>{state.submittedQuery}</strong>
              </p>
            </div>
            <ul className="public-search__result-list">
              {results.map((result) => (
                <li
                  className="public-search__result-item"
                  key={result.entry.id}
                >
                  <a
                    className="public-search__result-link"
                    href={result.entry.url}
                  >
                    <ResultLinkLabel
                      href={result.entry.url}
                      title={result.entry.title}
                    />
                  </a>
                  <p className="public-search__result-preview">
                    {result.preview}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
