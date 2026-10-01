"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase";
import { Compagnie, Tarif } from "@/lib/types";
import { fdj } from "@/lib/utils";
import { Button, Card, Empty, Loading, Modal, PageHeader } from "@/components/ui";
import CompagnieForm from "@/components/CompagnieForm";

export default function Compagnies() {
  const [rows, setRows] = useState<(Compagnie & { tarification: Tarif[] })[] | null>(null);
  const [modal, setModal] = useState(false);
  const load = useCallback(async () => {
    const { data } = await sb("control").from("compagnies").select("*, tarification(*)").order("nom");
    setRows((data as any) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader title="Compagnies"><Button onClick={() => setModal(true)}>+ Nouvelle compagnie</Button></PageHeader>
      {!rows ? <Loading /> : rows.length === 0 ? <Card><Empty>Aucune compagnie</Empty></Card> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => {
            const t = c.tarification.filter((x) => x.actif);
            return (
              <Link key={c.id} href={`/control/compagnies/${c.id}`}>
                <Card className="h-full p-4 transition hover:border-accent">
                  <div className="flex items-start justify-between">
                    <div className="font-bold">{c.nom}</div>
                    {c.code && <span className="rounded bg-ink px-2 py-0.5 font-mono text-xs font-bold text-white">{c.code}</span>}
                  </div>
                  <div className="mt-1 text-sm text-ink/60">{c.contact_nom ?? "—"} {c.contact_email && `· ${c.contact_email}`}</div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.length === 0 ? <span className="text-xs text-red-600">Aucun tarif actif</span> : t.map((x) => (
                      <span key={x.id} className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent-dark">
                        {x.type === "par_dossier" ? "Par dossier" : "Forfait mensuel"} · {fdj(x.prix_fdj)}
                      </span>
                    ))}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Nouvelle compagnie">
        {modal && <CompagnieForm onSaved={() => { setModal(false); load(); }} />}
      </Modal>
    </>
  );
}
