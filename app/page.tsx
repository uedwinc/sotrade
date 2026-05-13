import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { SectionTitle } from "@/components/section-title";
import { overviewMetrics } from "@/lib/product";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Panel className="overflow-hidden p-0">
          <div className="relative h-full overflow-hidden rounded-[28px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(115,240,191,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(117,168,255,0.26),transparent_32%)]" />
            <div className="relative p-8 sm:p-10">
              <Pill>Milestone 1 · Product Foundation</Pill>
              <SectionTitle
                eyebrow="Signal-To-Trade Command Center"
                title="Research-aware execution for crypto traders who need speed and structure."
                description="SoTrade reads SoSoValue ETF, sentiment, sector, and macro signals, translates them into precise trade plans, and routes approved actions into SoDEX testnet execution."
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/copilot"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-ink transition hover:translate-y-[-1px]"
                >
                  Open AI Copilot
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/rules"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30"
                >
                  Configure Rule Engine
                </a>
              </div>
            </div>
          </div>
        </Panel>
        <Panel className="flex flex-col justify-between">
          <div>
            <Pill className="text-ember">Execution Posture</Pill>
            <h3 className="mt-4 text-2xl font-semibold">Testnet locked by design</h3>
            <p className="mt-3 text-sm leading-7 text-mist/72">
              Every trading pathway in this phase is restricted to SoDEX testnet
              endpoints. No paper mode. No mainnet fallback. No ambiguous toggles.
            </p>
          </div>
          <div className="mt-8 grid gap-3">
            {[
              "Guardrail checks for every configured SoDEX URL",
              "Dedicated testnet signing wallet expected",
              "Execution journal included from day one"
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-mist/80"
              >
                <ShieldCheck className="h-4 w-4 text-signal" />
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {overviewMetrics.map((metric) => (
          <Panel key={metric.label}>
            <p className="text-sm uppercase tracking-[0.2em] text-mist/52">{metric.label}</p>
            <h3 className="mt-4 text-2xl font-semibold text-white">{metric.value}</h3>
            <p className="mt-3 text-sm leading-7 text-mist/72">{metric.detail}</p>
          </Panel>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-signal" />
            <h3 className="text-xl font-semibold">AI Copilot loop</h3>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Read",
                body: "Aggregates SoSoValue ETF flows, market context, and research signals."
              },
              {
                title: "Reason",
                body: "Builds a thesis with confidence, invalidation, and timing logic."
              },
              {
                title: "Act",
                body: "Prepares an executable SoDEX testnet order plan and journal entry."
              }
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-white/10 bg-black/15 p-5"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-signal/80">
                  {item.title}
                </p>
                <p className="mt-4 text-sm leading-7 text-mist/78">{item.body}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-ember" />
            <h3 className="text-xl font-semibold">Rule trigger model</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-mist/72">
            Users define human-readable conditions and execution actions. The app
            evaluates live signals, detects qualified setups, and dispatches testnet
            orders once all conditions align.
          </p>
        </Panel>
      </section>
    </div>
  );
}
