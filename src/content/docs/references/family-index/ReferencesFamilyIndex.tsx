import type { PageMessages } from "@/lib/content/schemas";

type ReferencesFamilyIndexProps = {
  messages: PageMessages;
};

/**
 * Authored `/docs/references` family index shell: isolation-first introduction.
 * Discoverability cards and package freshness summary land in later stories.
 */
export function ReferencesFamilyIndex({
  messages,
}: ReferencesFamilyIndexProps) {
  const introduction = messages.sections?.introduction;
  const openingSummary = messages.openingSummary;

  return (
    <div data-references-family-index="">
      {openingSummary ? (
        <p className="text-base text-muted-foreground">{openingSummary}</p>
      ) : null}
      {introduction ? (
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
      ) : null}
    </div>
  );
}
