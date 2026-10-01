"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { errMsg, sb } from "@/lib/supabase";
import { Client } from "@/lib/types";
import { dateCourte, nomComplet } from "@/lib/utils";
import { Button, Card, Empty, Input, Loading, Modal, PageHeader } from "@/components/ui";
import ClientForm from "@/components/ClientForm";

export default function Clients() {
  const [rows, setRows] = useState<Client[] | null>(null);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Partial<Client> | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb("control").from("clients").select("*").order("created_at", { ascending: false }).limit(1000);
    setRows(data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtres = useMemo(() => {
    const s = q.trim().toLowerCase();
    return !rows ? null : !s ? rows : rows.filter((c) => [c.nom, c.prenom, c.telephone, c.quartier].some((v) => v?.toLowerCase().includes(s)));
  }, [rows, q]);

  async function supprimer(c: Client) {
    if (!confirm(`Supprimer ${nomComplet(c.nom, c.prenom)} ?`)) return;
    const { error } = await sb("control").from("clients").delete().eq("id", c.id);
    if (error) return alert(errMsg(error));
    load();
  }

  return (
    <>
      <PageHeader title="Clients" sub={rows ? `${rows.length} clients` : undefined}>
        <Button onClick={() => setEdit({})}>+ Nouveau client</Button>
      </PageHeader>
      <Input placeholder="Rechercher nom, téléphone, quartier…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-md" />
      <Card className="overflow-x-auto">
        {!filtres ? <Loading /> : filtres.length === 0 ? <Empty>Aucun client</Empty> : (
          <table className="tbl">
            <thead><tr><th>Nom</th><th>Téléphone</th><th>Quartier</th><th>Adresse</th><th>Créé</th><th /></tr></thead>
            <tbody>
              {filtres.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold">{nomComplet(c.nom, c.prenom)}</td>
                  <td className="whitespace-nowrap">{c.telephone}</td>
                  <td>{c.quartier ?? "—"}</td>
                  <td className="max-w-xs truncate text-ink/60">{c.adresse_detail}</td>
                  <td className="whitespace-nowrap text-xs text-ink/60">{dateCourte(c.created_at)}</td>
                  <td className="whitespace-nowrap text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEdit(c)}>Modifier</Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => supprimer(c)}>Suppr.</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Modifier le client" : "Nouveau client"}>
        {edit && <ClientForm initial={edit} onSaved={() => { setEdit(null); load(); }} onCancel={() => setEdit(null)} />}
      </Modal>
    </>
  );
}
