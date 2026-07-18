"use client";

import Link from "next/link";
import { MissingMessageKey } from "@/features/docs/components/MissingMessageKey";
import { usePageMessages } from "@/features/docs/components/page-messages-context";
import { Section } from "@/features/docs/components/Section";
import { T } from "@/features/docs/components/T";
import { lookupMessage } from "@/lib/content/messages";
import { findDocumentationRouteMigrationByOldRoute } from "@/lib/seo/documentation-route-migration";

/**
 * Static-export-safe compatibility document for a plan §10 old documentation
 * route. Renders at the inbound URL and links to the ledger target family route
 * without relying on server redirects.
 */
export function DocumentationRouteCompatibilityDocument({
  oldRoute,
}: {
  oldRoute: string;
}) {
  const row = findDocumentationRouteMigrationByOldRoute(oldRoute);
  const { messages, isDev } = usePageMessages();

  if (!row) {
    return (
      <p data-documentation-route-compatibility-error="" role="alert">
        Unknown documentation migration route: {oldRoute}
      </p>
    );
  }

  const labelResult = lookupMessage(messages, "links.targetLabel");

  return (
    <div
      data-documentation-route-compatibility=""
      data-compatibility-old-route={row.oldRoute}
      data-compatibility-target-route={row.targetRoute}
    >
      <Section id="moved" titleKey="sections.moved.title">
        <T k="sections.moved.body" />
        <p className="mt-3">
          <Link href={row.targetRoute} data-compatibility-target-link="">
            {labelResult.ok ? (
              labelResult.value
            ) : isDev ? (
              <MissingMessageKey
                messageKey="links.targetLabel"
                reason={labelResult.reason}
              />
            ) : (
              row.targetRoute
            )}
          </Link>
          <span className="text-muted-foreground"> ({row.targetRoute})</span>
        </p>
      </Section>
    </div>
  );
}
