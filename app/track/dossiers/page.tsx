"use client";
import DossierList from "@/components/DossierList";
import { PageHeader } from "@/components/ui";

export default function Dossiers() {
  return (
    <>
      <PageHeader title="Vos dossiers" sub="Lecture seule — mis à jour en temps réel par Vagabox Services" />
      <DossierList app="track" basePath="/track/dossiers" showCompagnie={false} showLivreur={false} showPrix={false} />
    </>
  );
}
