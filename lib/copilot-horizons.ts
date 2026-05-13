import type { CopilotHorizon } from "@/lib/domain";

export interface CopilotHorizonOption {
  id: CopilotHorizon;
  label: string;
  shortLabel: string;
  windowLabel: string;
  summary: string;
  promptGuidance: string;
}

export const copilotHorizonOptions: CopilotHorizonOption[] = [
  {
    id: "intraday_1h_1d",
    label: "Intraday / 1h-1d",
    shortLabel: "Intraday",
    windowLabel: "1h-1d",
    summary: "Faster same-day posture with tighter timing and quicker invalidation.",
    promptGuidance:
      "Favor a shorter-duration setup that should resolve within the same day or next session. Keep the thesis reactive, the invalidation tight but realistic, and the take-profit structure concise."
  },
  {
    id: "swing_1_7d",
    label: "Swing / 1-7d",
    shortLabel: "Swing",
    windowLabel: "1-7d",
    summary: "Research-led multi-day setup with balanced patience and clear invalidation.",
    promptGuidance:
      "Favor a multi-day setup over the next 1 to 7 days. Balance confirmation with patience, and use a trade structure that fits a research-driven swing thesis rather than a scalp."
  },
  {
    id: "position_1w_4w",
    label: "Position / 1w-4w",
    shortLabel: "Position",
    windowLabel: "1w-4w",
    summary: "Slower positioning cycle with wider thesis room and staged exits.",
    promptGuidance:
      "Favor a slower multi-day to multi-week positioning plan. Allow wider invalidation when justified, think in staged exits, and avoid framing the setup like an intraday trade."
  }
];

const copilotHorizonMap = Object.fromEntries(
  copilotHorizonOptions.map((option) => [option.id, option])
) as Record<CopilotHorizon, CopilotHorizonOption>;

export function isCopilotHorizon(value: string): value is CopilotHorizon {
  return value in copilotHorizonMap;
}

export function getCopilotHorizonOption(
  horizon: CopilotHorizon
): CopilotHorizonOption {
  return copilotHorizonMap[horizon];
}
