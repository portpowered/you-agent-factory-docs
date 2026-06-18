"use client";

import { joinClassNames } from "@/lib/classnames";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { createContext, useContext, useId, useMemo, useState } from "react";

type AccordionType = "single" | "multiple";

type AccordionContextValue = {
  baseId: string;
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(componentName: string): AccordionContextValue {
  const context = useContext(AccordionContext);

  if (!context) {
    throw new Error(`${componentName} must be used within Accordion.`);
  }

  return context;
}

type AccordionProps = {
  children: ReactNode;
  defaultValue?: string | string[];
  type?: AccordionType;
};

export function Accordion({
  children,
  defaultValue,
  type = "single",
}: AccordionProps) {
  const baseId = useId();
  const initialValue = Array.isArray(defaultValue)
    ? defaultValue
    : defaultValue
      ? [defaultValue]
      : [];
  const [openValues, setOpenValues] = useState<string[]>(initialValue);

  const contextValue = useMemo<AccordionContextValue>(
    () => ({
      baseId,
      isOpen: (value) => openValues.includes(value),
      toggle: (value) => {
        setOpenValues((currentValues) => {
          const isCurrentlyOpen = currentValues.includes(value);

          if (type === "multiple") {
            return isCurrentlyOpen
              ? currentValues.filter((currentValue) => currentValue !== value)
              : [...currentValues, value];
          }

          return isCurrentlyOpen ? [] : [value];
        });
      },
    }),
    [baseId, openValues, type],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className="ui-accordion grid gap-3">{children}</div>
    </AccordionContext.Provider>
  );
}

type AccordionItemContextValue = {
  contentId: string;
  open: boolean;
  toggle: () => void;
  triggerId: string;
};

const AccordionItemContext = createContext<AccordionItemContextValue | null>(
  null,
);

function useAccordionItemContext(
  componentName: string,
): AccordionItemContextValue {
  const context = useContext(AccordionItemContext);

  if (!context) {
    throw new Error(`${componentName} must be used within AccordionItem.`);
  }

  return context;
}

type AccordionItemProps = ComponentPropsWithoutRef<"section"> & {
  value: string;
};

export function AccordionItem({
  className,
  value,
  ...props
}: AccordionItemProps) {
  const accordion = useAccordionContext("AccordionItem");
  const open = accordion.isOpen(value);
  const itemId = `${accordion.baseId}-item-${value}`;

  return (
    <AccordionItemContext.Provider
      value={{
        contentId: `${itemId}-content`,
        open,
        toggle: () => accordion.toggle(value),
        triggerId: `${itemId}-trigger`,
      }}
    >
      <section
        className={joinClassNames(
          "rounded-xl border bg-card shadow-sm",
          className,
        )}
        data-state={open ? "open" : "closed"}
        {...props}
      />
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  const item = useAccordionItemContext("AccordionTrigger");

  return (
    <button
      aria-controls={item.contentId}
      aria-expanded={item.open}
      className={joinClassNames(
        "ui-accordion-trigger flex min-h-11 w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left font-semibold text-foreground transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      id={item.triggerId}
      onClick={item.toggle}
      type="button"
      {...props}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="text-muted-foreground">
        {item.open ? "−" : "+"}
      </span>
    </button>
  );
}

export function AccordionContent({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  const item = useAccordionItemContext("AccordionContent");

  return (
    <div
      aria-labelledby={item.triggerId}
      className={joinClassNames(
        "ui-accordion-content px-4 pb-4 text-sm/6 text-muted-foreground",
        className,
      )}
      hidden={!item.open}
      id={item.contentId}
      role="region"
      {...props}
    />
  );
}
