"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

/** A floating panel anchored to its trigger. Closes on Esc and outside click, and returns focus to the trigger. */
export function PopoverContent({ className, align = "end", sideOffset = 8, ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn("z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl outline-none animate-fade-in", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
