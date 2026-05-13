import { AlertCircle, Bot, BookOpenText, Database, ShieldCheck } from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { SectionTitle } from "@/components/section-title";
import { getJournalFeed } from "@/lib/journal";

function formatOccurredAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusCopy(status: Awaited<ReturnType<typeof getJournalFeed>>["status"]) {
  if (status === "ready") {
    return {
      label: "Live persistence",
      detail: "Copilot runs and execution submissions are loading from the journal database."
    };
  }

  if (status === "empty") {
    return {
      label: "Ready but empty",
      detail: "The database is configured, but no persisted runs exist yet."
    };
  }

  if (status === "not_configured") {
    return {
      label: "Persistence off",
      detail: "DATABASE_URL is missing, so journal entries are not being saved."
    };
  }

  return {
    label: "Journal error",
    detail: "The journal data source could not be read successfully."
  };
}

export default async function JournalPage() {
  const journal = await getJournalFeed();
  const status = statusCopy(journal.status);

  return (
    <div className="space-y-8">
      <Panel>
        <Pill>Execution Journal</Pill>
        <SectionTitle
          eyebrow="Audit-friendly operations"
          title="Every thesis, trigger, and order should leave an understandable trail."
          description="The journal now reflects persisted SoTrade activity instead of placeholder examples. What appears here depends on whether Copilot and execution runs are actually being saved."
        />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
        <div className="space-y-5">
          <Panel>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">
              Journal source
            </p>
            <div className="mt-5 rounded-[20px] border border-line bg-paper p-4">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-signal" />
                <p className="text-[1rem] font-medium text-ink">{status.label}</p>
              </div>
              <p className="mt-3 text-[0.98rem] leading-7 text-ink/76">
                {status.detail}
              </p>
            </div>
            <div className="mt-4 space-y-4">
              {[
                "Copilot runs appear here only after they are successfully persisted.",
                "Execution entries represent packet submission, not final exchange lifecycle state.",
                "Trades placed before persistence was enabled cannot be reconstructed into the journal yet."
              ].map((item) => (
                <div
                  key={item}
                  className="border-b border-line pb-4 text-[1rem] leading-7 text-ink/76 last:border-b-0 last:pb-0"
                >
                  {item}
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">
              Journal notes
            </p>
            <div className="mt-5 grid gap-3">
              {journal.notes.map((item, index) => (
                <div
                  key={`journal-note-${index}`}
                  className="rounded-[18px] border border-line bg-paper p-4 text-[0.98rem] leading-7 text-ink/76"
                >
                  {item}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5">
          {journal.entries.length > 0 ? (
            journal.entries.map((entry) => (
              <Panel key={entry.id} className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm font-medium text-signal">
                  {formatOccurredAt(entry.occurredAt)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {entry.kind === "copilot" ? (
                      <Bot className="h-4 w-4 text-tide" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-tide" />
                    )}
                    <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                      {entry.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-[1rem] leading-7 text-ink/76">{entry.detail}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {entry.meta.map((item, index) => (
                      <span
                        key={`${entry.id}-meta-${index}`}
                        className="rounded-full border border-line bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </Panel>
            ))
          ) : (
            <Panel className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm font-medium text-ember">
                Waiting
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-ember" />
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                    No persisted journal entries yet
                  </h3>
                </div>
                <p className="mt-3 text-[1rem] leading-7 text-ink/76">
                  The page is no longer showing demo events. It will populate only after Copilot and execution activity is saved to the database.
                </p>
              </div>
            </Panel>
          )}

          <Panel>
            <div className="flex items-center gap-3">
              <BookOpenText className="h-4 w-4 text-tide" />
              <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                What this page captures today
              </h3>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                "Persisted Copilot thesis generations with horizon, bias, and trade levels.",
                "Persisted execution submissions with gateway acceptance context.",
                "Not yet included: SoDEX fill reconciliation, order lifecycle updates, or closed-position outcomes."
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[18px] border border-line bg-paper p-4 text-[0.98rem] leading-7 text-ink/76"
                >
                  {item}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
