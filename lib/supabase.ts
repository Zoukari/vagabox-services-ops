"use client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type App = "control" | "go" | "track";

const clients: Partial<Record<App, SupabaseClient>> = {};

/** Un client par interface : sessions séparées (admin, livreur, compagnie) dans le même navigateur. */
export function sb(app: App): SupabaseClient {
  if (!clients[app]) {
    clients[app] = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { storageKey: `vs-${app}`, persistSession: true, autoRefreshToken: true },
    });
  }
  return clients[app]!;
}

/** Appel d'une Edge Function avec le jeton de la session courante. */
export async function callFn<T = any>(app: App, fn: string, body: Record<string, unknown>): Promise<T> {
  const { data } = await sb(app).auth.getSession();
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${data.session?.access_token ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);
  return json as T;
}

/** URLs signées (bucket privé). */
export async function signedUrls(app: App, paths: string[]): Promise<Record<string, string>> {
  const uniq = Array.from(new Set(paths.filter(Boolean)));
  if (!uniq.length) return {};
  const { data } = await sb(app).storage.from("photos").createSignedUrls(uniq, 3600);
  const out: Record<string, string> = {};
  data?.forEach((d) => { if (d.signedUrl && d.path) out[d.path] = d.signedUrl; });
  return out;
}

export function errMsg(e: unknown): string {
  if (!e) return "Erreur inconnue";
  if (typeof e === "string") return e;
  const m = (e as any).message ?? String(e);
  if (m.includes("duplicate key") && m.includes("numero_dossier")) return "Ce numéro de dossier existe déjà";
  if (m.includes("violates foreign key")) return "Élément lié à d'autres données — suppression impossible";
  return m;
}
