"use client";

import { joinClassNames } from "@/lib/classnames";
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";

type TabsContextValue = {
  activeValue: string;
  baseId: string;
  registerValue: (value: string) => void;
  setActiveValue: (value: string) => void;
  values: string[];
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(componentName: string): TabsContextValue {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error(`${componentName} must be used within Tabs.`);
  }

  return context;
}

type TabsProps = {
  children: ReactNode;
  defaultValue: string;
};

export function Tabs({ children, defaultValue }: TabsProps) {
  const baseId = useId();
  const [activeValue, setActiveValue] = useState(defaultValue);
  const [values, setValues] = useState<string[]>([]);

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      activeValue,
      baseId,
      registerValue: (value) => {
        setValues((currentValues) =>
          currentValues.includes(value)
            ? currentValues
            : [...currentValues, value],
        );
      },
      setActiveValue,
      values,
    }),
    [activeValue, baseId, values],
  );

  return (
    <TabsContext.Provider value={contextValue}>{children}</TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={joinClassNames(
        "ui-tabs-list inline-flex min-h-11 flex-wrap items-center gap-2 rounded-lg border bg-muted/60 p-1",
        className,
      )}
      role="tablist"
      {...props}
    />
  );
}

type TabsTriggerProps = Omit<ComponentPropsWithoutRef<"button">, "value"> & {
  value: string;
};

export function TabsTrigger({
  className,
  onClick,
  onKeyDown,
  value,
  ...props
}: TabsTriggerProps) {
  const context = useTabsContext("TabsTrigger");
  const isSelected = context.activeValue === value;

  useEffect(() => {
    context.registerValue(value);
  }, [context, value]);

  const index = context.values.indexOf(value);

  const focusValue = (nextValue: string) => {
    const nextTab = document.getElementById(
      `${context.baseId}-tab-${nextValue}`,
    );
    nextTab?.focus();
    context.setActiveValue(nextValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const values = context.values;
    const lastIndex = values.length - 1;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown": {
        event.preventDefault();
        focusValue(values[(index + 1) % values.length] ?? value);
        break;
      }
      case "ArrowLeft":
      case "ArrowUp": {
        event.preventDefault();
        focusValue(
          values[(index - 1 + values.length) % values.length] ?? value,
        );
        break;
      }
      case "Home": {
        event.preventDefault();
        focusValue(values[0] ?? value);
        break;
      }
      case "End": {
        event.preventDefault();
        focusValue(values[lastIndex] ?? value);
        break;
      }
      default:
        break;
    }

    onKeyDown?.(event);
  };

  return (
    <button
      aria-controls={`${context.baseId}-panel-${value}`}
      aria-selected={isSelected}
      className={joinClassNames(
        "ui-tabs-trigger min-h-9 rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className,
      )}
      data-state={isSelected ? "active" : "inactive"}
      id={`${context.baseId}-tab-${value}`}
      onClick={(event) => {
        context.setActiveValue(value);
        onClick?.(event);
      }}
      onKeyDown={handleKeyDown}
      role="tab"
      tabIndex={isSelected ? 0 : -1}
      type="button"
      {...props}
    />
  );
}

type TabsContentProps = Omit<ComponentPropsWithoutRef<"div">, "value"> & {
  value: string;
};

export function TabsContent({ className, value, ...props }: TabsContentProps) {
  const context = useTabsContext("TabsContent");
  const isSelected = context.activeValue === value;

  return (
    <div
      aria-labelledby={`${context.baseId}-tab-${value}`}
      className={joinClassNames(
        "ui-tabs-content rounded-xl border bg-card p-4 shadow-sm",
        className,
      )}
      hidden={!isSelected}
      id={`${context.baseId}-panel-${value}`}
      role="tabpanel"
      {...props}
    />
  );
}
