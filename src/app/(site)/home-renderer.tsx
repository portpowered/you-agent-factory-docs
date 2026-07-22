import { SearchTrigger } from "@/features/docs/search/SearchTrigger";
import { LandingPage } from "@/features/landing-page/LandingPage";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import { composeProductionLandingSlots } from "./compose-production-landing-slots";

/**
 * Keep the landing-only client graph outside the shared docs renderer so
 * reference pages do not inherit carousel, particle, or hero interaction JS.
 */
export async function renderHomePage(locale: SiteLocale = defaultLocale) {
  const messages = await loadUiMessages(locale);
  return (
    <LandingPage
      {...composeProductionLandingSlots(
        undefined,
        process.env,
        <SearchTrigger
          className="!h-8 !border-[#ecece4]/25 !bg-transparent !text-[#ecece4]/75 hover:!text-[#191f2b]"
          messages={messages}
        />,
      )}
    />
  );
}
