import { DOCS_ENTRY_ROUTE } from "@/lib/site";
import type { FetchLike } from "@/lib/static-export";

export type BudgetRouteTarget = {
  id: "homepage" | "docs-entry";
  label: string;
  route: "/" | typeof DOCS_ENTRY_ROUTE;
};

export type RouteBudgetMeasurement = {
  route: BudgetRouteTarget;
  requestUrl: string;
  status: number;
  htmlBytes: number;
  scriptTagCount: number;
  stylesheetLinkCount: number;
  imageCount: number;
  mainLandmarkPresent: boolean;
  titlePresent: boolean;
  h1Text: string | null;
};

export const SITE_BUDGET_ROUTE_TARGETS: BudgetRouteTarget[] = [
  {
    id: "homepage",
    label: "Homepage",
    route: "/",
  },
  {
    id: "docs-entry",
    label: "Docs entry",
    route: DOCS_ENTRY_ROUTE,
  },
];

export function resolveBudgetRouteUrl(
  baseUrl: string,
  route: BudgetRouteTarget["route"],
): string {
  const normalizedRoute = route === "/" ? "" : `${route.replace(/^\//, "")}/`;
  return new URL(normalizedRoute, baseUrl).toString();
}

export async function measureBudgetRoute(
  fetchHttp: FetchLike,
  baseUrl: string,
  route: BudgetRouteTarget,
): Promise<RouteBudgetMeasurement> {
  const requestUrl = resolveBudgetRouteUrl(baseUrl, route.route);
  const response = await fetchHttp(requestUrl, {
    signal: AbortSignal.timeout(10_000),
  });
  const html = await response.text();

  return {
    route,
    requestUrl,
    status: response.status,
    htmlBytes: Buffer.byteLength(html, "utf8"),
    scriptTagCount: countMatches(html, /<script\b/gi),
    stylesheetLinkCount: countMatches(
      html,
      /<link\b[^>]*rel=["']stylesheet["']/gi,
    ),
    imageCount: countMatches(html, /<img\b/gi),
    mainLandmarkPresent: /<main\b/i.test(html),
    titlePresent: /<title>[\s\S]*?<\/title>/i.test(html),
    h1Text: extractTextContent(html, "h1"),
  };
}

function countMatches(text: string, matcher: RegExp): number {
  return text.match(matcher)?.length ?? 0;
}

function extractTextContent(text: string, tagName: string): string | null {
  const match = text.match(
    new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  );

  if (!match) {
    return null;
  }

  return (
    match[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || null
  );
}
