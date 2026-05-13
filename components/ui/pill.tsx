import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Pill({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-mist/75",
        className
      )}
      {...props}
    />
  );
}
