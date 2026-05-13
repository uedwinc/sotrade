import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-line bg-cloud p-6 shadow-card",
        className
      )}
      {...props}
    />
  );
}
