import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider, THEME_SCRIPT } from "@/lib/theme";
import FloatingControls from "@/components/FloatingControls";

export const metadata: Metadata = {
  title: "Vagabox Services — Opérations",
  description: "Plateforme opérations Vagabox Services : VS Control, VS Go, VS Track",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#0B2A5B", width: "device-width", initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" />
      </head>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <ThemeProvider>
          <I18nProvider>
            <div className="bg-mesh" aria-hidden>
              <span className="left-[-15%] top-[-15%] h-[60vw] w-[60vw] md:animate-blob" style={{ background: "radial-gradient(closest-side, rgb(175 198 234 / .9), transparent)" }} />
              <span className="bottom-[-20%] right-[-15%] h-[55vw] w-[55vw] md:animate-blob md:[animation-delay:-6s]" style={{ background: "radial-gradient(closest-side, rgb(253 191 111 / .35), transparent)" }} />
              <span className="right-[15%] top-[25%] h-[35vw] w-[35vw] md:animate-blob md:[animation-delay:-12s]" style={{ background: "radial-gradient(closest-side, rgb(58 115 184 / .18), transparent)" }} />
            </div>
            {children}
            <FloatingControls />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
