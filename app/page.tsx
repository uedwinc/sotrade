import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Dot,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { SectionTitle } from "@/components/section-title";
import type { NormalizedSignal } from "@/lib/domain";
import { getMarketSignalSnapshot } from "@/lib/market-signals";
import { overviewMetrics } from "@/lib/product";

function formatObservedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function biasIcon(signal: NormalizedSignal) {
  if (signal.bias === "long") {
    return ArrowUpRight;
  }

  if (signal.bias === "short") {
    return ArrowDownRight;
  }

  return Activity;
}

function biasLabel(signal: NormalizedSignal) {
  if (signal.bias === "long") {
    return "Constructive";
  }

  if (signal.bias === "short") {
    return "Defensive";
  }

  return "Balanced";
}

export default async function HomePage() {
  const snapshot = await getMarketSignalSnapshot();

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

      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Panel>
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Pill>Milestone 2 · Live ingestion</Pill>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-ink">
                SoSoValue signal snapshot
              </h3>
              <p className="mt-3 max-w-2xl text-[1.02rem] leading-8 text-ink/78">
                This section is now driven by live SoSoValue server-side ingestion.
                It combines ETF flow, featured news, macro tone, and a temporary
                market leadership proxy into one normalized app signal bundle.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-paper px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                Snapshot status
              </p>
              <p className="mt-2 text-[1rem] font-medium text-ink">
                {snapshot.status === "ok"
                  ? "Healthy"
                  : snapshot.status === "partial"
                    ? "Partial coverage"
                    : "Awaiting API key"}
              </p>
            </div>
          </div>

          {snapshot.signals.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {snapshot.signals.map((signal) => {
                const BiasIcon = biasIcon(signal);

                return (
                  <div
                    key={signal.id}
                    className="rounded-[22px] border border-line bg-paper p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-2xl">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                            {signal.kind.replaceAll("_", " ")}
                          </p>
                          <span className="rounded-full border border-line bg-cloud px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate">
                            {signal.asset}
                          </span>
                        </div>
                        <h4 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-ink">
                          {signal.title}
                        </h4>
                        <p className="mt-3 text-[1rem] leading-7 text-ink/78">
                          {signal.summary}
                        </p>
                      </div>
                      <div className="grid min-w-[210px] gap-3 rounded-[18px] border border-line bg-cloud p-4">
                        <div className="flex items-center gap-2 text-[1rem] font-medium text-ink">
                          <BiasIcon className="h-4 w-4 text-signal" />
                          {biasLabel(signal)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                            Strength
                          </p>
                          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
                            {signal.strength}/100
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                            Observed
                          </p>
                          <p className="mt-2 text-[0.98rem] text-ink/76">
                            {formatObservedAt(signal.observedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-4 border-t border-line pt-4 lg:grid-cols-[0.72fr_0.28fr]">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                          Evidence
                        </p>
                        <div className="mt-3 grid gap-2">
                          {signal.evidence.map((item) => (
                            <div
                              key={item}
                              className="flex items-start gap-2 text-[0.98rem] leading-7 text-ink/76"
                            >
                              <Dot className="mt-1 h-5 w-5 text-ember" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {signal.inference ? (
                        <div className="rounded-[18px] border border-line bg-cloud p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                            Inference note
                          </p>
                          <p className="mt-3 text-[0.98rem] leading-7 text-ink/76">
                            {signal.inference}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[22px] border border-dashed border-line bg-paper p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-4 w-4 text-ember" />
                <div>
                  <p className="text-[1rem] font-medium text-ink">
                    Live SoSoValue data is not enabled yet.
                  </p>
                  <p className="mt-2 text-[0.98rem] leading-7 text-ink/76">
                    Add `SOSOVALUE_API_KEY` to `.env.local`, then refresh this page
                    or call `/api/signals` in Codespaces.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel>
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-signal" />
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
              Source health
            </h3>
          </div>
          <div className="mt-5 grid gap-3">
            {Object.entries(snapshot.sourceStatus).map(([source, status]) => (
              <div
                key={source}
                className="flex items-center justify-between rounded-[18px] border border-line bg-paper px-4 py-3"
              >
                <p className="text-[0.98rem] font-medium capitalize text-ink">
                  {source.replace(/([A-Z])/g, " $1")}
                </p>
                <span
                  className={
                    status === "ok"
                      ? "rounded-full border border-signal/20 bg-signal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-signal"
                      : status === "error"
                        ? "rounded-full border border-ember/20 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ember"
                        : "rounded-full border border-line bg-cloud px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate"
                  }
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-line pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
              Verification path
            </p>
            <div className="mt-3 grid gap-2">
              {[
                "Add SOSOVALUE_API_KEY to .env.local in Codespaces.",
                "Open /api/signals and confirm the JSON status is ok or partial.",
                "Refresh the overview page and confirm live cards appear."
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-[0.98rem] leading-7 text-ink/76">
                  <Dot className="mt-1 h-5 w-5 text-ember" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 border-t border-line pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
              Notes
            </p>
            <div className="mt-3 grid gap-2">
              {snapshot.notes.map((item) => (
                <div key={item} className="flex items-start gap-2 text-[0.98rem] leading-7 text-ink/76">
                  <Dot className="mt-1 h-5 w-5 text-ember" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
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
