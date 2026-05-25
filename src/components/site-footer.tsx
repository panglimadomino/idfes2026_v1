import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line-soft)] bg-[var(--surface-card)]">
      <div className="site-frame flex flex-col gap-3 px-4 py-6 text-sm text-[var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 IDFES. Indonesia Domino Festival.</p>
        <div className="flex items-center gap-4">
          <Link href="/events" className="hover:text-[var(--ink-strong)]">
            Arsip Event
          </Link>
          <Link href="/peraturan" className="hover:text-[var(--ink-strong)]">
            Dokumen
          </Link>
        </div>
      </div>
    </footer>
  );
}
