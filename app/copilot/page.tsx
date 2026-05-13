import { BrainCircuit, CheckCircle2, CircleOff, Target } from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { SectionTitle } from "@/components/section-title";
import { copilotSteps } from "@/lib/product";

export default function CopilotPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <Pill>AI Copilot</Pill>
          <SectionTitle
            eyebrow="On-demand thesis generation"
            title="From fragmented research inputs to a trade plan you can execute."
            description="The Copilot is designed to read all available SoSoValue market signals, explain what matters, and return a structured trade setup with entry, take-profit, stop-loss, and sizing logic."
          />
          <div className="mt-8 space-y-3">
            {copilotSteps.map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-4"
              >
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                  {index + 1}
                </div>
                <p className="text-sm leading-7 text-mist/78">{step}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="space-y-5">
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-5 w-5 text-signal" />
            <h3 className="text-xl font-semibold">Sample thesis frame</h3>
          </div>
          <div className="rounded-[24px] border border-signal/20 bg-signal/10 p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-signal/85">
              Directional bias
            </p>
            <h4 className="mt-3 text-2xl font-semibold">BTC continuation long</h4>
            <p className="mt-3 text-sm leading-7 text-mist/78">
              Positive ETF flow persistence, constructive research tone, and stable
              macro backdrop suggest a continuation setup if price reclaims intraday
              momentum with controlled downside.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Entry", value: "Breakout + pullback retest" },
              { label: "TP", value: "2-step ladder" },
              { label: "SL", value: "Below thesis invalidation" }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] border border-white/10 bg-black/15 p-4"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-mist/55">
                  {item.label}
                </p>
                <p className="mt-3 text-sm font-medium text-white">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: CheckCircle2,
                title: "Confirmation",
                body: "Sustained inflows and positive cross-signal agreement."
              },
              {
                icon: CircleOff,
                title: "Invalidation",
                body: "Risk-off macro tone or flow reversal breaks the thesis."
              },
              {
                icon: Target,
                title: "Sizing",
                body: "Position size derived from max loss budget and stop distance."
              }
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
              >
                <item.icon className="h-4 w-4 text-ember" />
                <p className="mt-4 text-sm font-medium text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-mist/75">{item.body}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
