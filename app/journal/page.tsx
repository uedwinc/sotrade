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
          description="The journal is where SoTrade explains what happened, when it happened, and why. This becomes especially important once automated rules begin submitting real SoDEX testnet orders."
        />
      </Panel>

      <div className="grid gap-5">
        {journalEvents.map((event) => (
          <Panel key={event.time} className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm font-medium text-signal">
              {event.time}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <BookOpenText className="h-4 w-4 text-tide" />
                <h3 className="text-lg font-semibold text-white">{event.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-mist/76">{event.detail}</p>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
