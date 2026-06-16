import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { LocalizationProvider } from "../../src/localization/context/localization-context";

export function renderWithLocalization(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <LocalizationProvider>{children}</LocalizationProvider>
    ),
    ...options,
  });
}
