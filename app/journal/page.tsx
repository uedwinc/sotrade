import { BookOpenText } from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { SectionTitle } from "@/components/section-title";
import { journalEvents } from "@/lib/product";

export default function JournalPage() {
  return (
    <div className="space-y-8">
      <Panel>
        <Pill>Execution Journal</Pill>
        <SectionTitle
          eyebrow="Audit-friendly operations"
          title="Every thesis, trigger, and order should leave an understandable trail."
          description="The journal is where SoTrade explains what happened, when it happened, and why. For an automated trading product, the log is part of the product, not an afterthought."
        />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">
            Journal principles
          </p>
          <div className="mt-5 space-y-4">
            {[
              "Every generated thesis should be attributable to a visible signal bundle.",
              "Every rule trigger should show the exact condition state that fired it.",
              "Every execution event should preserve operator context and timestamps."
            ].map((item) => (
              <div
                key={item}
                className="border-b border-line pb-4 text-[1rem] leading-7 text-ink/76 last:border-b-0 last:pb-0"
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>
        <div className="grid gap-5">
        {journalEvents.map((event) => (
          <Panel key={event.time} className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm font-medium text-signal">
              {event.time}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <BookOpenText className="h-4 w-4 text-tide" />
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                  {event.title}
                </h3>
              </div>
              <p className="mt-3 text-[1rem] leading-7 text-ink/76">{event.detail}</p>
            </div>
          </Panel>
        ))}
        </div>
      </div>
    </div>
  );
}
