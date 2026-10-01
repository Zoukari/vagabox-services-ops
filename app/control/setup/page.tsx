"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { Alert, Button, Field, Input } from "@/components/ui";
import { callFn, sb } from "@/lib/supabase";

/** Création du tout premier admin (désactivée dès qu'un admin existe — vérifié côté serveur). */
export default function Setup() {
  const router = useRouter();
  const [f, setF] = useState({ nom: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      await callFn("control", "admin-users", { action: "bootstrap_admin", ...f });
      await sb("control").auth.signInWithPassword({ email: f.email, password: f.password });
      router.replace("/control");
    } catch (e: any) { setErr(e.message); setLoading(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <Logo dark sub="Configuration initiale" />
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl bg-white p-6">
          <p className="text-sm text-ink/70">Créez le compte administrateur principal. Cette page ne fonctionne qu&apos;une seule fois.</p>
          <Field label="Nom"><Input required value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Mot de passe" hint="8 caractères minimum"><Input type="password" minLength={8} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          <Alert>{err}</Alert>
          <Button className="w-full" loading={loading}>Créer l&apos;admin</Button>
        </form>
      </div>
    </main>
  );
}
