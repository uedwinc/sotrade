import { ArrowRight, Dot, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { SectionTitle } from "@/components/section-title";
import { overviewMetrics } from "@/lib/product";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel className="p-8 sm:p-10">
          <Pill>Milestone 1 · Presentation refresh</Pill>
          <SectionTitle
            eyebrow="Signal-to-trade operating system"
            title="A more disciplined trading interface for research-aware execution."
            description="SoTrade turns SoSoValue market intelligence into executable SoDEX testnet actions through an operator-grade copilot, a rules engine, and a journal designed for review, not spectacle."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/copilot"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-cloud transition hover:opacity-90"
            >
              Open AI Copilot
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/rules"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/25"
            >
              Review Rule Engine
            </a>
          </div>
          <div className="mt-9 grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
            {[
              ["Read", "ETF flow, sentiment, sector rotation, and macro context"],
              ["Reason", "Convert signal clusters into an explicit trading thesis"],
              ["Act", "Route approved plans into SoDEX testnet execution"]
            ].map(([label, body]) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">
                  {label}
                </p>
                <p className="mt-2 text-[1.02rem] leading-7 text-ink/76">{body}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="flex flex-col justify-between">
          <div>
            <Pill className="border-signal/20 bg-signal/10 text-signal">
              Execution posture
            </Pill>
            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-ink">
              Testnet locked by design
            </h3>
            <p className="mt-3 max-w-md text-[1.02rem] leading-8 text-ink/78">
              The product is intentionally opinionated here: no paper mode, no
              mainnet switch, and no endpoint ambiguity while we validate the
              execution loop.
            </p>
          </div>
          <div className="mt-8 space-y-4 border-t border-line pt-6">
            {[
              "Every configured SoDEX URL is checked for testnet scope.",
              "The signer is expected to be a dedicated testnet API wallet.",
              "Journaling is treated as a first-class product surface."
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-[1rem] leading-7 text-ink/76">
                <ShieldCheck className="mt-1 h-4 w-4 text-signal" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {overviewMetrics.map((metric) => (
          <Panel key={metric.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">
              {metric.label}
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-ink">
              {metric.value}
            </h3>
            <p className="mt-3 text-[1rem] leading-7 text-ink/76">{metric.detail}</p>
          </Panel>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-signal" />
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
              AI Copilot loop
            </h3>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Read",
                body: "Aggregates SoSoValue flow data, research streams, and market context into one operator view."
              },
              {
                title: "Reason",
                body: "Builds a thesis with confirmation logic, invalidation criteria, and explicit trade structure."
              },
              {
                title: "Act",
                body: "Prepares a SoDEX testnet order packet and writes the reasoning path into the journal."
              }
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[20px] border border-line bg-paper p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">
                  {item.title}
                </p>
                <p className="mt-3 text-[1rem] leading-7 text-ink/76">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-line pt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Trade plans should explain not just direction, but timing and invalidation.",
                "Execution should feel reviewable enough for a serious product demo."
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-[1rem] leading-7 text-ink/76">
                  <Dot className="mt-1 h-5 w-5 text-ember" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-ember" />
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
              Rule trigger model
            </h3>
          </div>
          <p className="mt-4 text-[1.02rem] leading-8 text-ink/78">
            Users define human-readable conditions and execution actions. The app
            evaluates live signals, detects qualified setups, and dispatches testnet
            orders once all conditions align.
          </p>
          <div className="mt-6 space-y-4 border-t border-line pt-6">
            {[
              ["Condition", "ETF flows, macro shifts, sentiment posture, sector leadership"],
              ["Operator control", "Clear enable, disable, and review points before automation depth expands"],
              ["Outcome", "A deterministic execution event with a persistent journal trail"]
            ].map(([label, body]) => (
              <div key={label} className="grid gap-2 sm:grid-cols-[132px_1fr]">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate">
                  {label}
                </p>
                <p className="text-[1rem] leading-7 text-ink/76">{body}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
