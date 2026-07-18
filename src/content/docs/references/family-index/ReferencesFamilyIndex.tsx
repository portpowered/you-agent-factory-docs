import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  bulletlessListClassName,
  docsResourceCardLinkClassName,
} from "@/features/docs/components/list-decoration";
import type { PageMessages } from "@/lib/content/schemas";
import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";
import type { ReferencesFamilyFreshnessSummary } from "./load-references-family-freshness";
import { ReferencesFamilyFreshnessSummaryView } from "./ReferencesFamilyFreshnessSummary";
import { resolveReferenceFamilyDiscoverabilityCards } from "./resolve-reference-family-discoverability";

type ReferencesFamilyIndexProps = {
  messages: PageMessages;
  freshness: ReferencesFamilyFreshnessSummary;
  /** Localized reference chrome for freshness field labels (W17). */
  chrome: ReferenceChromeMessages;
};

/**
 * Authored `/docs/references` family index: isolation-first introduction,
 * discoverability cards for all eight planned reference routes, and a
 * package/version freshness summary from the public API manifest.
 */
export function ReferencesFamilyIndex({
  messages,
  freshness,
  chrome,
}: ReferencesFamilyIndexProps) {
  const introduction = messages.sections?.introduction;
  const discoverability = messages.sections?.discoverability;
  const openingSummary = messages.openingSummary;
  const cards = resolveReferenceFamilyDiscoverabilityCards(messages);

  if (!discoverability?.title) {
    throw new Error(
      "References family index messages must define sections.discoverability.title for collection chrome.",
    );
  }
  if (!introduction?.title) {
    throw new Error(
      "References family index messages must define sections.introduction.title for collection chrome.",
    );
  }

  const discoverabilityHeadingId = "references-family-discoverability-heading";
  const listLabel = discoverability.title;

  return (
    <div data-references-family-index="">
      {openingSummary ? (
        <p className="text-base text-muted-foreground">{openingSummary}</p>
      ) : null}
      <section
        aria-labelledby="references-family-introduction-heading"
        className="mt-8"
        data-references-family-introduction=""
        id="introduction"
      >
        <h2
          className="font-serif text-lg font-semibold text-foreground"
          id="references-family-introduction-heading"
        >
          {introduction.title}
        </h2>
        {introduction.body ? (
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {introduction.body}
          </p>
        ) : null}
      </section>
      <ReferencesFamilyFreshnessSummaryView
        chrome={chrome}
        freshness={freshness}
        messages={messages}
      />
      <section
        aria-labelledby={discoverabilityHeadingId}
        className="mt-8"
        data-references-family-discoverability=""
        id="contract-surfaces"
      >
        <h2
          className="font-serif text-lg font-semibold text-foreground"
          id={discoverabilityHeadingId}
        >
          {discoverability.title}
        </h2>
        {discoverability.body ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {discoverability.body}
          </p>
        ) : null}
        <ul
          aria-label={listLabel}
          className={bulletlessListClassName("mt-4")}
          data-references-family-discoverability-list=""
        >
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                className={docsResourceCardLinkClassName}
                data-reference-family-route={card.id}
                href={card.href}
              >
                <span className="flex items-center gap-2 font-medium text-foreground">
                  {card.title}
                  <ArrowRight
                    aria-hidden
                    className="size-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                </span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {card.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
