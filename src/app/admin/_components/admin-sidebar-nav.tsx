"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminSidebarItem = {
  href: string;
  label: string;
};

export type AdminSidebarSection = {
  title: string;
  items: AdminSidebarItem[];
};

type AdminSidebarNavProps = {
  sections: AdminSidebarSection[];
};

function isPathActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav({ sections }: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mt-8 space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">{section.title}</p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = isPathActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active ? "bg-[#111827] text-white" : "text-[#111827] hover:bg-[#f3f4f6]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
