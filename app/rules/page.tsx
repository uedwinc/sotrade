import { Cpu, PlayCircle, Radar } from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { SectionTitle } from "@/components/section-title";
import { sampleRules } from "@/lib/product";

export default function RulesPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <Pill>Rules Engine</Pill>
          <SectionTitle
            eyebrow="No-code automation"
            title="Define market conditions in plain language, then route them into live testnet execution."
            description="The Rules Engine lets users express signal logic like ETF inflow persistence, sector rotation confirmation, and macro risk filters without writing code."
          />
          <div className="mt-8 grid gap-3">
            {[
              "Condition builder for ETF inflows, news, macro, and sector signals",
              "Trigger persistence and execution audit trail",
              "Operator-first safeguards before expanding automation depth"
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-sm leading-7 text-mist/78"
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center gap-3">
            <Radar className="h-5 w-5 text-signal" />
            <h3 className="text-xl font-semibold">Sample rules</h3>
          </div>
          <div className="mt-6 space-y-4">
            {sampleRules.map((rule) => (
              <div
                key={rule.name}
                className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-lg font-semibold text-white">{rule.name}</h4>
                  <span className="rounded-full border border-signal/25 bg-signal/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-signal/85">
                    Draft
                  </span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Cpu className="h-4 w-4 text-tide" />
                      Trigger
                    </div>
                    <p className="mt-3 text-sm leading-7 text-mist/76">{rule.trigger}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <PlayCircle className="h-4 w-4 text-ember" />
                      Action
                    </div>
                    <p className="mt-3 text-sm leading-7 text-mist/76">{rule.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
