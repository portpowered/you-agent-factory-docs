/**
 * Visible local-server base URL notice for the production API reference.
 *
 * Documents where readers should point clients (from OpenAPI `servers`) and
 * explicitly states that the docs host is not the API. Does not open network
 * connections or embed playground / credential controls.
 */

import { ContractDescriptionProse } from "@/lib/i18n/contract-description-prose";
import { cn } from "@/lib/utils";
import {
  API_LOCAL_SERVER_BASE_URL_ATTR,
  type ApiLocalServerBaseUrl,
} from "./local-server-base-url";

export type ApiLocalServerBaseUrlNoticeProps = {
  server: ApiLocalServerBaseUrl;
  className?: string;
  "data-testid"?: string;
};

export function ApiLocalServerBaseUrlNotice({
  server,
  className,
  "data-testid": testId = "api-local-server-base-url",
}: ApiLocalServerBaseUrlNoticeProps) {
  return (
    <aside
      aria-label="Local Factory API base URL"
      className={cn(
        "min-w-0 space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm",
        className,
      )}
      data-api-playground-suppressed=""
      data-testid={testId}
      {...{ [API_LOCAL_SERVER_BASE_URL_ATTR]: server.url }}
    >
      <h2 className="text-sm font-semibold text-foreground">
        Local server base URL
      </h2>
      <ContractDescriptionProse className="text-muted-foreground">
        {server.description}
      </ContractDescriptionProse>
      <p className="min-w-0">
        <span className="text-muted-foreground">Base URL: </span>
        <code
          className="break-all font-mono text-foreground"
          data-api-local-server-url=""
        >
          {server.url}
        </code>
      </p>
      <p
        className="text-muted-foreground"
        data-api-local-server-docs-host-disclaimer=""
      >
        {server.docsHostDisclaimer}
      </p>
      <p
        className="text-muted-foreground text-xs"
        data-api-static-examples-note=""
      >
        Request and response examples on this page are static. They do not
        require a reachable Factory host and do not send live requests from the
        documentation site.
      </p>
    </aside>
  );
}
