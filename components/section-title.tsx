import type { ReactNode } from "react";

export function SectionTitle({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">
        {eyebrow}
      </p>
      <h2 className="balance-text mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-ink/80 sm:text-[1.05rem]">
        {description}
      </p>
    </div>
  );
}
