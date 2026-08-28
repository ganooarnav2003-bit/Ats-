"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ClipboardCheck,
  Flag,
  LayoutDashboard,
  Menu,
  Users,
  CalendarRange,
  BarChart3,
  X,
} from "lucide-react";
import { canManagePeople, isHr } from "@/lib/auth/session-client";
import { cn, initials } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

type Item = { href: string; label: string; icon: typeof Flag; match?: string };

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items: Item[] = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/goals", label: "My goals", icon: Flag },
    { href: "/reviews/my-review", label: "My review", icon: ClipboardCheck },
  ];
  if (canManagePeople(user)) {
    items.push({ href: "/team", label: "My team", icon: Users, match: "/team" });
  }
  if (isHr(user)) {
    items.push(
      { href: "/admin/employees", label: "Directory", icon: Users },
      { href: "/admin/cycles", label: "Cycles", icon: CalendarRange },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    );
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || (item.match ? pathname.startsWith(item.match) : pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
              active
                ? "bg-teal-800 text-white"
                : "text-stone-300 hover:bg-stone-800 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-stone-100">
      <aside className="hidden w-64 flex-col bg-stone-900 p-4 text-stone-100 lg:flex">
        <div className="mb-8 px-2">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-400">Helios Consulting</p>
          <p className="mt-1 font-semibold">Apex Performance</p>
        </div>
        {nav}
        <div className="mt-auto rounded-lg bg-stone-800 p-3">
          <p className="text-sm font-medium">{user.full_name}</p>
          <p className="text-xs text-stone-400">{ROLE_LABELS[user.role]}</p>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="relative z-50 flex h-full w-72 flex-col bg-stone-900 p-4">
            <button className="mb-4 self-end text-stone-300" onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-stone-500 lg:block">
            {user.designation ?? "Team member"}
            {user.department ? ` · ${user.department}` : ""}
          </div>
          <div className="flex items-center gap-3">
            <form action="/api/sign-out" method="post">
              <button className="text-sm text-stone-500 hover:text-stone-800" type="submit">
                Sign out
              </button>
            </form>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-800 text-xs font-semibold text-white">
              {initials(user.full_name)}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
