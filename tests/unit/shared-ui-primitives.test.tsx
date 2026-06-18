import { describe, expect, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  getButtonClassName,
} from "../../src/components/ui";

describe("shared UI tabs", () => {
  test("switches shared tab panels with click and keyboard navigation", () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList aria-label="Shared tab list">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="checks">Checks</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="usage">Usage content</TabsContent>
        <TabsContent value="checks">Checks content</TabsContent>
      </Tabs>,
    );

    const overviewTab = screen.getByRole("tab", { name: "Overview" });
    const usageTab = screen.getByRole("tab", { name: "Usage" });

    expect(overviewTab.getAttribute("aria-selected")).toBe("true");
    expect(usageTab.getAttribute("tabindex")).toBe("-1");

    fireEvent.keyDown(overviewTab, { key: "ArrowRight" });
    expect(document.activeElement).toBe(usageTab);
    expect(usageTab.getAttribute("aria-selected")).toBe("true");

    fireEvent.click(screen.getByRole("tab", { name: "Checks" }));
    expect(screen.getByRole("tabpanel", { name: "Checks" })).toBeTruthy();
  });
});

describe("shared UI accordion", () => {
  test("toggles accordion content through accessible trigger buttons", () => {
    render(
      <Accordion defaultValue="first">
        <AccordionItem value="first">
          <AccordionTrigger>First section</AccordionTrigger>
          <AccordionContent>First body</AccordionContent>
        </AccordionItem>
        <AccordionItem value="second">
          <AccordionTrigger>Second section</AccordionTrigger>
          <AccordionContent>Second body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const firstTrigger = screen.getByRole("button", { name: "First section" });
    const secondTrigger = screen.getByRole("button", {
      name: "Second section",
    });

    expect(firstTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("region", { name: "First section" })).toBeTruthy();

    fireEvent.click(secondTrigger);
    expect(secondTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("region", { name: "Second section" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "First section" })).toBeNull();
  });
});

describe("shared UI dialog", () => {
  test("opens, labels, and closes the shared dialog overlay", () => {
    render(
      <Dialog>
        <DialogTrigger className={getButtonClassName()}>
          Open shared dialog
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verification dialog</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              className={getButtonClassName({ variant: "secondary" })}
            >
              Close dialog
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open shared dialog" }));

    const dialog = screen.getByRole("dialog", { name: "Verification dialog" });
    expect(within(dialog).getByText("Dialog description")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
