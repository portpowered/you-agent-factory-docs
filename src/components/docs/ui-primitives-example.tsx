"use client";

import {
  DocsContentCard,
  DocsContentSurface,
} from "@/components/docs/docs-content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardDescription,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  GradientText,
  Input,
  Label,
  Marquee,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  getButtonClassName,
} from "@/components/ui";
import {
  UI_PRESENTATIONAL_HEADING,
  UI_PRESENTATIONAL_INTRO,
  UI_PRIMITIVES_ACCORDION_HEADING,
  UI_PRIMITIVES_ALERT_HEADING,
  UI_PRIMITIVES_DIALOG_HEADING,
  UI_PRIMITIVES_FORM_HEADING,
  UI_PRIMITIVES_INTRO,
  UI_PRIMITIVES_NAVIGATION_HEADING,
  UI_PRIMITIVES_TABLE_HEADING,
  UI_PRIMITIVES_TITLE,
} from "@/lib/docs-primitives";

export function UIPrimitivesExample() {
  return (
    <DocsContentSurface aria-labelledby="ui-primitives-example-title">
      <DocsContentCard as="section">
        <h1
          className="m-0 text-[clamp(1.75rem,4vw,2.5rem)] leading-tight tracking-tight text-card-foreground"
          id="ui-primitives-example-title"
        >
          {UI_PRIMITIVES_TITLE}
        </h1>
        <p className="docs-content-lead docs-shell__framing">
          {UI_PRIMITIVES_INTRO}
        </p>
      </DocsContentCard>

      <section
        aria-labelledby="ui-primitives-form-heading"
        className="grid gap-4"
      >
        <h2 id="ui-primitives-form-heading">{UI_PRIMITIVES_FORM_HEADING}</h2>
        <Card className="grid gap-4 p-5 sm:p-6">
          <div className="grid gap-2">
            <Label htmlFor="reviewer-example-input">Reviewer label</Label>
            <Input
              defaultValue="Shared local imports keep docs interactions consistent."
              id="reviewer-example-input"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button>Primary action</Button>
            <Button variant="secondary">Secondary action</Button>
            <Button disabled>Disabled action</Button>
          </div>
        </Card>
      </section>

      <section
        aria-labelledby="ui-primitives-navigation-heading"
        className="grid gap-4"
      >
        <h2 id="ui-primitives-navigation-heading">
          {UI_PRIMITIVES_NAVIGATION_HEADING}
        </h2>
        <Tabs defaultValue="overview">
          <TabsList aria-label="Primitive navigation variants">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            Shared tab triggers stay keyboard reachable and use the same local
            import path as other reusable controls.
          </TabsContent>
          <TabsContent value="usage">
            Docs-site authors can swap tab content without re-implementing
            button state or tab semantics.
          </TabsContent>
          <TabsContent value="verification">
            Reviewers can confirm the current tab state directly on this docs
            route.
          </TabsContent>
        </Tabs>
      </section>

      <section
        aria-labelledby="ui-primitives-accordion-heading"
        className="grid gap-4"
      >
        <h2 id="ui-primitives-accordion-heading">
          {UI_PRIMITIVES_ACCORDION_HEADING}
        </h2>
        <Accordion defaultValue="compatibility">
          <AccordionItem value="compatibility">
            <AccordionTrigger>Compatibility guidance</AccordionTrigger>
            <AccordionContent>
              Keep local intake decisions tied to the static-export stack and
              avoid importing upstream pieces that still depend on request-time
              behavior.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="responsive">
            <AccordionTrigger>Responsive behavior</AccordionTrigger>
            <AccordionContent>
              Accordion content stacks vertically on narrow screens and remains
              readable inside the shared docs content width.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section
        aria-labelledby="ui-primitives-dialog-heading"
        className="grid gap-4"
      >
        <h2 id="ui-primitives-dialog-heading">
          {UI_PRIMITIVES_DIALOG_HEADING}
        </h2>
        <Dialog>
          <DialogTrigger className={getButtonClassName()}>
            Open reviewer dialog
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Static-safe overlay example</DialogTitle>
              <DialogDescription>
                This dialog stays client-only, keyboard dismissible, and local
                to the current docs route.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose
                className={getButtonClassName({ variant: "secondary" })}
              >
                Close
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      <section
        aria-labelledby="ui-primitives-alert-heading"
        className="grid gap-4"
      >
        <h2 id="ui-primitives-alert-heading">{UI_PRIMITIVES_ALERT_HEADING}</h2>
        <div className="grid gap-3">
          <Alert variant="success">
            <AlertTitle>Success state</AlertTitle>
            <AlertDescription>
              The local primitive surface is available through{" "}
              <code>@/components/ui</code>.
            </AlertDescription>
          </Alert>
          <Alert variant="error">
            <AlertTitle>Error state</AlertTitle>
            <AlertDescription>
              Deferred upstream components still need compatibility work before
              they should enter the approved local barrel.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <section
        aria-labelledby="ui-primitives-table-heading"
        className="grid gap-4"
      >
        <h2 id="ui-primitives-table-heading">{UI_PRIMITIVES_TABLE_HEADING}</h2>
        <Table>
          <TableCaption>
            Approved local primitive coverage for this iteration.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Primitive</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Button</TableCell>
              <TableCell>Approved</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Form</TableCell>
              <TableCell>Input and Label</TableCell>
              <TableCell>Approved</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Overlay</TableCell>
              <TableCell>Dialog</TableCell>
              <TableCell>Approved</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section
        aria-labelledby="ui-primitives-presentational-heading"
        className="grid gap-4"
      >
        <h2 id="ui-primitives-presentational-heading">
          {UI_PRESENTATIONAL_HEADING}
        </h2>
        <Card className="grid gap-6 overflow-hidden p-5 sm:p-6">
          <div className="grid gap-2">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.04em] text-muted-foreground">
              {UI_PRESENTATIONAL_INTRO}
            </p>
            <Marquee
              aria-label="Compatible Magic UI marquee examples"
              className="py-1"
              itemClassName="w-[min(19rem,80vw)]"
              pauseOnHover
            >
              <Card as="article" className="grid gap-2 p-4">
                <CardTitle className="text-lg">
                  Static-export safe motion
                </CardTitle>
                <CardDescription>
                  The approved local marquee uses CSS motion only and falls back
                  to a wrapped static layout when reduced motion is preferred.
                </CardDescription>
              </Card>
              <Card as="article" className="grid gap-2 p-4">
                <CardTitle className="text-lg">Local import contract</CardTitle>
                <CardDescription>
                  Feature authors can import compatible visual surfaces from{" "}
                  <code>@/components/ui</code> instead of vendoring ad hoc code
                  into individual pages.
                </CardDescription>
              </Card>
              <Card as="article" className="grid gap-2 p-4">
                <CardTitle className="text-lg">Responsive proof</CardTitle>
                <CardDescription>
                  The marquee cards keep readable widths on narrow screens and
                  remain inspectable inside the existing docs shell.
                </CardDescription>
              </Card>
            </Marquee>
          </div>

          <Card className="grid gap-3 border-accent/25 bg-linear-to-br from-card via-card to-accent/8 p-5">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.04em] text-muted-foreground">
              Performative UI gradient accent
            </p>
            <GradientText
              as="strong"
              className="text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-tight tracking-tight"
            >
              Inspectable component surface
            </GradientText>
            <CardDescription>
              This approved local copy keeps the richer visual treatment fully
              static-export safe because it relies on CSS gradients rather than
              request-time behavior.
            </CardDescription>
          </Card>

          <Alert variant="success">
            <AlertTitle>Reduced-motion handling</AlertTitle>
            <AlertDescription>
              When reduced motion is preferred, the marquee stops duplicating or
              scrolling content and instead presents the same cards in a static
              wrapped layout.
            </AlertDescription>
          </Alert>
        </Card>
      </section>

      <DocsContentCard
        as="section"
        aria-labelledby="ui-primitives-summary-title"
      >
        <CardTitle id="ui-primitives-summary-title">
          Stable import path
        </CardTitle>
        <CardDescription className="mt-2">
          Feature authors should import these shared primitives from{" "}
          <code>@/components/ui</code> rather than introducing route-local
          controls.
        </CardDescription>
      </DocsContentCard>
    </DocsContentSurface>
  );
}
