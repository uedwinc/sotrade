import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Pill({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-cloud px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate",
        className
      )}
      {...props}
    />
  );
}
