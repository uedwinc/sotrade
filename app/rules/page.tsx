import { Cpu, PlayCircle, Radar } from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { SectionTitle } from "@/components/section-title";
import { sampleRules } from "@/lib/product";

export default function RulesPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <Panel>
          <Pill>Rules Engine</Pill>
          <SectionTitle
            eyebrow="No-code automation"
            title="Define market conditions in plain language, then route them into live testnet execution."
            description="The Rules Engine is positioned as an operations surface, not a gimmick. It turns ETF persistence, sentiment posture, sector rotation, and macro filters into deterministic trigger logic."
          />
          <div className="mt-8 grid gap-3 border-t border-line pt-6">
            {[
              "Condition builder for ETF inflows, news, macro, and sector signals",
              "Trigger persistence and execution audit trail",
              "Operator-first safeguards before expanding automation depth"
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-line bg-paper px-4 py-4 text-sm leading-7 text-slate"
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center gap-3">
            <Radar className="h-5 w-5 text-signal" />
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
              Sample rules
            </h3>
          </div>
          <div className="mt-6 space-y-4">
            {sampleRules.map((rule) => (
              <div
                key={rule.name}
                className="rounded-[22px] border border-line bg-cloud p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                    {rule.name}
                  </h4>
                  <span className="rounded-full border border-line bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                    Draft
                  </span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-paper p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-ink">
                      <Cpu className="h-4 w-4 text-tide" />
                      Trigger
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate">{rule.trigger}</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-paper p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-ink">
                      <PlayCircle className="h-4 w-4 text-ember" />
                      Action
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate">{rule.action}</p>
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
