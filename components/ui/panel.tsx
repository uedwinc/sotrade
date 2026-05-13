import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-glow backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
