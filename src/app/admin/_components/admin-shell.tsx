"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AdminSidebarNav, type AdminSidebarSection } from "./admin-sidebar-nav";

type AdminShellProps = {
  email: string | null;
  isSuperAdmin: boolean;
  sections: AdminSidebarSection[];
  onSignOut: () => Promise<void>;
  children: ReactNode;
};

type SidebarContentProps = {
  email: string | null;
  isSuperAdmin: boolean;
  sections: AdminSidebarSection[];
  onSignOut: () => Promise<void>;
  onNavigate?: () => void;
  onClose?: () => void;
};

function SidebarContent({ email, isSuperAdmin, sections, onSignOut, onNavigate, onClose }: SidebarContentProps) {
  const emailLabel = email ?? "-";

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-title text-4xl uppercase leading-none">Admin IDFES</p>
          <p className="mt-2 text-sm text-[#6b7280]">{emailLabel}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#374151]">
            {isSuperAdmin ? "super_admin" : "admin_category"}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#d1d5db] px-3 py-1 text-sm font-semibold text-[#111827] lg:hidden"
            aria-label="Tutup menu"
          >
            Tutup
          </button>
        ) : null}
      </div>

      <AdminSidebarNav sections={sections} onItemClick={onNavigate} />

      <form action={onSignOut} className="mt-8">
        <button type="submit" className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
          Logout
        </button>
      </form>
    </>
  );
}

export function AdminShell({ email, isSuperAdmin, sections, onSignOut, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-[#111827]">
      <header className="sticky top-0 z-30 border-b border-[#e5e7eb] bg-white px-4 py-3 lg:hidden">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#111827]"
            aria-label="Buka menu admin"
          >
            Menu
          </button>
          <p className="font-title text-2xl uppercase leading-none">Admin IDFES</p>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          aria-label="Tutup menu admin"
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[300px] max-w-[85vw] border-r border-[#e5e7eb] bg-white p-6 shadow-xl transition-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent
            email={email}
            isSuperAdmin={isSuperAdmin}
            sections={sections}
            onSignOut={onSignOut}
            onNavigate={() => setMobileOpen(false)}
            onClose={() => setMobileOpen(false)}
          />
        </aside>
      </div>

      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[300px_1fr]">
        <aside className="hidden border-r border-[#e5e7eb] bg-white p-6 lg:sticky lg:top-0 lg:block lg:h-screen">
          <SidebarContent email={email} isSuperAdmin={isSuperAdmin} sections={sections} onSignOut={onSignOut} />
        </aside>

        <section className="w-full p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </section>
      </div>
    </div>
  );
}
