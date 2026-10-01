// VS Control — gestion des comptes (admin uniquement, sauf bootstrap du 1er admin)
// Actions : etat | bootstrap_admin | create_admin | create_livreur | update_livreur_pin
//           | create_compagnie_user | list_compagnie_users | delete_user
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PIN_RE = /^\d{6}$/;

async function adminExiste(db: SupabaseClient) {
  const { count } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return (count ?? 0) > 0;
}

async function creerUser(db: SupabaseClient, email: string, password: string) {
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(error.message.includes("already") ? "Cet email est déjà utilisé" : error.message);
  return data.user!;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = Deno.env.get("SUPABASE_URL")!;
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { /* vide */ }
  const action = body.action as string;

  try {
    // ── Actions publiques ──
    if (action === "etat") return json({ admin_existe: await adminExiste(db) });

    if (action === "bootstrap_admin") {
      if (await adminExiste(db)) return json({ error: "Un admin existe déjà" }, 403);
      const { email, password, nom } = body;
      if (!email || !password || password.length < 8) return json({ error: "Email et mot de passe (8+ caractères) requis" }, 400);
      const u = await creerUser(db, email, password);
      await db.from("profiles").insert({ id: u.id, role: "admin", nom: nom ?? "Admin" });
      return json({ ok: true });
    }

    // ── Actions admin : vérifier l'appelant ──
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: caller } = await db.auth.getUser(jwt);
    if (!caller?.user) return json({ error: "Non authentifié" }, 401);
    const { data: prof } = await db.from("profiles").select("role").eq("id", caller.user.id).single();
    if (prof?.role !== "admin") return json({ error: "Réservé à l'admin" }, 403);

    switch (action) {
      case "create_admin": {
        const { email, password, nom } = body;
        const u = await creerUser(db, email, password);
        await db.from("profiles").insert({ id: u.id, role: "admin", nom });
        return json({ ok: true });
      }

      case "create_livreur": {
        const { nom, telephone, pin, email, password } = body;
        if (!nom) return json({ error: "Nom requis" }, 400);
        if (!PIN_RE.test(pin ?? "")) return json({ error: "PIN : 6 chiffres" }, 400);
        const { data: pris } = await db.rpc("pin_utilise", { p_pin: pin });
        if (pris) return json({ error: "Ce PIN est déjà attribué à un autre livreur" }, 409);

        const { data: hash } = await db.rpc("hasher_pin", { p_pin: pin });
        const { data: liv, error: e1 } = await db.from("livreurs")
          .insert({ nom, telephone: telephone || null, pin: hash }).select("id").single();
        if (e1) throw e1;

        // Compte Auth : email réel si fourni, sinon compte technique
        const authEmail = email || `livreur-${liv.id}@go.vagabox-services.app`;
        const authPass = password || crypto.randomUUID() + crypto.randomUUID();
        try {
          const u = await creerUser(db, authEmail, authPass);
          await db.from("livreurs").update({ auth_user_id: u.id }).eq("id", liv.id);
          await db.from("profiles").insert({ id: u.id, role: "livreur", nom, livreur_id: liv.id });
        } catch (e) {
          await db.from("livreurs").delete().eq("id", liv.id);
          throw e;
        }
        return json({ ok: true, id: liv.id });
      }

      case "update_livreur_pin": {
        const { livreur_id, pin } = body;
        if (!PIN_RE.test(pin ?? "")) return json({ error: "PIN : 6 chiffres" }, 400);
        const { data: pris } = await db.rpc("pin_utilise", { p_pin: pin, p_exclure: livreur_id });
        if (pris) return json({ error: "Ce PIN est déjà attribué à un autre livreur" }, 409);
        const { data: hash } = await db.rpc("hasher_pin", { p_pin: pin });
        const { error } = await db.from("livreurs").update({ pin: hash }).eq("id", livreur_id);
        if (error) throw error;
        return json({ ok: true });
      }

      case "delete_livreur": {
        const { livreur_id } = body;
        const { data: l } = await db.from("livreurs").select("auth_user_id").eq("id", livreur_id).single();
        const { error } = await db.from("livreurs").delete().eq("id", livreur_id);
        if (error) throw new Error("Impossible de supprimer (dossiers liés ?) — désactivez-le plutôt");
        if (l?.auth_user_id) await db.auth.admin.deleteUser(l.auth_user_id);
        return json({ ok: true });
      }

      case "create_compagnie_user": {
        const { compagnie_id, email, password, nom } = body;
        if (!compagnie_id || !email || !password || password.length < 8)
          return json({ error: "Compagnie, email et mot de passe (8+) requis" }, 400);
        const u = await creerUser(db, email, password);
        await db.from("profiles").insert({ id: u.id, role: "compagnie", nom, compagnie_id });
        return json({ ok: true });
      }

      case "list_compagnie_users": {
        const { data: profs } = await db.from("profiles").select("id, nom, compagnie_id")
          .eq("role", "compagnie").eq("compagnie_id", body.compagnie_id);
        const out = [];
        for (const p of profs ?? []) {
          const { data } = await db.auth.admin.getUserById(p.id);
          out.push({ ...p, email: data?.user?.email });
        }
        return json({ users: out });
      }

      case "reset_password": {
        const { user_id, password } = body;
        if (!password || password.length < 8) return json({ error: "Mot de passe 8+ caractères" }, 400);
        const { error } = await db.auth.admin.updateUserById(user_id, { password });
        if (error) throw error;
        return json({ ok: true });
      }

      case "delete_user": {
        const { error } = await db.auth.admin.deleteUser(body.user_id);
        if (error) throw error;
        return json({ ok: true });
      }

      default:
        return json({ error: "Action inconnue" }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message ?? "Erreur" }, 400);
  }
});
