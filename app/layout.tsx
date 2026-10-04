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
              <span className="left-[-10%] top-[-10%] h-[45vw] w-[45vw] animate-blob bg-navy-200" />
              <span className="bottom-[-15%] right-[-10%] h-[40vw] w-[40vw] animate-blob bg-brand-sun/40 [animation-delay:-6s]" />
              <span className="right-[20%] top-[30%] h-[25vw] w-[25vw] animate-blob bg-brand-blue/20 [animation-delay:-12s]" />
            </div>
            {children}
            <FloatingControls />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
