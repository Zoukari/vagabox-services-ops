"use client";
import DossierList from "@/components/DossierList";
import { PageHeader } from "@/components/ui";
import { estSaisie, useTrackProfil } from "@/lib/trackContext";

export default function Dossiers() {
  const profil = useTrackProfil();
  const saisie = estSaisie(profil);
  return (
    <>
      <PageHeader title={saisie ? "Bagages déclarés" : "Vos dossiers"}
        sub={saisie ? "Dossiers que vous avez saisis — statut mis à jour en temps réel par Vagabox Services" : "Lecture seule — mis à jour en temps réel par Vagabox Services"} />
      <DossierList app="track" basePath="/track/dossiers" showCompagnie={saisie} showLivreur={false} showPrix={false} />
    </>
  );
}
