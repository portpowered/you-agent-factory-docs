import { describe, expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  APPROVED_COMPONENT_INTAKE_DECISIONS,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  ButtonLink,
  COMPONENT_INTAKE_DECISIONS,
  Card,
  CardDescription,
  CardTitle,
  DEFERRED_COMPONENT_INTAKE_DECISIONS,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Input,
  LOCAL_COMPONENT_INTAKE_IMPORT_PATH,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  getButtonClassName,
  getComponentIntakeDecision,
} from "../../src/components/ui";

describe("local component intake surface", () => {
  test("exports the approved local primitives through the stable barrel path", () => {
    render(
      <div>
        <Button>Run workflow</Button>
        <ButtonLink href="/docs">Read docs</ButtonLink>
        <Card aria-label="Component card">
          <CardTitle>Shared card title</CardTitle>
          <CardDescription>Shared card body</CardDescription>
        </Card>
        <Label htmlFor="surface-input">Shared label</Label>
        <Input id="surface-input" readOnly value="Shared input" />
        <Alert aria-label="Shared alert" variant="success">
          <AlertTitle>Shared alert title</AlertTitle>
          <AlertDescription>Shared alert body</AlertDescription>
        </Alert>
        <Accordion defaultValue="first">
          <AccordionItem value="first">
            <AccordionTrigger>Shared accordion trigger</AccordionTrigger>
            <AccordionContent>Shared accordion body</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Tabs defaultValue="overview">
          <TabsList aria-label="Shared tabs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Overview panel</TabsContent>
          <TabsContent value="details">Details panel</TabsContent>
        </Tabs>
        <Table aria-label="Shared table">
          <TableHeader>
            <TableRow>
              <TableHead>Primitive</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Button</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Dialog>
          <DialogTrigger className={getButtonClassName()}>
            Open dialog
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Shared dialog</DialogTitle>
            <DialogDescription>Dialog body</DialogDescription>
          </DialogContent>
        </Dialog>
      </div>,
    );

    expect(LOCAL_COMPONENT_INTAKE_IMPORT_PATH).toBe("@/components/ui");
    expect(screen.getByRole("button", { name: "Run workflow" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Read docs" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Component card" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Shared card title" }),
    ).toBeTruthy();
    expect(screen.getByText("Shared card body")).toBeTruthy();
    expect(screen.getByText("Shared label")).toBeTruthy();
    expect(screen.getByDisplayValue("Shared input")).toBeTruthy();
    expect(screen.getByRole("status", { name: "Shared alert" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Shared accordion trigger" }),
    ).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("table", { name: "Shared table" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("dialog", { name: "Shared dialog" })).toBeTruthy();
  });

  test("records reviewer-visible approved and deferred intake decisions", () => {
    expect(COMPONENT_INTAKE_DECISIONS).toHaveLength(3);
    expect(APPROVED_COMPONENT_INTAKE_DECISIONS).toHaveLength(1);
    expect(DEFERRED_COMPONENT_INTAKE_DECISIONS).toHaveLength(2);

    expect(getComponentIntakeDecision("shadcn-ui")).toEqual({
      library: "shadcn-ui",
      status: "approved",
      components: [
        "Accordion",
        "AccordionContent",
        "AccordionItem",
        "AccordionTrigger",
        "Alert",
        "AlertDescription",
        "AlertTitle",
        "Button",
        "ButtonLink",
        "Card",
        "CardDescription",
        "CardTitle",
        "Dialog",
        "DialogClose",
        "DialogContent",
        "DialogDescription",
        "DialogFooter",
        "DialogHeader",
        "DialogTitle",
        "DialogTrigger",
        "Input",
        "Label",
        "Table",
        "TableBody",
        "TableCaption",
        "TableCell",
        "TableHead",
        "TableHeader",
        "TableRow",
        "Tabs",
        "TabsContent",
        "TabsList",
        "TabsTrigger",
      ],
      rationale: expect.stringContaining("shared actions, form controls"),
    });

    expect(getComponentIntakeDecision("magic-ui")).toEqual({
      library: "magic-ui",
      status: "deferred",
      components: expect.arrayContaining([
        "animated spotlight and particle surfaces",
      ]),
      rationale: expect.stringContaining("reduced-motion behavior"),
    });

    expect(getComponentIntakeDecision("performative-ui")).toEqual({
      library: "performative-ui",
      status: "deferred",
      components: expect.arrayContaining([
        "animation-first presentational wrappers",
      ]),
      rationale: expect.stringContaining("GitHub Pages"),
    });
  });
});
