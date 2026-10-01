"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DossierList from "@/components/DossierList";
import { Button, PageHeader } from "@/components/ui";

function Inner() {
  const p = useSearchParams();
  return <DossierList app="control" basePath="/control/dossiers" initialStatut={p.get("statut") ?? ""} initialCompagnie={p.get("compagnie") ?? ""} />;
}

export default function Dossiers() {
  return (
    <>
      <PageHeader title="Dossiers">
        <Link href="/control/dossiers/nouveau"><Button>+ Nouveau dossier</Button></Link>
      </PageHeader>
      <Suspense><Inner /></Suspense>
    </>
  );
}
