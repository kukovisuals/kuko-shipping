import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { LOOK_COOKIE } from "@/config/map";
import { Analytics } from "@vercel/analytics/next";
import { BRAND } from "@/domain/brand";
import { PALETTES, isLook, type Look } from "@/ui/theme";
import "./globals.css";

const inter = localFont({
  src: [
    { path: "../public/fonts/inter-latin-400-normal.woff2", weight: "400" },
    { path: "../public/fonts/inter-latin-500-normal.woff2", weight: "500" },
    { path: "../public/fonts/inter-latin-600-normal.woff2", weight: "600" },
    { path: "../public/fonts/inter-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: BRAND.product,
  description: `${BRAND.product} — shipments and stock on a 3D world map. ${BRAND.disclaimer}`,
  robots: { index: false, follow: false },
};

/** The viewer's look from their cookie; dark by default. */
async function savedLook(): Promise<Look> {
  const value = (await cookies()).get(LOOK_COOKIE)?.value;
  return isLook(value) ? value : "dark";
}

export async function generateViewport(): Promise<Viewport> {
  const look = await savedLook();
  return { themeColor: PALETTES[look].background, colorScheme: look };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme={await savedLook()} className={inter.variable}>
      <body className="min-h-dvh antialiased">
        {children}
        <div
          role="note"
          className="ui-label ui-pill fixed right-3 bottom-3 z-50 px-2.5 py-1 text-status-at-risk"
        >
          {BRAND.simulatedTag}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
