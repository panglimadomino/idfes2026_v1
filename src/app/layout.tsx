import type { Metadata } from "next";
import { Barlow, Teko } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IDFES 2026",
  description:
    "Indonesia Domino Festival 2026 - roadshow multi event dengan multi kategori pertandingan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${barlow.variable} ${teko.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--surface-base)] text-[var(--ink-strong)]">
        <SiteHeader />
        <main className="w-full flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
