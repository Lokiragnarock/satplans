import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ballin on Sats",
  description: "A shared grind game for a small friend group",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#111317" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;500;700&family=Material+Symbols+Outlined:wght,FILL@400..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-dvh bg-surface font-sans text-on-surface antialiased">{children}</body>
    </html>
  );
}
