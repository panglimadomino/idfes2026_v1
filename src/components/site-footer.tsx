import Image from "next/image";
import Link from "next/link";

type SiteFooterProps = {
  logoUrl?: string | null;
  logoAlt?: string | null;
};

export function SiteFooter({ logoUrl, logoAlt }: SiteFooterProps) {
  return (
    <footer className="border-t border-[var(--line-soft)] bg-[var(--surface-card)]">
      <div className="site-frame flex flex-col gap-3 px-4 py-6 text-sm text-[var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={logoAlt ?? "IDFES 2026 Logo"}
              width={120}
              height={30}
              className="h-8 w-auto object-contain"
            />
          ) : null}
          <p>© 2026 IDFES. Indonesia Domino Festival.</p>
        </div>
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
