"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { Spinner } from "@/components/ui";
import { FN_URL } from "@/lib/constants";
import { sb } from "@/lib/supabase";
import { GO_EXPIRY_KEY } from "@/lib/useSession";
import { cx } from "@/lib/utils";

export default function GoLogin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pin.length !== 6) return;
    (async () => {
      setLoading(true); setErr("");
      try {
        const res = await fetch(`${FN_URL}/livreur-auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
          body: JSON.stringify({ pin }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "Erreur");
        const { error } = await sb("go").auth.setSession(j.session);
        if (error) throw error;
        try { localStorage.setItem(GO_EXPIRY_KEY, String(j.expires_at)); } catch { /* ignore */ }
        navigator.vibrate?.(50);
        router.replace("/go");
      } catch (e: any) {
        setErr(e.message); setPin(""); navigator.vibrate?.([100, 50, 100]);
      } finally { setLoading(false); }
    })();
  }, [pin, router]);

  const press = (k: string) => {
    if (loading) return;
    if (k === "⌫") setPin((p) => p.slice(0, -1));
    else if (pin.length < 6) setPin((p) => p + k);
  };

  return (
    <AuthShell app="go" titre="Espace livreurs" sousTitre="Entrez votre PIN">
      <div className="rounded-3xl border border-black/[0.07] bg-white p-6 shadow-lift">
        <div dir="ltr" className={cx("flex justify-center gap-3", err && "animate-[shake_.4s]")}>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={cx("h-4 w-4 rounded-full border-2 transition-all duration-200",
              i < pin.length ? "scale-110 border-navy bg-navy dark:border-navy-300 dark:bg-navy-300" : "border-black/20")} />
          ))}
        </div>
        <div className="mt-3 flex h-6 items-center justify-center text-sm font-medium text-red-600">{loading ? <Spinner className="h-5 w-5 text-accent" /> : err}</div>
        <div dir="ltr" className="mt-4 grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) =>
            k === "" ? <span key={i} /> : (
              <button key={i} onClick={() => press(k)} data-no-i18n
                className={cx("h-16 rounded-2xl text-2xl font-bold transition-all duration-150 active:scale-90",
                  k === "⌫" ? "text-ink/50 hover:bg-black/5" : "bg-black/[0.04] text-ink hover:bg-navy-50 active:bg-navy active:text-snow dark:hover:bg-white/10")}>
                {k}
              </button>
            ))}
        </div>
      </div>
    </AuthShell>
  );
}
