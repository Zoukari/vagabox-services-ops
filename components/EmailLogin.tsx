"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { App, sb } from "@/lib/supabase";
import { Alert, Button, Field, Input } from "./ui";
import AuthShell from "./AuthShell";

export default function EmailLogin({ app, sub, role, children }: { app: App; sub: string; role: "admin" | "compagnie"; children?: React.ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(params.get("e") === "role" ? "Ce compte n'a pas accès à cette interface." : "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr("");
    const { data, error } = await sb(app).auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setErr("Email ou mot de passe incorrect"); setLoading(false); return; }
    const { data: p } = await sb(app).from("profiles").select("role").eq("id", data.user.id).single();
    if (p?.role !== role) {
      await sb(app).auth.signOut();
      setErr("Ce compte n'a pas accès à cette interface."); setLoading(false); return;
    }
    router.replace(`/${app}`);
  }

  return (
    <AuthShell app={app === "track" ? "track" : "control"} titre={sub} sousTitre="Connectez-vous pour continuer" footer={children}>
      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-black/[0.07] bg-white p-6 shadow-lift">
        <Field label="Email"><Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Mot de passe"><Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Alert>{err}</Alert>
        <Button className="w-full" size="lg" loading={loading}>Se connecter</Button>
      </form>
    </AuthShell>
  );
}
