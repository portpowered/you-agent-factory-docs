import { describe, expect, test } from "bun:test";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { Checkbox } from "../../src/components/ui/checkbox";
import { Dialog } from "../../src/components/ui/dialog";
import { Icon } from "../../src/components/ui/icon";
import { Alert, Banner } from "../../src/components/ui/notice";
import { Selector } from "../../src/components/ui/selector";
import { renderWithLocalization } from "../helpers/render-with-localization";

describe("UI primitive components", () => {
  test("renders semantic icons only when asked and hides decorative icons otherwise", () => {
    const { container } = renderWithLocalization(
      <div>
        <Icon name="spark" />
        <Icon decorative={false} name="info" title="Information" />
      </div>,
    );

    expect(screen.getByRole("img", { name: "Information" })).toBeTruthy();
    expect(container.querySelectorAll("svg[aria-hidden='true']").length).toBe(
      1,
    );
  });

  test("selector uses a typed radio contract and updates the selected value accessibly", () => {
    function SelectorHarness() {
      const [value, setValue] = useState<"guided" | "review">("guided");

      return (
        <Selector
          description="Choose one lane."
          label="Workflow mode"
          onValueChange={setValue}
          options={[
            { label: "Guided setup", value: "guided" },
            { label: "Review queue", value: "review" },
          ]}
          value={value}
        />
      );
    }

    renderWithLocalization(<SelectorHarness />);

    const guided = screen.getByLabelText("Guided setup") as HTMLInputElement;
    const review = screen.getByLabelText("Review queue") as HTMLInputElement;

    expect(guided.checked).toBe(true);
    expect(review.checked).toBe(false);

    fireEvent.click(review);

    expect(guided.checked).toBe(false);
    expect(review.checked).toBe(true);
  });

  test("checkbox exposes helper text and validation messaging", () => {
    renderWithLocalization(
      <Checkbox
        checked={false}
        description="Helper copy"
        errorMessage="Resolve this requirement first."
        label="Ready for review"
        onCheckedChange={() => {}}
      />,
    );

    const checkbox = screen.getByLabelText("Ready for review");

    expect(checkbox.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Helper copy")).toBeTruthy();
    expect(screen.getByText("Resolve this requirement first.")).toBeTruthy();
  });

  test("banner and alert expose status text without depending on color alone", () => {
    renderWithLocalization(
      <div>
        <Banner title="Banner title" tone="info">
          <p>Banner body</p>
        </Banner>
        <Alert title="Alert title" tone="warning">
          <p>Alert body</p>
        </Alert>
      </div>,
    );

    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Banner title")).toBeTruthy();
    expect(screen.getByText("Alert title")).toBeTruthy();
  });

  test("dialog closes on Escape and restores focus to the triggering control", async () => {
    function DialogHarness() {
      const [open, setOpen] = useState(false);

      return (
        <div>
          <button onClick={() => setOpen(true)} type="button">
            Open dialog
          </button>
          <Dialog
            closeLabel="Dismiss dialog"
            footer={<button type="button">Close detail view</button>}
            onOpenChange={setOpen}
            open={open}
            title="Dialog title"
          >
            <Banner title="Loaded state" tone="success">
              <p>Dialog content</p>
            </Banner>
          </Dialog>
        </div>
      );
    }

    renderWithLocalization(<DialogHarness />);

    const trigger = screen.getByRole("button", { name: "Open dialog" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Dialog title" });

    expect(dialog).toBeTruthy();
    expect(
      document.activeElement === dialog ||
        document.activeElement?.getAttribute("aria-label") === "Dismiss dialog",
    ).toBe(true);

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Dialog title" })).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });
});
