"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { App, sb, signedUrls } from "@/lib/supabase";
import { STATUTS } from "@/lib/constants";
import { Historique } from "@/lib/types";
import { dateHeure } from "@/lib/utils";
import { Loading } from "./ui";

/** Chronologie colorée complète d'un dossier (+ photos signées). `refresh` force un rechargement. */
export default function StatusTimeline({ app, dossierId, refresh = 0 }: { app: App; dossierId: string; refresh?: number }) {
  const [items, setItems] = useState<Historique[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState<string | null>(null);

  useEffect(() => {
    let off = false;
    (async () => {
      const { data } = await sb(app).from("historique_statuts").select("*")
        .eq("dossier_id", dossierId).order("timestamp", { ascending: true });
      if (off) return;
      setItems((data as Historique[]) ?? []);
      setUrls(await signedUrls(app, (data ?? []).map((h: Historique) => h.photo_url!).filter(Boolean)));
    })();
    return () => { off = true; };
  }, [app, dossierId, refresh]);

  if (!items) return <Loading />;
  return (
    <>
      <ol className="relative ml-2 border-l-2 border-black/10">
        {items.map((h, i) => {
          const s = STATUTS[h.statut];
          const last = i === items.length - 1;
          return (
            <li key={h.id} className="relative mb-5 ml-5 last:mb-0">
              <span className="absolute -left-[29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white"
                style={{ background: s.couleur }}>
                {last && <span className="absolute h-4 w-4 animate-ping rounded-full opacity-40" style={{ background: s.couleur }} />}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold" style={{ color: s.couleur }}>{s.label}</span>
                <span className="text-xs text-ink/50">{dateHeure(h.timestamp)}</span>
              </div>
              {h.commentaire && <p className="mt-0.5 text-sm text-ink/80">{h.commentaire}</p>}
              {h.photo_url && urls[h.photo_url] && (
                <button onClick={() => setZoom(urls[h.photo_url!])} className="mt-2 block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urls[h.photo_url]} alt="Photo" className="h-24 w-24 rounded-lg object-cover ring-1 ring-black/10" />
                </button>
              )}
            </li>
          );
        })}
      </ol>
      {zoom && createPortal(
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-night/80 p-4 backdrop-blur-sm" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="Photo" className="max-h-full max-w-full rounded-lg" />
        </div>,
        document.body,
      )}
    </>
  );
}
