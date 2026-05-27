"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const mainNavItems = [
  { href: "/berita", label: "Berita" },
];

type SiteHeaderProps = {
  headerLogoUrl?: string | null;
  eventMenuItems?: { href: string; label: string }[];
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function SiteHeader({ headerLogoUrl, eventMenuItems = [] }: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="site-frame flex min-h-16 items-center gap-4 px-4 py-2 sm:px-8">
          <Link href="/" className="w-fit">
            <div className="flex items-center">
              {headerLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={headerLogoUrl} alt="IDFES logo" className="h-12 w-auto object-contain sm:h-14 md:h-16" />
              ) : (
                <span className="grid h-12 w-12 place-content-center rounded-md border-2 border-black text-xs font-black leading-none sm:h-14 sm:w-14 md:h-16 md:w-16">
                  ID
                  <br />
                  FES
                </span>
              )}
            </div>
          </Link>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="ml-auto grid h-10 w-10 place-content-center rounded-md border border-black/20 text-black md:hidden"
          >
            <span className="block h-0.5 w-5 bg-black" />
            <span className="mt-1.5 block h-0.5 w-5 bg-black" />
            <span className="mt-1.5 block h-0.5 w-5 bg-black" />
          </button>

          <div className="ml-auto hidden items-center justify-end gap-3 md:flex">
            <nav className="flex items-center justify-end gap-2">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive(pathname, "/") ? "text-black" : "text-black/70 hover:text-black"
                }`}
              >
                Beranda
              </Link>

              <div className="group relative">
                <Link
                  href="/#id-fes-2026"
                  onClick={() => setOpen(false)}
                  className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    pathname === "/" || isActive(pathname, "/event") || isActive(pathname, "/events")
                      ? "text-black"
                      : "text-black/70 hover:text-black"
                  }`}
                >
                  ID Fes 2026
                  <span className="text-[10px]">▼</span>
                </Link>

                {eventMenuItems.length > 0 ? (
                  <div className="invisible absolute right-0 top-full z-20 mt-1 min-w-[220px] rounded-xl border border-black/10 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    {eventMenuItems.map((item, index) => (
                      <Link
                        key={`${item.href}-${index}`}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold text-black/80 hover:bg-black/5 hover:text-black"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              {mainNavItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active ? "text-black" : "text-black/70 hover:text-black"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Link href="/login" className="rounded-sm bg-black px-4 py-2 text-xs font-bold text-white">
              Masuk
            </Link>
          </div>
        </div>

        {open ? (
          <nav className="site-frame border-t border-black/10 px-4 py-3 md:hidden sm:px-8">
            <div className="flex flex-col gap-1">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive(pathname, "/") ? "bg-black text-white" : "text-black/75 hover:bg-black/5 hover:text-black"
                }`}
              >
                Beranda
              </Link>

              <Link
                href="/#id-fes-2026"
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  pathname === "/" || isActive(pathname, "/event") || isActive(pathname, "/events")
                    ? "bg-black text-white"
                    : "text-black/75 hover:bg-black/5 hover:text-black"
                }`}
              >
                ID Fes 2026
              </Link>

              {eventMenuItems.length > 0 ? (
                <div className="ml-4 border-l border-black/10 pl-2">
                  {eventMenuItems.map((item, index) => (
                    <Link
                      key={`${item.href}-mobile-${index}`}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm font-semibold text-black/75 hover:bg-black/5 hover:text-black"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}

              {mainNavItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-md px-3 py-2 text-sm font-semibold ${
                      active ? "bg-black text-white" : "text-black/75 hover:bg-black/5 hover:text-black"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-2 w-fit rounded-sm bg-black px-4 py-2 text-xs font-bold text-white"
              >
                Masuk
              </Link>
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
