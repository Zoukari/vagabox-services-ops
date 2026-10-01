// VS Go — connexion livreur par PIN 6 chiffres
// Vérifie le PIN (bcrypt), renvoie une session Supabase valable 4h côté app.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const MAX_ECHECS = 8;        // tentatives ratées max
const FENETRE_MIN = 15;      // par fenêtre de 15 min et par IP
const DUREE_SESSION_H = 4;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ip = (req.headers.get("x-forwarded-for") ?? "inconnue").split(",")[0].trim();
  const depuis = new Date(Date.now() - FENETRE_MIN * 60_000).toISOString();
  const { count } = await admin.from("pin_tentatives").select("id", { count: "exact", head: true })
    .eq("ip", ip).eq("succes", false).gte("created_at", depuis);
  if ((count ?? 0) >= MAX_ECHECS) {
    return json({ error: `Trop de tentatives. Réessayez dans ${FENETRE_MIN} minutes.` }, 429);
  }

  let pin = "";
  try { pin = String((await req.json()).pin ?? ""); } catch { /* ignore */ }
  if (!/^\d{6}$/.test(pin)) return json({ error: "Le PIN doit contenir 6 chiffres" }, 400);

  const { data: livreurId, error } = await admin.rpc("verifier_pin", { p_pin: pin });
  if (error) return json({ error: "Erreur serveur" }, 500);

  await admin.from("pin_tentatives").insert({ ip, succes: !!livreurId });
  if (!livreurId) return json({ error: "PIN incorrect" }, 401);

  const { data: livreur } = await admin.from("livreurs")
    .select("id, nom, auth_user_id").eq("id", livreurId).single();
  if (!livreur?.auth_user_id) return json({ error: "Compte livreur incomplet — contactez l'admin" }, 500);

  const { data: u } = await admin.auth.admin.getUserById(livreur.auth_user_id);
  const email = u?.user?.email;
  if (!email) return json({ error: "Compte livreur incomplet — contactez l'admin" }, 500);

  // Lien magique généré côté serveur puis échangé immédiatement → session
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkErr || !link?.properties?.hashed_token) return json({ error: "Erreur de session" }, 500);

  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: s, error: otpErr } = await anon.auth.verifyOtp({
    token_hash: link.properties.hashed_token, type: "magiclink",
  });
  if (otpErr || !s.session) return json({ error: "Erreur de session" }, 500);

  return json({
    session: { access_token: s.session.access_token, refresh_token: s.session.refresh_token },
    livreur: { id: livreur.id, nom: livreur.nom },
    expires_at: Date.now() + DUREE_SESSION_H * 3600_000,
  });
});
