"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot
} from "lucide-react";

import { Disclosure } from "@/components/ui/disclosure";
import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { SectionTitle } from "@/components/section-title";
import type {
  CopilotErrorResponse,
  CopilotResponse,
  PriceAnchor,
  SignalSnapshot
} from "@/lib/domain";

interface CopilotWorkspaceProps {
  initialSignalSnapshot: SignalSnapshot;
  initialPriceAnchor: PriceAnchor | null;
  initialPriceError: string | null;
}

function formatUsd(value: number | null) {
  if (value === null) {
    return "Not set";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
}

function formatNumber(value: number | null, decimals = 2) {
  if (value === null) {
    return "Not set";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(value);
}

function formatObservedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function BiasIcon({
  bias,
  className
}: {
  bias: "long" | "short" | "neutral";
  className?: string;
}) {
  if (bias === "long") {
    return <ArrowUpRight className={className} />;
  }

  if (bias === "short") {
    return <ArrowDownRight className={className} />;
  }

  return <Activity className={className} />;
}

function biasLabel(bias: "long" | "short" | "neutral") {
  if (bias === "long") {
    return "Constructive";
  }

  if (bias === "short") {
    return "Defensive";
  }

  return "Balanced";
}

function humanizeSource(source: string) {
  return source.replace(/([A-Z])/g, " $1").replace(/^./, (match) => match.toUpperCase());
}

export function CopilotWorkspace({
  initialSignalSnapshot,
  initialPriceAnchor,
  initialPriceError
}: CopilotWorkspaceProps) {
  const [accountEquityUsd, setAccountEquityUsd] = useState("10000");
  const [maxRiskPct, setMaxRiskPct] = useState("1");
  const [result, setResult] = useState<CopilotResponse | null>(null);
  const [error, setError] = useState<CopilotErrorResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeSnapshot = result?.signalSnapshot ?? initialSignalSnapshot;
  const activePriceAnchor = result?.priceAnchor ?? initialPriceAnchor;
  const activeModelId = result?.model.modelId ?? "anthropic.claude-sonnet-4-6";

  return (
    <div className="space-y-8">
      <Panel>
        <Pill>AI Copilot · Milestone 3</Pill>
        <SectionTitle
          eyebrow="Structured BTC workspace"
          title="A simpler Copilot flow: inputs on the left, one decision canvas on the right."
          description="This workspace is intentionally narrower now. The primary trade decision stays visible first, while evidence, diagnostics, and persistence details move behind expandable sections."
        />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-6 xl:sticky xl:top-5 xl:self-start">
          <Panel>
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-signal" />
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
                Generate plan
              </h3>
            </div>
            <form
              className="mt-6 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();

                startTransition(() => {
                  void (async () => {
                    try {
                      setError(null);

                      const response = await fetch("/api/copilot/thesis", {
                        method: "POST",
                        headers: {
                          "content-type": "application/json"
                        },
                        body: JSON.stringify({
                          asset: "BTC",
                          horizon: "swing_1_7d",
                          accountEquityUsd: Number(accountEquityUsd),
                          maxRiskPct: Number(maxRiskPct)
                        })
                      });
                      const body = (await response.json()) as
                        | CopilotResponse
                        | CopilotErrorResponse;

                      if (!response.ok) {
                        setResult(null);
                        setError(body as CopilotErrorResponse);
                        return;
                      }

                      setResult(body as CopilotResponse);
                    } catch (requestError) {
                      setResult(null);
                      setError({
                        error: {
                          code: "CLIENT_REQUEST_FAILED",
                          message: "The browser could not complete the Copilot request.",
                          retryable: true,
                          details: [
                            requestError instanceof Error
                              ? requestError.message
                              : "Unknown client request error"
                          ]
                        },
                        model: {
                          provider: "bedrock",
                          modelId: "unknown"
                        }
                      });
                    }
                  })();
                });
              }}
            >
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                  Account equity (USD)
                </span>
                <input
                  className="rounded-2xl border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-ink/30"
                  inputMode="decimal"
                  value={accountEquityUsd}
                  onChange={(event) => setAccountEquityUsd(event.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                  Max risk (%)
                </span>
                <input
                  className="rounded-2xl border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-ink/30"
                  inputMode="decimal"
                  value={maxRiskPct}
                  onChange={(event) => setMaxRiskPct(event.target.value)}
                />
              </label>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-line bg-paper px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                    Asset
                  </p>
                  <p className="mt-2 text-[1rem] font-medium text-ink">BTC</p>
                </div>
                <div className="rounded-2xl border border-line bg-paper px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                    Horizon
                  </p>
                  <p className="mt-2 text-[1rem] font-medium text-ink">Swing · 1-7 days</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-cloud transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Generating..." : "Generate BTC trade plan"}
              </button>
            </form>
          </Panel>

          <Panel>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
              Live context
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[20px] border border-line bg-paper p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                  BTC spot anchor
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
                  {activePriceAnchor ? formatUsd(activePriceAnchor.spotPriceUsd) : "Unavailable"}
                </p>
                <p className="mt-2 text-sm leading-6 text-ink/72">
                  {activePriceAnchor
                    ? `Coinbase · ${formatObservedAt(activePriceAnchor.observedAt)}`
                    : initialPriceError ?? "Live BTC spot price is not available yet."}
                </p>
              </div>

              <div className="rounded-[20px] border border-line bg-paper p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                  Signal state
                </p>
                <p className="mt-2 text-[1rem] font-medium text-ink">
                  {activeSnapshot.status === "ok"
                    ? "Healthy"
                    : activeSnapshot.status === "partial"
                      ? "Partial coverage"
                      : "Unavailable"}
                </p>
                <p className="mt-2 text-sm leading-6 text-ink/72">
                  {activeSnapshot.signals.length} signal{activeSnapshot.signals.length === 1 ? "" : "s"} in the current bundle
                </p>
              </div>
            </div>
          </Panel>

          <Disclosure
            title="Signal source health"
            meta={`${Object.values(activeSnapshot.sourceStatus).filter((value) => value === "ok").length} sources healthy`}
          >
            <div className="grid gap-3">
              {Object.entries(activeSnapshot.sourceStatus).map(([source, status]) => (
                <div
                  key={source}
                  className="flex items-center justify-between rounded-[18px] border border-line bg-cloud px-4 py-3"
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
                          : "rounded-full border border-line bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate"
                    }
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </Disclosure>
        </div>

        <div className="space-y-6">
          {error ? (
            <Panel>
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 text-ember" />
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
                    Copilot request failed
                  </h3>
                  <p className="mt-3 text-[1rem] leading-7 text-ink/76">
                    {error.error.message}
                  </p>
                  <div className="mt-4 grid gap-2">
                    {(error.error.details ?? []).map((item) => (
                      <div key={item} className="rounded-2xl border border-line bg-paper px-4 py-3 text-[0.98rem] leading-7 text-ink/76">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          ) : null}

          {result ? (
            <>
              <Panel>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <Pill>Primary decision</Pill>
                      <span className="rounded-full border border-line bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate">
                        {result.tradePlan.actionable ? "Actionable" : "No trade"}
                      </span>
                    </div>
                    <h3 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-ink">
                      {result.thesis.summary}
                    </h3>
                    <p className="mt-3 text-[1rem] leading-7 text-ink/76">
                      Generated {formatObservedAt(result.generatedAt)} using {activeModelId}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-line bg-cloud px-5 py-4">
                    <div className="flex items-center gap-2 text-[1rem] font-medium text-ink">
                      <BiasIcon bias={result.thesis.bias} className="h-4 w-4 text-signal" />
                      {biasLabel(result.thesis.bias)}
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                      Confidence
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-ink">
                      {formatNumber(result.thesis.confidence, 1)}/100
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Entry", formatUsd(result.tradePlan.entryPriceUsd)],
                    ["Stop", formatUsd(result.tradePlan.stopLossUsd)],
                    [
                      "Take profit",
                      result.tradePlan.takeProfitUsd.length > 0
                        ? result.tradePlan.takeProfitUsd.map((value) => formatUsd(value)).join(" · ")
                        : "Not set"
                    ],
                    [
                      "Position size",
                      result.sizing.positionSizeBtc === null
                        ? "Not set"
                        : `${formatNumber(result.sizing.positionSizeBtc, 6)} BTC`
                    ]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[20px] border border-line bg-paper p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                        {label}
                      </p>
                      <p className="mt-3 text-[1rem] font-medium leading-7 text-ink">{value}</p>
                    </div>
                  ))}
                </div>

                {!result.tradePlan.actionable ? (
                  <div className="mt-5 rounded-[20px] border border-line bg-paper p-4 text-[1rem] leading-7 text-ink/76">
                    The Copilot is intentionally withholding a live setup. That is a valid outcome when the signal stack does not justify a clean swing trade.
                  </div>
                ) : null}
              </Panel>

              <div className="grid gap-4">
                <Disclosure
                  title="Why this view"
                  meta="Rationale and principal risks behind the thesis"
                  defaultOpen
                >
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                        Rationale
                      </p>
                      <div className="mt-3 grid gap-2">
                        {result.thesis.rationale.map((item) => (
                          <div key={item} className="rounded-2xl border border-line bg-cloud px-4 py-3 text-[0.98rem] leading-7 text-ink/76">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                        Risks
                      </p>
                      <div className="mt-3 grid gap-2">
                        {result.thesis.risks.map((item) => (
                          <div key={item} className="rounded-2xl border border-line bg-cloud px-4 py-3 text-[0.98rem] leading-7 text-ink/76">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Disclosure>

                <Disclosure
                  title="Trade structure and sizing math"
                  meta="Invalidation, execution notes, and deterministic size calculations"
                >
                  <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-4">
                      <div className="rounded-[20px] border border-line bg-cloud p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                          Invalidation
                        </p>
                        <p className="mt-3 text-[0.98rem] leading-7 text-ink/76">
                          {result.tradePlan.invalidation}
                        </p>
                      </div>
                      <div className="rounded-[20px] border border-line bg-cloud p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                          Execution notes
                        </p>
                        <div className="mt-3 grid gap-2">
                          {result.tradePlan.executionNotes.map((item) => (
                            <div key={item} className="text-[0.98rem] leading-7 text-ink/76">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        ["Account equity", formatUsd(result.sizing.accountEquityUsd)],
                        ["Max risk", `${formatNumber(result.sizing.maxRiskPct, 2)}%`],
                        ["Risk budget", formatUsd(result.sizing.riskUsd)],
                        ["Stop distance", formatUsd(result.sizing.stopDistanceUsd)],
                        [
                          "Stop distance %",
                          result.sizing.stopDistancePct === null
                            ? "Not set"
                            : `${formatNumber(result.sizing.stopDistancePct, 2)}%`
                        ],
                        ["Position notional", formatUsd(result.sizing.positionNotionalUsd)]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-[20px] border border-line bg-cloud p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                            {label}
                          </p>
                          <p className="mt-3 text-[1rem] font-medium leading-7 text-ink">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Disclosure>

                <Disclosure
                  title="Underlying signal context"
                  meta={`${result.signalSnapshot.signals.length} signals supporting this request`}
                >
                  <div className="space-y-3">
                    {result.signalSnapshot.signals.map((signal) => (
                      <Disclosure
                        key={signal.id}
                        title={signal.title}
                        meta={
                          <div className="flex flex-wrap items-center gap-3">
                            <span>{signal.asset}</span>
                            <span>{biasLabel(signal.bias)}</span>
                            <span>{signal.strength}/100</span>
                            <span>{formatObservedAt(signal.observedAt)}</span>
                          </div>
                        }
                        className="bg-cloud"
                      >
                        <div className="space-y-4">
                          <p className="text-[0.98rem] leading-7 text-ink/76">
                            {signal.summary}
                          </p>
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
                </Disclosure>

                <Disclosure
                  title="Diagnostics and persistence"
                  meta="Model details, storage result, and ingestion notes"
                >
                  <div className="grid gap-5 xl:grid-cols-[0.72fr_0.28fr]">
                    <div className="space-y-4">
                      <div className="rounded-[20px] border border-line bg-cloud p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                          Snapshot notes
                        </p>
                        <div className="mt-3 grid gap-2">
                          {result.signalSnapshot.notes.map((item) => (
                            <div key={item} className="text-[0.98rem] leading-7 text-ink/76">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-[20px] border border-line bg-cloud p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                          Persistence
                        </p>
                        <p className="mt-3 text-[1rem] font-medium text-ink">
                          {result.persistence.status}
                        </p>
                        {result.persistence.id ? (
                          <p className="mt-2 text-sm leading-6 text-ink/72">{result.persistence.id}</p>
                        ) : null}
                        {result.persistence.reason ? (
                          <p className="mt-2 text-sm leading-6 text-ink/72">
                            {result.persistence.reason}
                          </p>
                        ) : null}
                      </div>
                      <div className="rounded-[20px] border border-line bg-cloud p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                          Model
                        </p>
                        <p className="mt-3 text-[1rem] font-medium text-ink">{activeModelId}</p>
                      </div>
                    </div>
                  </div>
                </Disclosure>
              </div>
            </>
          ) : (
            <Panel>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <Pill>Decision canvas</Pill>
                  <h3 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-ink">
                    Generate one clean BTC view instead of scanning a wall of cards.
                  </h3>
                  <p className="mt-3 text-[1rem] leading-7 text-ink/76">
                    Use the left rail to set equity and risk, then let the Copilot
                    assemble a trade plan or explicitly tell you to stay flat.
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/25"
                >
                  Review signal overview
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  ["Primary output", "Thesis, trade levels, and sizing in one view"],
                  ["Secondary detail", "Evidence and diagnostics only when you ask for them"],
                  ["Operator posture", "No-trade is treated as a valid high-discipline outcome"]
                ].map(([label, body]) => (
                  <div key={label} className="rounded-[20px] border border-line bg-paper p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                      {label}
                    </p>
                    <p className="mt-3 text-[0.98rem] leading-7 text-ink/76">{body}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
