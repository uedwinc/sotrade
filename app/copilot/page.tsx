import { BrainCircuit, CheckCircle2, CircleOff, Target } from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { SectionTitle } from "@/components/section-title";
import { copilotSteps } from "@/lib/product";

export default function CopilotPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <Panel>
          <Pill>AI Copilot</Pill>
          <SectionTitle
            eyebrow="On-demand thesis generation"
            title="From fragmented research inputs to a trade plan an operator can trust."
            description="The Copilot is designed to read the available SoSoValue signal bundle, explain what matters, and return a structured setup with entry, take-profit, stop-loss, and sizing logic."
          />
          <div className="mt-8 space-y-3 border-t border-line pt-6">
            {copilotSteps.map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-4 rounded-2xl border border-line bg-paper px-4 py-4"
              >
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-cloud">
                  {index + 1}
                </div>
                <p className="text-sm leading-7 text-slate">{step}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="space-y-5">
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-5 w-5 text-signal" />
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink">
              Thesis workspace
            </h3>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.68fr_0.32fr]">
            <div className="rounded-[22px] border border-line bg-paper p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">
                  Directional bias
                </p>
                <span className="rounded-full border border-signal/20 bg-signal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-signal">
                  Constructive
                </span>
              </div>
              <h4 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-ink">
                BTC continuation long
              </h4>
              <p className="mt-3 text-sm leading-7 text-slate">
                Positive ETF flow persistence, constructive research tone, and a
                stable macro backdrop support a continuation setup if price
                reclaims intraday momentum with disciplined downside control.
              </p>
              <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
                {[
                  ["Signal agreement", "High"],
                  ["Timing quality", "Await reclaim"],
                  ["Execution mode", "One-click review"]
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-medium text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[22px] border border-line bg-canvas p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">
                Signal stack
              </p>
              <div className="mt-4 space-y-3">
                {[
                  ["ETF inflows", "Persistent positive"],
                  ["News tone", "Risk-on"],
                  ["Sector rotation", "BTC leadership intact"],
                  ["Macro events", "No immediate shock"]
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-line pb-3 last:border-b-0 last:pb-0">
                    <p className="text-sm font-medium text-ink">{label}</p>
                    <p className="mt-1 text-sm text-slate">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Entry", value: "Breakout + pullback retest" },
              { label: "TP", value: "2-step ladder" },
              { label: "SL", value: "Below thesis invalidation" }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[20px] border border-line bg-paper p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
                  {item.label}
                </p>
                <p className="mt-3 text-sm font-medium text-ink">{item.value}</p>
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
                className="rounded-[20px] border border-line bg-cloud p-4"
              >
                <item.icon className="h-4 w-4 text-ember" />
                <p className="mt-4 text-sm font-medium text-ink">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate">{item.body}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
