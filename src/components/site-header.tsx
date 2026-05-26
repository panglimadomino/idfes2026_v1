"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Beranda" },
  { href: "/event", label: "ID Fes 2026" },
  { href: "/berita", label: "Berita" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="bg-black">
        <div className="site-frame flex h-12 items-center justify-between px-4 text-sm text-white sm:px-8">
          <p className="font-medium">help@idfes2026.id</p>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-content-center rounded-full border border-white/70 text-xs">▲</span>
            <span className="grid h-9 w-9 place-content-center rounded-full border border-white/70 text-xs">IG</span>
          </div>
        </div>
      </div>

      <div className="border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="site-frame grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
          <Link href="/" className="w-fit">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-content-center rounded-md border-2 border-black text-xs font-black leading-none">
                ID
                <br />
                FES
              </span>
              <div>
                <p className="font-title text-3xl uppercase leading-none text-black">IDFES 2026</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-black/70">Indonesia Domino Festival</p>
              </div>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="grid h-10 w-10 place-content-center rounded-md border border-black/20 text-black md:hidden"
          >
            <span className="block h-0.5 w-5 bg-black" />
            <span className="mt-1.5 block h-0.5 w-5 bg-black" />
            <span className="mt-1.5 block h-0.5 w-5 bg-black" />
          </button>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
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

          <div className="hidden justify-end md:flex">
            <Link href="/login" className="rounded-sm bg-black px-4 py-2 text-xs font-bold text-white">
              Masuk
            </Link>
          </div>
        </div>

        {open ? (
          <nav className="site-frame border-t border-black/10 px-4 py-3 md:hidden sm:px-8">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
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
