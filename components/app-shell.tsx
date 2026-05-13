"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, BookMarked, Orbit, Radar } from "lucide-react";

import { navItems } from "@/lib/product";
import { cn } from "@/lib/cn";

const icons = {
  "/": Orbit,
  "/copilot": Bot,
  "/rules": Radar,
  "/journal": BookMarked
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-10 pt-5 sm:px-8 lg:px-10">
      <header className="mb-8 rounded-[28px] border border-line bg-cloud px-6 py-5 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate">
                SoSoValue x SoDEX
              </p>
              <span className="rounded-full border border-signal/20 bg-signal/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-signal">
                Testnet only
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
                  SoTrade
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-7 text-slate">
                  Research-driven crypto execution with an AI copilot and a
                  rules engine built for operator confidence.
                </p>
              </div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const Icon = icons[item.href as keyof typeof icons];
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                  active
                    ? "border-ink bg-ink text-cloud"
                    : "border-line bg-paper text-slate hover:border-ink/25 hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
