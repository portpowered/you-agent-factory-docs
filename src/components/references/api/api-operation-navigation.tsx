"use client";

/**
 * Responsive composition of desktop + mobile tag-grouped operation navigators
 * with method/path/summary/operation-ID filtering.
 *
 * Desktop (`lg+`) shows {@link ApiOperationNavigator}; phone/tablet show
 * {@link ApiReferenceMobileNavigator} collapsed by default. Filter state is
 * UI-only — the original nav model is never mutated.
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ApiOperationFilter } from "./api-operation-filter";
import { ApiOperationNavigator } from "./api-operation-navigator";
import { ApiReferenceMobileNavigator } from "./api-reference-mobile-navigator";
import { ApiStatus } from "./api-status";
import {
  API_OPERATION_FILTER_EMPTY_MESSAGE,
  API_OPERATION_FILTER_EMPTY_TITLE,
  apiOperationFilterHasNoMatches,
  filterApiOperationNavModel,
} from "./operation-filter";
import type {
  ApiOperationNavGroup,
  ApiOperationNavModel,
} from "./operation-navigation";

export type ApiOperationNavigationProps = {
  groups: readonly ApiOperationNavGroup[];
  model?: ApiOperationNavModel;
  /** When true (default), show the method/path/summary/operation-ID filter. */
  showFilter?: boolean;
  /** Controlled filter query. */
  filterQuery?: string;
  /** Uncontrolled initial filter query. */
  defaultFilterQuery?: string;
  /** Fires when the filter query changes. */
  onFilterQueryChange?: (query: string) => void;
  className?: string;
  "data-testid"?: string;
};

function resolveModel(
  groups: readonly ApiOperationNavGroup[],
  model?: ApiOperationNavModel,
): ApiOperationNavModel {
  if (model !== undefined) {
    return model;
  }
  const linkCount = groups.reduce((sum, group) => sum + group.items.length, 0);
  const operationCount = new Set(
    groups.flatMap((group) => group.items.map((item) => item.id)),
  ).size;
  return { groups, linkCount, operationCount };
}

/**
 * Tag-grouped operation navigation for the production API reference surface,
 * with keyboard-operable filtering.
 */
export function ApiOperationNavigation({
  groups,
  model,
  showFilter = true,
  filterQuery,
  defaultFilterQuery = "",
  onFilterQueryChange,
  className,
  "data-testid": testId = "api-operation-navigation",
}: ApiOperationNavigationProps) {
  const sourceModel = resolveModel(groups, model);
  const [uncontrolledQuery, setUncontrolledQuery] =
    useState(defaultFilterQuery);
  const isControlled = filterQuery !== undefined;
  const query = isControlled ? filterQuery : uncontrolledQuery;

  function setQuery(next: string) {
    if (!isControlled) {
      setUncontrolledQuery(next);
    }
    onFilterQueryChange?.(next);
  }

  const filteredModel = useMemo(
    () => filterApiOperationNavModel(sourceModel, query),
    [sourceModel, query],
  );
  const noMatches = apiOperationFilterHasNoMatches(sourceModel, query);

  return (
    <div
      className={cn("min-w-0 space-y-3", className)}
      data-testid={testId}
      data-api-operation-navigation=""
      data-api-operation-filter-active={
        query.trim().length > 0 ? "true" : "false"
      }
    >
      {showFilter ? (
        <ApiOperationFilter
          onQueryChange={setQuery}
          resultCount={filteredModel.operationCount}
          totalCount={sourceModel.operationCount}
          value={query}
        />
      ) : null}

      {noMatches ? (
        <div data-testid={`${testId}-filter-empty`}>
          <ApiStatus
            kind="empty"
            message={API_OPERATION_FILTER_EMPTY_MESSAGE}
            title={API_OPERATION_FILTER_EMPTY_TITLE}
          />
        </div>
      ) : (
        <>
          <ApiOperationNavigator
            className="hidden lg:block"
            groups={filteredModel.groups}
            model={filteredModel}
          />
          <ApiReferenceMobileNavigator
            className="lg:hidden"
            groups={filteredModel.groups}
            model={filteredModel}
          />
        </>
      )}
    </div>
  );
}
