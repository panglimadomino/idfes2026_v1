"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type AdminSidebarItem = {
  href: string;
  label: string;
  exact?: boolean;
  children?: AdminSidebarItem[];
};

export type AdminSidebarSection = {
  title: string;
  items: AdminSidebarItem[];
};

type AdminSidebarNavProps = {
  sections: AdminSidebarSection[];
  onItemClick?: () => void;
};

function isItemActive(pathname: string, searchParams: URLSearchParams, item: AdminSidebarItem): boolean {
  const target = new URL(item.href, "http://localhost");
  const targetPath = target.pathname;

  const pathMatch = item.exact
    ? pathname === targetPath
    : targetPath === "/admin"
      ? pathname === "/admin"
      : pathname === targetPath || pathname.startsWith(`${targetPath}/`);

  if (!pathMatch) return false;

  for (const [key, value] of target.searchParams.entries()) {
    if (searchParams.get(key) !== value) return false;
  }

  return true;
}

function hasActiveChild(pathname: string, searchParams: URLSearchParams, item: AdminSidebarItem): boolean {
  return (item.children ?? []).some((child) => isActive(pathname, searchParams, child));
}

function isActive(pathname: string, searchParams: URLSearchParams, item: AdminSidebarItem): boolean {
  return isItemActive(pathname, searchParams, item) || hasActiveChild(pathname, searchParams, item);
}

function collectActiveAncestorKeys(
  items: AdminSidebarItem[],
  pathname: string,
  searchParams: URLSearchParams,
  ancestors: string[] = [],
): string[] {
  const keys = new Set<string>();

  for (const item of items) {
    const currentAncestors = [...ancestors, item.href];

    if (isActive(pathname, searchParams, item)) {
      for (const key of currentAncestors) keys.add(key);
    }

    if (item.children?.length) {
      const childKeys = collectActiveAncestorKeys(item.children, pathname, searchParams, currentAncestors);
      for (const key of childKeys) keys.add(key);
    }
  }

  return [...keys];
}

function hasActiveItemInSection(pathname: string, searchParams: URLSearchParams, section: AdminSidebarSection): boolean {
  return section.items.some((item) => isActive(pathname, searchParams, item));
}

function SidebarItemRow({
  item,
  pathname,
  searchParams,
  onItemClick,
  depth,
  isOpen,
  getIsOpen,
  onToggle,
}: {
  item: AdminSidebarItem;
  pathname: string;
  searchParams: URLSearchParams;
  onItemClick?: () => void;
  depth: number;
  isOpen: boolean;
  getIsOpen: (key: string) => boolean;
  onToggle: (key: string, isOpen: boolean) => void;
}) {
  const active = isActive(pathname, searchParams, item);
  const childItems = item.children ?? [];
  const hasChildren = childItems.length > 0;
  const maxDepth = Math.min(depth, 5);
  const paddingLeft = 12 + maxDepth * 12;
  const textSize = depth === 0 ? "text-sm" : "text-xs";
  const rowBase = `block rounded-lg py-2 transition ${textSize}`;
  const rowText = active ? "font-bold text-[#111827]" : "font-normal text-[#111827] hover:font-bold";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Link
          href={item.href}
          onClick={onItemClick}
          style={{ paddingLeft, paddingRight: hasChildren ? 4 : 12 }}
          className={`${rowBase} ${rowText} flex-1`}
        >
          {item.label}
        </Link>

        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(item.href, isOpen)}
            aria-label={isOpen ? `Sembunyikan submenu ${item.label}` : `Tampilkan submenu ${item.label}`}
            className="rounded px-2 py-1 text-xs font-semibold text-[#4b5563] hover:text-[#111827]"
          >
            {isOpen ? "▾" : "▸"}
          </button>
        ) : null}
      </div>

      {hasChildren && isOpen ? (
        <div className="space-y-1">
          {childItems.map((child) => (
            <SidebarItemRow
              key={child.href}
              item={child}
              pathname={pathname}
              searchParams={searchParams}
              onItemClick={onItemClick}
              depth={depth + 1}
              isOpen={getIsOpen(child.href)}
              getIsOpen={getIsOpen}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdminSidebarNav({ sections, onItemClick }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeKeySet = useMemo(() => {
    const keys = new Set<string>();
    for (const section of sections) {
      const sectionKeys = collectActiveAncestorKeys(section.items, pathname, searchParams);
      for (const key of sectionKeys) keys.add(key);
    }
    return keys;
  }, [pathname, searchParams, sections]);

  const [accordionOverrides, setAccordionOverrides] = useState<Record<string, boolean>>({});
  const [sectionOverrides, setSectionOverrides] = useState<Record<string, boolean>>({});

  function isOpenByKey(key: string) {
    const override = accordionOverrides[key];
    if (typeof override === "boolean") return override;
    return activeKeySet.has(key);
  }

  function handleToggle(key: string, isCurrentlyOpen: boolean) {
    setAccordionOverrides((prev) => ({
      ...prev,
      [key]: !isCurrentlyOpen,
    }));
  }

  function isSectionOpen(section: AdminSidebarSection) {
    const sectionKey = `section:${section.title}`;
    const override = sectionOverrides[sectionKey];
    if (typeof override === "boolean") return override;
    return true;
  }

  function handleSectionToggle(section: AdminSidebarSection, isCurrentlyOpen: boolean) {
    const sectionKey = `section:${section.title}`;
    setSectionOverrides((prev) => ({
      ...prev,
      [sectionKey]: !isCurrentlyOpen,
    }));
  }

  return (
    <nav className="mt-8 space-y-6">
      {sections.map((section) => {
        const sectionOpen = isSectionOpen(section);
        const sectionActive = hasActiveItemInSection(pathname, searchParams, section);

        return (
          <div key={section.title}>
            <button
              type="button"
              onClick={() => handleSectionToggle(section, sectionOpen)}
              className={`mb-2 flex w-full items-center justify-between rounded-lg px-3 py-1 text-left text-xs uppercase tracking-wider transition ${
                sectionActive ? "font-bold text-[#374151]" : "font-semibold text-[#6b7280] hover:font-bold hover:text-[#374151]"
              }`}
              aria-label={sectionOpen ? `Sembunyikan submenu ${section.title}` : `Tampilkan submenu ${section.title}`}
            >
              <span>{section.title}</span>
              <span className="text-sm normal-case">{sectionOpen ? "▾" : "▸"}</span>
            </button>

            {sectionOpen ? (
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItemRow
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    searchParams={searchParams}
                    onItemClick={onItemClick}
                    depth={0}
                    isOpen={isOpenByKey(item.href)}
                    getIsOpen={isOpenByKey}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

