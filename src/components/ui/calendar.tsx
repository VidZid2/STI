"use client";

import { cn } from "../../lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

const buttonClassNames =
  "relative flex w-10 h-10 sm:w-9 sm:h-9 text-base sm:text-sm items-center justify-center rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:pointer-events-none disabled:opacity-50";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  mode = "single",
  ...props
}: React.ComponentProps<typeof DayPicker>): React.ReactElement {
  const defaultClassNames = {
    button_next: buttonClassNames,
    button_previous: buttonClassNames,
    caption_label:
      "text-base sm:text-sm font-semibold flex items-center gap-2 h-full text-slate-800 dark:text-slate-200",
    day: "w-10 h-10 sm:w-9 sm:h-9 text-sm p-0 m-0",
    day_button: cn(
      buttonClassNames,
      "data-[disabled]:pointer-events-none data-[disabled]:text-slate-400 data-[disabled]:line-through outline-none focus-visible:ring-[3px] focus-visible:ring-blue-500/50",
      // Range shapes
      "[.range-middle_&]:rounded-none",
      "[.range-end:not(.range-start)_&]:rounded-l-none",
      "[.range-start:not(.range-end)_&]:rounded-r-none",
      // Selected (Start/End) styles
      "data-[selected]:bg-blue-600 data-[selected]:text-white data-[selected]:hover:bg-blue-600 data-[selected]:hover:text-white",
      // Selected (Middle) styles - lighter background, normal text
      "[.range-middle_&]:data-[selected]:bg-blue-50 dark:[.range-middle_&]:data-[selected]:bg-blue-900/30",
      "[.range-middle_&]:data-[selected]:text-slate-800 dark:[.range-middle_&]:data-[selected]:text-slate-200",
      "[.range-middle_&]:data-[selected]:hover:bg-blue-100 dark:[.range-middle_&]:data-[selected]:hover:bg-blue-900/50",
      "[.range-middle_&]:data-[selected]:hover:text-slate-800 dark:[.range-middle_&]:data-[selected]:hover:text-slate-200"
    ),
    month: "w-full space-y-2",
    month_caption:
      "relative mx-1 mb-2 flex h-10 items-center justify-center z-10",
    months: "relative flex flex-col sm:flex-row gap-4",
    nav: "absolute top-0 flex w-full justify-between z-10",
    outside: "text-slate-400 opacity-50",
    today: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold !rounded-lg relative after:content-[''] after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-blue-600 dark:after:bg-blue-400 data-[selected]:after:bg-white",
    week_number: "w-10 h-10 p-0 text-xs font-medium text-slate-400",
    weekday: "w-10 h-10 sm:w-9 sm:h-9 p-0 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-center",
    weeks: "w-full space-y-1",
    weekdays: "flex w-full",
    week: "flex w-full mt-1",
  };
  
  const mergedClassNames: typeof defaultClassNames = Object.keys(
    defaultClassNames,
  ).reduce(
    (acc, key) => {
      const userClass = classNames?.[key as keyof typeof classNames];
      const baseClass =
        defaultClassNames[key as keyof typeof defaultClassNames];

      acc[key as keyof typeof defaultClassNames] = userClass
        ? cn(baseClass, userClass)
        : baseClass;

      return acc;
    },
    { ...defaultClassNames } as typeof defaultClassNames,
  );

  const defaultComponents = {
    Chevron: ({
      className,
      orientation,
      ...props
    }: {
      className?: string;
      orientation?: "left" | "right" | "up" | "down";
    }): React.ReactElement => {
      if (orientation === "left") {
        return (
          <ChevronLeftIcon
            className={cn(className, "w-4 h-4 rtl:rotate-180 text-slate-500")}
            {...props}
            aria-hidden="true"
          />
        );
      }

      if (orientation === "right") {
        return (
          <ChevronRightIcon
            className={cn(className, "w-4 h-4 rtl:rotate-180 text-slate-500")}
            {...props}
            aria-hidden="true"
          />
        );
      }

      return (
        <ChevronsUpDownIcon
          className={cn(className, "w-4 h-4")}
          {...props}
          aria-hidden="true"
        />
      );
    },
  };

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  };

  const dayPickerProps = {
    className: cn(
      "w-fit mx-auto",
      className,
    ),
    classNames: mergedClassNames,
    components: mergedComponents,
    "data-slot": "calendar",
    formatters: {
      formatMonthDropdown: (date: Date) =>
        date.toLocaleString("default", { month: "short" }),
    } as React.ComponentProps<typeof DayPicker>["formatters"],
    mode,
    showOutsideDays,
    ...props,
  };

  return (
    <DayPicker
      {...(dayPickerProps as React.ComponentProps<typeof DayPicker>)}
    />
  );
}
