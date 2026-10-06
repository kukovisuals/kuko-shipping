import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { BRAND } from "@/domain/brand";
import { THEME } from "@/ui/theme";
import "./globals.css";

const silkscreen = localFont({
  src: [
    { path: "../public/fonts/silkscreen-latin-400-normal.woff2", weight: "400" },
    { path: "../public/fonts/silkscreen-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-silkscreen",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: [
    { path: "../public/fonts/space-grotesk-latin-400-normal.woff2", weight: "400" },
    { path: "../public/fonts/space-grotesk-latin-500-normal.woff2", weight: "500" },
    { path: "../public/fonts/space-grotesk-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: BRAND.product,
  description: `${BRAND.product} — shipments and stock on a 3D world map. ${BRAND.disclaimer}`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: THEME.background, colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${silkscreen.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh antialiased">
        {children}
        <div
          role="note"
          className="ui-label fixed right-3 bottom-3 z-50 border border-line bg-surface px-2 py-1 text-status-at-risk"
        >
          {BRAND.simulatedTag}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
