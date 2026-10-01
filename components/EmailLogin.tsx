"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { App, sb } from "@/lib/supabase";
import { Alert, Button, Field, Input } from "./ui";
import Logo from "./Logo";

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
    <main className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <Link href="/"><Logo dark sub={sub} /></Link>
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl bg-white p-6">
          <Field label="Email"><Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Mot de passe"><Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <Alert>{err}</Alert>
          <Button className="w-full" loading={loading}>Se connecter</Button>
        </form>
        {children}
      </div>
    </main>
  );
}
