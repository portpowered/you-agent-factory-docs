import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { ApiSurface } from "./api-surface";

afterEach(() => {
  cleanup();
});

describe("ApiSurface", () => {
  test("renders accessible loading status when not ready", () => {
    const { getByRole, getByTestId } = render(
      <ApiSurface status="loading">
        <p>hidden while loading</p>
      </ApiSurface>,
    );

    const status = getByRole("status");
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toContain("Loading API reference");
    expect(getByTestId("api-surface").textContent).not.toContain(
      "hidden while loading",
    );
  });

  test("renders children when ready", () => {
    const { getByTestId, queryByRole } = render(
      <ApiSurface status="ready">
        <p>API operations ready</p>
      </ApiSurface>,
    );

    expect(getByTestId("api-surface").getAttribute("data-api-status")).toBe(
      "ready",
    );
    expect(getByTestId("api-surface").textContent).toContain(
      "API operations ready",
    );
    expect(queryByRole("status")).toBeNull();
  });

  test("renders empty status messaging", () => {
    const { getByRole } = render(<ApiSurface status="empty" />);
    expect(getByRole("status").textContent).toContain("No API operations");
  });
});
