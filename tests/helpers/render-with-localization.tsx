import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { LocalizationProvider } from "../../src/localization/context/localization-context";

type RenderWithLocalizationOptions = Omit<RenderOptions, "wrapper"> & {
  locale?: string;
};

export function renderWithLocalization(
  ui: ReactElement,
  options?: RenderWithLocalizationOptions,
) {
  const { locale, ...renderOptions } = options ?? {};

  return render(ui, {
    wrapper: ({ children }) => (
      <LocalizationProvider locale={locale}>{children}</LocalizationProvider>
    ),
    ...renderOptions,
  });
}
