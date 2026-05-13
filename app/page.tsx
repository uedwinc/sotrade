import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Radar,
  ShieldCheck
} from "lucide-react";

import { SectionTitle } from "@/components/section-title";
import { Disclosure } from "@/components/ui/disclosure";
import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
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

function biasLabel(signal: NormalizedSignal) {
  if (signal.bias === "long") {
    return "Constructive";
  }

  if (signal.bias === "short") {
    return "Defensive";
  }

  return "Balanced";
}

function BiasIcon({ signal }: { signal: NormalizedSignal }) {
  if (signal.bias === "long") {
    return <ArrowUpRight className="h-4 w-4 text-signal" />;
  }

  if (signal.bias === "short") {
    return <ArrowDownRight className="h-4 w-4 text-ember" />;
  }

  return <Activity className="h-4 w-4 text-tide" />;
}

function humanizeSource(source: string) {
  return source.replace(/([A-Z])/g, " $1").replace(/^./, (match) => match.toUpperCase());
}

export default async function HomePage() {
  const snapshot = await getMarketSignalSnapshot();

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel className="p-8 sm:p-10">
          <Pill>Signal-to-trade operating system</Pill>
          <SectionTitle
            eyebrow="Research-aware execution"
            title="A calmer trading interface that keeps the decision in focus."
            description="SoTrade translates SoSoValue market intelligence into a tighter workflow: understand the signal state, generate a structured trade thesis, and route approved actions into SoDEX testnet only when the setup is clear."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/copilot"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-cloud transition hover:opacity-90"
            >
              Open AI Copilot
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/rules"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/25"
            >
              Review Rule Engine
            </Link>
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
              This phase stays intentionally strict: testnet only, no paper mode,
              no mainnet switch, and no hidden execution path.
            </p>
          </div>
          <div className="mt-8 space-y-4 border-t border-line pt-6">
            {[
              "Every configured SoDEX URL is checked for testnet scope.",
              "The signer is expected to be a dedicated testnet API wallet.",
              "Decision support comes before automation depth."
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
                The overview now stays compact: current signal posture first,
                supporting evidence on demand.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-paper px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                Status
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
            <div className="mt-6 space-y-3">
              {snapshot.signals.map((signal) => (
                <Disclosure
                  key={signal.id}
                  title={signal.title}
                  meta={
                    <div className="flex flex-wrap items-center gap-3">
                      <span>{signal.asset}</span>
                      <span>{biasLabel(signal)}</span>
                      <span>{signal.strength}/100</span>
                      <span>{formatObservedAt(signal.observedAt)}</span>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[1rem] font-medium text-ink">
                      <BiasIcon signal={signal} />
                      {biasLabel(signal)}
                    </div>
                    <p className="text-[0.98rem] leading-7 text-ink/76">{signal.summary}</p>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                        Evidence
                      </p>
                      <div className="mt-2 grid gap-2">
                        {signal.evidence.map((item) => (
                          <div key={item} className="text-[0.98rem] leading-7 text-ink/76">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    {signal.inference ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                          Inference note
                        </p>
                        <p className="mt-2 text-[0.98rem] leading-7 text-ink/76">
                          {signal.inference}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </Disclosure>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[20px] border border-dashed border-line bg-paper p-5 text-[1rem] leading-7 text-ink/76">
              Add `SOSOVALUE_API_KEY` to `.env.local` to enable the live signal bundle.
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
            <Link
              href="/copilot"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-cloud transition hover:opacity-90"
            >
              Use these signals in Copilot
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/rules"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/25"
            >
              Build rules from signals
            </Link>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
              Source health
            </h3>
            <div className="mt-5 grid gap-3">
              {Object.entries(snapshot.sourceStatus).map(([source, status]) => (
                <div
                  key={source}
                  className="flex items-center justify-between rounded-[18px] border border-line bg-paper px-4 py-3"
                >
                  <p className="text-[0.98rem] font-medium text-ink">
                    {humanizeSource(source)}
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
          </Panel>

          <Disclosure
            title="Verification path"
            meta="Keep the diagnostics available, but out of the way."
          >
            <div className="grid gap-2 text-[0.98rem] leading-7 text-ink/76">
              <div>Add `SOSOVALUE_API_KEY` to `.env.local` in Codespaces.</div>
              <div>Open `/api/signals` and confirm the JSON status is `ok` or `partial`.</div>
              <div>Refresh `/` and confirm the signal list renders without long cards.</div>
            </div>
          </Disclosure>

          <Disclosure title="Snapshot notes" meta={`${snapshot.notes.length} active notes`}>
            <div className="grid gap-2 text-[0.98rem] leading-7 text-ink/76">
              {snapshot.notes.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </Disclosure>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-signal" />
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
              AI Copilot
            </h3>
          </div>
          <p className="mt-4 text-[1rem] leading-7 text-ink/76">
            The Copilot workspace now focuses on one decision at a time: thesis,
            trade structure, and sizing above the fold, with deeper signal detail
            hidden behind expandable sections.
          </p>
          <div className="mt-5">
            <Link
              href="/copilot"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-cloud transition hover:opacity-90"
            >
              Open Copilot
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center gap-3">
            <Radar className="h-5 w-5 text-ember" />
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
              Rules Engine
            </h3>
          </div>
          <p className="mt-4 text-[1rem] leading-7 text-ink/76">
            The rules surface stays separate from the Copilot decision flow. That
            keeps research-driven manual review and signal-driven automation from
            blending into one confusing screen.
          </p>
          <div className="mt-5">
            <Link
              href="/rules"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/25"
            >
              Open Rules Engine
            </Link>
          </div>
        </Panel>
      </section>
    </div>
  );
}
