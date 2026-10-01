import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vagabox Services — Opérations",
  description: "Plateforme opérations Vagabox Services : VS Control, VS Go, VS Track",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#0E1A2B", width: "device-width", initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
