"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { AppLogo } from "./Logo";

/** Mise en page des écrans de connexion : panneau bleu foncé animé + carte formulaire. */
export default function AuthShell({ app, titre, sousTitre, children, footer }: {
  app: "control" | "go" | "track"; titre: string; sousTitre?: string; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-navy-700 via-navy to-navy-950 lg:flex lg:flex-col lg:items-center lg:justify-center">
        <span className="absolute -left-24 -top-24 h-96 w-96 animate-blob rounded-full bg-brand-blue/30 blur-3xl" />
        <span className="absolute -bottom-32 -right-20 h-[28rem] w-[28rem] animate-blob rounded-full bg-brand-sun/20 blur-3xl [animation-delay:-8s]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
        <Link href="/" className="relative flex h-80 w-80 animate-scale-in items-center justify-center rounded-full bg-snow/95 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)] ring-8 ring-snow/10">
          <AppLogo app={app} className="h-auto w-64 animate-float drop-shadow-none" />
        </Link>
        <p className="relative mt-10 max-w-sm animate-fade-up text-center text-lg font-medium text-snow/80 [animation-delay:.2s]">
          Livraison à domicile des bagages récupérés en compagnie — Djibouti.
        </p>
      </aside>

      <section className="flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 block lg:hidden">
            <AppLogo app={app} className="mx-auto h-36 w-auto animate-scale-in" />
          </Link>
          <div className="animate-fade-up">
            <h1 className="font-display text-3xl font-extrabold">{titre}</h1>
            {sousTitre && <p className="mt-1.5 text-ink/55">{sousTitre}</p>}
          </div>
          <div className="mt-7 animate-fade-up [animation-delay:.08s]">{children}</div>
          {footer && <div className="mt-6 animate-fade-up [animation-delay:.16s]">{footer}</div>}
        </div>
      </section>
    </main>
  );
}
