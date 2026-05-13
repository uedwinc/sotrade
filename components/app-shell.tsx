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
      <header className="mb-8 flex flex-col gap-5 rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-mist/55">
            SoSoValue x SoDEX
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            SoTrade
          </h1>
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
                    ? "border-signal/40 bg-signal/15 text-white"
                    : "border-white/10 bg-white/[0.03] text-mist/70 hover:border-white/20 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
