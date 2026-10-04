"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { App, sb } from "./supabase";

export interface Profil { id: string; role: "admin" | "livreur" | "compagnie"; nom: string | null; compagnie_id: string | null; livreur_id: string | null; type_track?: "lecture" | "saisie" }

export const GO_EXPIRY_KEY = "vs-go-expires";

/** Vérifie la session + le rôle attendu ; redirige vers /{app}/login sinon. */
export function useProfil(app: App, role: Profil["role"]) {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);

  useEffect(() => {
    let off = false;
    (async () => {
      const client = sb(app);
      if (app === "go") {
        let exp = 0;
        try { exp = Number(localStorage.getItem(GO_EXPIRY_KEY) ?? 0); } catch { /* ignore */ }
        if (!exp || Date.now() > exp) { await client.auth.signOut(); router.replace("/go/login"); return; }
      }
      const { data: { session } } = await client.auth.getSession();
      if (!session) { router.replace(`/${app}/login`); return; }
      const { data } = await client.from("profiles").select("*").eq("id", session.user.id).single();
      if (off) return;
      if (!data || data.role !== role) { await client.auth.signOut(); router.replace(`/${app}/login?e=role`); return; }
      setProfil(data as Profil);
    })();
    // VS Go : déconnexion automatique à l'expiration des 4h
    const i = app === "go" ? setInterval(() => {
      let exp = 0;
      try { exp = Number(localStorage.getItem(GO_EXPIRY_KEY) ?? 0); } catch { /* ignore */ }
      if (!exp || Date.now() > exp) deconnexion("go");
    }, 60_000) : undefined;
    return () => { off = true; if (i) clearInterval(i); };
  }, [app, role, router]);

  return profil;
}

export async function deconnexion(app: App) {
  await sb(app).auth.signOut();
  if (app === "go") try { localStorage.removeItem(GO_EXPIRY_KEY); } catch { /* ignore */ }
  window.location.href = `/${app}/login`;
}
