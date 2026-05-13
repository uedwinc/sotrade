"use client";

import Link from "next/link";
import { useState } from "react";
import { flushSync } from "react-dom";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  LoaderCircle
} from "lucide-react";

import { Disclosure } from "@/components/ui/disclosure";
import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { SectionTitle } from "@/components/section-title";
import {
  copilotHorizonOptions,
  getCopilotHorizonOption
} from "@/lib/copilot-horizons";
import type {
  CopilotHorizon,
  CopilotErrorResponse,
  CopilotResponse,
  ExecutionErrorResponse,
  ExecutionPlanRequest,
  ExecutionPreviewResponse,
  ExecutionSubmitResponse,
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

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function CopilotWorkspace({
  initialSignalSnapshot,
  initialPriceAnchor,
  initialPriceError
}: CopilotWorkspaceProps) {
  const [accountEquityUsd, setAccountEquityUsd] = useState("10000");
  const [maxRiskPct, setMaxRiskPct] = useState("1");
  const [selectedHorizon, setSelectedHorizon] =
    useState<CopilotHorizon>("swing_1_7d");
  const [result, setResult] = useState<CopilotResponse | null>(null);
  const [error, setError] = useState<CopilotErrorResponse | null>(null);
  const [executionPreview, setExecutionPreview] = useState<ExecutionPreviewResponse | null>(null);
  const [executionSubmit, setExecutionSubmit] = useState<ExecutionSubmitResponse | null>(null);
  const [executionError, setExecutionError] = useState<ExecutionErrorResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewingExecution, setIsPreviewingExecution] = useState(false);
  const [isSubmittingExecution, setIsSubmittingExecution] = useState(false);

  const activeSnapshot = result?.signalSnapshot ?? initialSignalSnapshot;
  const activePriceAnchor = result?.priceAnchor ?? initialPriceAnchor;
  const activeModelId = result?.model.modelId ?? "anthropic.claude-sonnet-4-6";
  const activeHorizon = getCopilotHorizonOption(result?.horizon ?? selectedHorizon);
  const activePendingState = isGenerating
    ? {
        title: "Building the trade plan",
        detail:
          `SoTrade is reading the latest signal bundle, anchoring BTC spot, and asking Bedrock for a ${activeHorizon.shortLabel.toLowerCase()} decision.`
      }
    : isSubmittingExecution
      ? {
          title: "Submitting the SoDEX testnet packet",
          detail:
            "SoTrade is refreshing the packet and sending the signed bracket order to SoDEX testnet."
        }
      : isPreviewingExecution
        ? {
            title: "Preparing the live SoDEX packet",
            detail:
              "SoTrade is normalizing the Copilot plan against live SoDEX symbol and mark-price data."
          }
        : null;

  function resetDecisionState() {
    setResult(null);
    setError(null);
    setExecutionPreview(null);
    setExecutionSubmit(null);
    setExecutionError(null);
  }

  function buildExecutionRequest() {
    if (
      !result ||
      !result.tradePlan.actionable ||
      result.tradePlan.entryPriceUsd === null ||
      result.tradePlan.stopLossUsd === null ||
      result.sizing.positionSizeBtc === null
    ) {
      return null;
    }

    return {
      asset: "BTC" as const,
      thesisBias: result.thesis.bias,
      entryPriceUsd: result.tradePlan.entryPriceUsd,
      stopLossUsd: result.tradePlan.stopLossUsd,
      takeProfitUsd: result.tradePlan.takeProfitUsd,
      positionSizeBtc: result.sizing.positionSizeBtc,
      copilotHorizon: result.horizon,
      copilotGeneratedAt: result.generatedAt,
      copilotRunId: result.persistence.id
    };
  }

  async function requestExecutionPreview(requestPayload: ExecutionPlanRequest) {
    try {
      flushSync(() => {
        setIsPreviewingExecution(true);
        setExecutionError(null);
        setExecutionSubmit(null);
        setExecutionPreview(null);
      });
      await waitForNextPaint();

      const response = await fetch("/api/execution/preview", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(requestPayload)
      });
      const body = (await response.json()) as
        | ExecutionPreviewResponse
        | ExecutionErrorResponse;

      if (!response.ok) {
        setExecutionPreview(null);
        setExecutionError(body as ExecutionErrorResponse);
        return null;
      }

      const preview = body as ExecutionPreviewResponse;
      setExecutionPreview(preview);
      return preview;
    } catch (previewError) {
      setExecutionPreview(null);
      setExecutionError({
        error: {
          code: "EXECUTION_PREVIEW_FAILED",
          message: "The browser could not build a SoDEX execution preview.",
          retryable: true,
          details: [
            previewError instanceof Error
              ? previewError.message
              : "Unknown execution preview error"
          ]
        }
      });
      return null;
    } finally {
      setIsPreviewingExecution(false);
    }
  }

  return (
    <div className="space-y-8">
      <Panel>
        <Pill>AI Copilot / Milestone 4</Pill>
        <SectionTitle
          eyebrow="Multi-cycle BTC workspace"
          title="A simpler Copilot flow with one selector for intraday, swing, or position trade cycles."
          description="This workspace stays intentionally narrow. Choose the trade cycle on the left, keep the primary decision visible first, and open evidence or diagnostics only when you need them."
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
              onSubmit={async (event) => {
                event.preventDefault();

                try {
                  flushSync(() => {
                    setIsGenerating(true);
                    setError(null);
                    setExecutionPreview(null);
                    setExecutionSubmit(null);
                    setExecutionError(null);
                  });
                  await waitForNextPaint();

                  const response = await fetch("/api/copilot/thesis", {
                    method: "POST",
                    headers: {
                      "content-type": "application/json"
                    },
                    body: JSON.stringify({
                      asset: "BTC",
                      horizon: selectedHorizon,
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
                } finally {
                  setIsGenerating(false);
                }
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
                  Trade cycle
                </span>
                <select
                  className="rounded-2xl border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-ink/30"
                  value={selectedHorizon}
                  onChange={(event) => {
                    setSelectedHorizon(event.target.value as CopilotHorizon);
                    resetDecisionState();
                  }}
                >
                  {copilotHorizonOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl border border-line bg-paper px-4 py-4">
                <p className="text-[0.98rem] leading-7 text-ink/76">
                  {activeHorizon.summary}
                </p>
              </div>

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
                  <p className="mt-2 text-[1rem] font-medium text-ink">{activeHorizon.label}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                aria-busy={isGenerating}
                className="inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-cloud transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              >
                {isGenerating ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Generating trade plan...
                  </span>
                ) : (
                  "Generate BTC trade plan"
                )}
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
                    ? `Coinbase / ${formatObservedAt(activePriceAnchor.observedAt)}`
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
          {activePendingState ? (
            <Panel className="border-signal/20 bg-signal/5">
              <div className="flex items-start gap-3">
                <LoaderCircle className="mt-1 h-5 w-5 animate-spin text-signal" />
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
                    {activePendingState.title}
                  </h3>
                  <p className="mt-3 text-[1rem] leading-7 text-ink/76">
                    {activePendingState.detail}
                  </p>
                </div>
              </div>
            </Panel>
          ) : null}

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
                    {(error.error.details ?? []).map((item, index) => (
                      <div key={`copilot-error-${index}`} className="rounded-2xl border border-line bg-paper px-4 py-3 text-[0.98rem] leading-7 text-ink/76">
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
                        {activeHorizon.label}
                      </span>
                      <span className="rounded-full border border-line bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate">
                        {result.tradePlan.actionable ? "Actionable" : "No trade"}
                      </span>
                    </div>
                    <h3 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-ink">
                      {result.thesis.summary}
                    </h3>
                    <p className="mt-3 text-[1rem] leading-7 text-ink/76">
                      Generated {formatObservedAt(result.generatedAt)} for {activeHorizon.label} using {activeModelId}
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
                        ? result.tradePlan.takeProfitUsd.map((value) => formatUsd(value)).join(" / ")
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
                    The Copilot is intentionally withholding a live setup. That is a valid outcome when the signal stack does not justify a clean {activeHorizon.shortLabel.toLowerCase()} trade.
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
                        {result.thesis.rationale.map((item, index) => (
                          <div key={`rationale-${index}`} className="rounded-2xl border border-line bg-cloud px-4 py-3 text-[0.98rem] leading-7 text-ink/76">
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
                        {result.thesis.risks.map((item, index) => (
                          <div key={`risk-${index}`} className="rounded-2xl border border-line bg-cloud px-4 py-3 text-[0.98rem] leading-7 text-ink/76">
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
                          {result.tradePlan.executionNotes.map((item, index) => (
                            <div key={`execution-note-${index}`} className="text-[0.98rem] leading-7 text-ink/76">
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

                {result.tradePlan.actionable ? (
                  <Disclosure
                    title="SoDEX testnet execution"
                    meta="Preview the live bracket order packet, then submit to testnet when ready"
                    defaultOpen
                  >
                    <div className="space-y-5">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={isPreviewingExecution || isSubmittingExecution}
                          onClick={async () => {
                            const requestPayload = buildExecutionRequest();

                            if (!requestPayload) {
                              return;
                            }
                            await requestExecutionPreview(requestPayload);
                          }}
                          aria-busy={isPreviewingExecution}
                          className="inline-flex items-center justify-center rounded-full border border-line bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/25 disabled:cursor-wait disabled:opacity-60"
                        >
                          {isPreviewingExecution ? (
                            <span className="inline-flex items-center gap-2">
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Preparing preview...
                            </span>
                          ) : (
                            "Preview SoDEX order packet"
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={isPreviewingExecution || isSubmittingExecution}
                          onClick={async () => {
                            const requestPayload = buildExecutionRequest();

                            if (!requestPayload) {
                              return;
                            }

                            try {
                              flushSync(() => {
                                setIsSubmittingExecution(true);
                                setExecutionError(null);
                                setExecutionSubmit(null);
                              });
                              await waitForNextPaint();

                              const preview = await requestExecutionPreview(requestPayload);

                              if (!preview) {
                                return;
                              }

                              const response = await fetch("/api/execution/submit", {
                                method: "POST",
                                headers: {
                                  "content-type": "application/json"
                                },
                                body: JSON.stringify(requestPayload)
                              });
                              const body = (await response.json()) as
                                | ExecutionSubmitResponse
                                | ExecutionErrorResponse;

                              if (!response.ok) {
                                setExecutionSubmit(null);
                                setExecutionError(body as ExecutionErrorResponse);
                                return;
                              }

                              setExecutionSubmit(body as ExecutionSubmitResponse);
                              setExecutionPreview(body as ExecutionPreviewResponse);
                            } catch (submitError) {
                              setExecutionSubmit(null);
                              setExecutionError({
                                error: {
                                  code: "EXECUTION_SUBMIT_FAILED",
                                  message: "The browser could not submit the SoDEX execution request.",
                                  retryable: true,
                                  details: [
                                    submitError instanceof Error
                                      ? submitError.message
                                      : "Unknown execution submit error"
                                  ]
                                }
                              });
                            } finally {
                              setIsSubmittingExecution(false);
                            }
                          }}
                          aria-busy={isSubmittingExecution}
                          className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-cloud transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                        >
                          {isSubmittingExecution ? (
                            <span className="inline-flex items-center gap-2">
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Submitting...
                            </span>
                          ) : (
                            "Execute on SoDEX testnet"
                          )}
                        </button>
                      </div>

                      <div className="rounded-[20px] border border-line bg-paper p-4 text-[0.98rem] leading-7 text-ink/76">
                        This execution path uses a SoDEX testnet perps bracket order on `BTC-USD` with one attached take-profit and one attached stop-loss. The current live packet uses the first take-profit level from the Copilot plan.
                      </div>

                      <div className="rounded-[20px] border border-line bg-cloud p-4 text-[0.98rem] leading-7 text-ink/76">
                        Exit order direction reflects the action needed to close the position. A short position closes with BUY reduce-only orders, while a long position closes with SELL reduce-only orders.
                      </div>

                      {activePendingState && !isGenerating ? (
                        <div className="rounded-[20px] border border-signal/20 bg-signal/5 p-4">
                          <div className="flex items-start gap-3">
                            <LoaderCircle className="mt-1 h-5 w-5 animate-spin text-signal" />
                            <div>
                              <p className="text-[1rem] font-medium text-ink">
                                {activePendingState.title}
                              </p>
                              <p className="mt-2 text-[0.98rem] leading-7 text-ink/76">
                                {activePendingState.detail}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {executionError ? (
                        <div className="rounded-[20px] border border-ember/20 bg-amber-50 p-4">
                          <p className="text-[1rem] font-medium text-ember">
                            {executionError.error.message}
                          </p>
                          <div className="mt-3 grid gap-2">
                            {(executionError.error.details ?? []).map((item, index) => (
                              <div key={`execution-error-${index}`} className="text-[0.98rem] leading-7 text-ember">
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {executionPreview ? (
                        <div className="grid gap-4">
                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {[
                              ["Environment", executionPreview.environment],
                              ["Symbol", executionPreview.symbol.name],
                              ["Trade cycle", activeHorizon.label],
                              ["Mark price", formatUsd(executionPreview.market.markPrice)],
                              ["Index price", formatUsd(executionPreview.market.indexPrice)],
                              ["Account ID", String(executionPreview.account.accountId)],
                              ["API wallet", executionPreview.account.apiWalletAddress]
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-[20px] border border-line bg-cloud p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                                  {label}
                                </p>
                                <p className="mt-3 break-all text-[1rem] font-medium leading-7 text-ink">
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>

                          <Disclosure
                            title="Order preview"
                            meta={`${executionPreview.orders.length} orders in the bracket packet`}
                            defaultOpen
                          >
                            <div className="grid gap-3">
                              {executionPreview.orders.map((order) => (
                                <div key={order.clOrdID} className="rounded-[18px] border border-line bg-cloud p-4">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <p className="text-[1rem] font-medium text-ink">
                                        {order.intentLabel}
                                      </p>
                                      <p className="mt-1 text-sm text-ink/72">{order.clOrdID}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="rounded-full border border-line bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate">
                                        {order.side} / {order.type}
                                      </div>
                                      {order.reduceOnly ? (
                                        <div className="rounded-full border border-signal/20 bg-signal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-signal">
                                          Reduce only
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                                    {[
                                      ["Time in force", order.timeInForce],
                                      ["Price", order.price ?? "Market"],
                                      ["Stop price", order.stopPrice ?? "None"],
                                      ["Quantity", order.quantity ?? "None"]
                                    ].map(([label, value]) => (
                                      <div key={label}>
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                                          {label}
                                        </p>
                                        <p className="mt-2 text-[0.98rem] text-ink/76">{value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Disclosure>

                          {executionPreview.adjustments.length > 0 ? (
                            <Disclosure
                              title="Normalization adjustments"
                              meta={`${executionPreview.adjustments.length} adjustments applied`}
                            >
                              <div className="grid gap-2 text-[0.98rem] leading-7 text-ink/76">
                                {executionPreview.adjustments.map((item, index) => (
                                  <div key={`adjustment-${index}`}>{item}</div>
                                ))}
                              </div>
                            </Disclosure>
                          ) : null}

                          <Disclosure
                            title="Warnings"
                            meta={`${executionPreview.warnings.length} live execution notes`}
                          >
                            <div className="grid gap-2 text-[0.98rem] leading-7 text-ink/76">
                              {executionPreview.warnings.map((item, index) => (
                                <div key={`warning-${index}`}>{item}</div>
                              ))}
                            </div>
                          </Disclosure>
                        </div>
                      ) : null}

                      {executionSubmit ? (
                        <Disclosure
                          title="Submission result"
                          meta={`Nonce ${executionSubmit.nonce}`}
                          defaultOpen
                        >
                          <div className="grid gap-4">
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                              {[
                                ["Gateway code", String(executionSubmit.response.code)],
                                ["Submitted", formatObservedAt(executionSubmit.submittedAt)],
                                ["Persistence", executionSubmit.persistence.status],
                                ["Request type", executionSubmit.requestType]
                              ].map(([label, value]) => (
                                <div key={label} className="rounded-[20px] border border-line bg-cloud p-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                                    {label}
                                  </p>
                                  <p className="mt-3 text-[1rem] font-medium leading-7 text-ink">
                                    {value}
                                  </p>
                                </div>
                              ))}
                            </div>
                            {executionSubmit.response.error ? (
                              <div className="rounded-[20px] border border-ember/20 bg-amber-50 p-4 text-[0.98rem] leading-7 text-ember">
                                {executionSubmit.response.error}
                              </div>
                            ) : null}
                            {executionSubmit.persistence.reason ? (
                              <div className="rounded-[20px] border border-line bg-paper p-4 text-[0.98rem] leading-7 text-ink/76">
                                {executionSubmit.persistence.reason}
                              </div>
                            ) : null}
                            {executionSubmit.response.data?.length ? (
                              <div className="grid gap-3">
                                {executionSubmit.response.data.map((item) => (
                                  <div key={item.clOrdID} className="rounded-[18px] border border-line bg-cloud p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <p className="text-[1rem] font-medium text-ink">{item.clOrdID}</p>
                                      <span className="rounded-full border border-line bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate">
                                        Code {item.code}
                                      </span>
                                    </div>
                                    <div className="mt-3 grid gap-2 text-[0.98rem] leading-7 text-ink/76">
                                      {item.orderID ? <div>Order ID: {item.orderID}</div> : null}
                                      {item.error ? <div>Error: {item.error}</div> : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </Disclosure>
                      ) : null}
                    </div>
                  </Disclosure>
                ) : null}

                <Disclosure
                  title="Underlying signal context"
                  meta={`${result.signalSnapshot.signals.length} signals supporting this request`}
                >
                  <div className="space-y-3">
                    {result.signalSnapshot.signals.map((signal, index) => (
                      <Disclosure
                        key={`${signal.id}-${signal.observedAt}-${index}`}
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
                              {signal.evidence.map((item, evidenceIndex) => (
                                <div key={`${signal.id}-evidence-${evidenceIndex}`} className="text-[0.98rem] leading-7 text-ink/76">
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
                          {result.signalSnapshot.notes.map((item, index) => (
                            <div key={`snapshot-note-${index}`} className="text-[0.98rem] leading-7 text-ink/76">
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
                    Use the left rail to set equity, choose a trade cycle, and let
                    the Copilot assemble a trade plan or explicitly tell you to stay flat.
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

      {activePendingState ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50 w-[min(420px,calc(100vw-2rem))]">
          <div className="rounded-[22px] border border-signal/20 bg-ink px-5 py-4 text-cloud shadow-card">
            <div className="flex items-start gap-3">
              <LoaderCircle className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-cloud" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cloud/72">
                  Working
                </p>
                <p className="mt-1 text-[1rem] font-medium text-cloud">
                  {activePendingState.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-cloud/80">
                  {activePendingState.detail}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
