import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";

export function Disclosure({
  title,
  meta,
  defaultOpen = false,
  className,
  children
}: {
  title: string;
  meta?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "group rounded-[20px] border border-line bg-paper shadow-card",
        className
      )}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4">
        <div className="min-w-0">
          <p className="text-[1rem] font-medium text-ink">{title}</p>
          {meta ? <div className="mt-1 text-sm text-ink/66">{meta}</div> : null}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-line px-4 py-4">{children}</div>
    </details>
  );
}
