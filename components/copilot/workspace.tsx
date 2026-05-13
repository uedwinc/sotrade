"use client";

import { useState, useTransition } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CircleOff,
  ShieldCheck,
  Target
} from "lucide-react";

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

  const currentSnapshot = result?.signalSnapshot ?? initialSignalSnapshot;
  const currentPriceAnchor = result?.priceAnchor ?? initialPriceAnchor;

  return (
    <div className="space-y-8">
      <Panel>
        <Pill>AI Copilot · Milestone 3</Pill>
        <SectionTitle
          eyebrow="Bedrock-powered BTC workspace"
          title="Generate a structured BTC swing trade plan from live SoSoValue signals."
          description="The Copilot now reads the current signal bundle, anchors to a live BTC spot price, and uses Amazon Bedrock to draft a thesis, concrete trade levels, invalidation, and risk-based position sizing."
        />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[0.74fr_1.26fr]">
        <div className="space-y-6">
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
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
                className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-cloud transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Generating..." : "Generate BTC trade plan"}
              </button>
            </form>
          </Panel>

          <Panel>
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-signal" />
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
                Live context
              </h3>
            </div>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[20px] border border-line bg-paper p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                      BTC spot price anchor
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
                      {currentPriceAnchor
                        ? formatUsd(currentPriceAnchor.spotPriceUsd)
                        : "Unavailable"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-cloud px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                      Source
                    </p>
                    <p className="mt-2 text-[1rem] font-medium text-ink">Coinbase BTC-USD</p>
                  </div>
                </div>
                <p className="mt-3 text-[0.98rem] leading-7 text-ink/76">
                  {currentPriceAnchor
                    ? `Observed ${formatObservedAt(currentPriceAnchor.observedAt)}`
                    : initialPriceError ?? "The page could not fetch a live BTC spot price yet."}
                </p>
              </div>

              {currentSnapshot.signals.map((signal) => (
                <div key={signal.id} className="rounded-[20px] border border-line bg-paper p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-line bg-cloud px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate">
                          {signal.kind.replaceAll("_", " ")}
                        </span>
                        <span className="rounded-full border border-line bg-cloud px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate">
                          {signal.asset}
                        </span>
                      </div>
                      <h4 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-ink">
                        {signal.title}
                      </h4>
                    </div>
                    <div className="rounded-2xl border border-line bg-cloud px-4 py-3">
                      <div className="flex items-center gap-2 text-[1rem] font-medium text-ink">
                        <BiasIcon bias={signal.bias} className="h-4 w-4 text-signal" />
                        {biasLabel(signal.bias)}
                      </div>
                      <p className="mt-2 text-sm text-ink/72">{signal.strength}/100 strength</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[0.98rem] leading-7 text-ink/76">
                    {signal.summary}
                  </p>
                </div>
              ))}

              <div className="rounded-[20px] border border-line bg-paper p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                  Ingestion notes
                </p>
                <div className="mt-3 grid gap-2">
                  {currentSnapshot.notes.map((item) => (
                    <div key={item} className="text-[0.98rem] leading-7 text-ink/76">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
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
                  <div className="mt-5 grid gap-3">
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
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <Pill>Latest thesis</Pill>
                    <h3 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-ink">
                      {result.thesis.summary}
                    </h3>
                    <p className="mt-3 text-[1rem] leading-7 text-ink/76">
                      Generated {formatObservedAt(result.generatedAt)} · Model {result.model.modelId}
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
                <div className="mt-6 grid gap-4 border-t border-line pt-5 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                      Rationale
                    </p>
                    <div className="mt-3 grid gap-2">
                      {result.thesis.rationale.map((item) => (
                        <div key={item} className="rounded-2xl border border-line bg-paper px-4 py-3 text-[0.98rem] leading-7 text-ink/76">
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
                        <div key={item} className="rounded-2xl border border-line bg-paper px-4 py-3 text-[0.98rem] leading-7 text-ink/76">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>

              <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
                <Panel>
                  <div className="flex items-center gap-3">
                    {result.tradePlan.actionable ? (
                      <Target className="h-5 w-5 text-signal" />
                    ) : (
                      <CircleOff className="h-5 w-5 text-ember" />
                    )}
                    <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
                      {result.tradePlan.actionable ? "Trade structure" : "No-trade posture"}
                    </h3>
                  </div>
                  {result.tradePlan.actionable ? (
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      {[
                        ["Entry", formatUsd(result.tradePlan.entryPriceUsd)],
                        ["Stop loss", formatUsd(result.tradePlan.stopLossUsd)],
                        [
                          "Take profit",
                          result.tradePlan.takeProfitUsd.map((value) => formatUsd(value)).join(" · ")
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
                  ) : (
                    <div className="mt-5 rounded-[20px] border border-line bg-paper p-4 text-[1rem] leading-7 text-ink/76">
                      The Copilot is intentionally withholding a live setup because the signal bundle does not justify a clean actionable trade right now.
                    </div>
                  )}
                  <div className="mt-5 grid gap-4 border-t border-line pt-5 lg:grid-cols-2">
                    <div className="rounded-[20px] border border-line bg-paper p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                        Invalidation
                      </p>
                      <p className="mt-3 text-[0.98rem] leading-7 text-ink/76">
                        {result.tradePlan.invalidation}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-line bg-paper p-4">
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
                </Panel>

                <Panel>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-signal" />
                    <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
                      Risk sizing
                    </h3>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
                      [
                        "Position size",
                        result.sizing.positionSizeBtc === null
                          ? "Not set"
                          : `${formatNumber(result.sizing.positionSizeBtc, 6)} BTC`
                      ],
                      ["Position notional", formatUsd(result.sizing.positionNotionalUsd)],
                      ["Persistence", result.persistence.status]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[20px] border border-line bg-paper p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                          {label}
                        </p>
                        <p className="mt-3 text-[1rem] font-medium leading-7 text-ink">{value}</p>
                      </div>
                    ))}
                  </div>
                  {result.persistence.reason ? (
                    <div className="mt-5 rounded-[20px] border border-line bg-paper p-4 text-[0.98rem] leading-7 text-ink/76">
                      {result.persistence.reason}
                    </div>
                  ) : null}
                </Panel>
              </div>
            </>
          ) : (
            <Panel>
              <div className="flex items-start gap-3">
                <Bot className="mt-1 h-5 w-5 text-signal" />
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
                    Waiting for generation
                  </h3>
                  <p className="mt-3 text-[1rem] leading-7 text-ink/76">
                    Enter your account equity and max risk, then generate a BTC swing plan. The Copilot will combine the live SoSoValue signal bundle with a Coinbase BTC spot anchor and a Bedrock model response.
                  </p>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
