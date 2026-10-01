"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
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
    <main className="flex min-h-[100dvh] flex-col bg-ink px-6 pb-8 pt-10 text-white">
      <Logo dark sub="VS Go — Livreurs" />
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="mb-6 text-white/70">Entrez votre PIN</p>
        <div className="mb-3 flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={cx("h-4 w-4 rounded-full border-2 transition", i < pin.length ? "border-accent bg-accent" : "border-white/30")} />
          ))}
        </div>
        <div className="h-6 text-sm text-red-400">{loading ? <Spinner className="h-5 w-5 text-accent" /> : err}</div>
        <div className="mt-6 grid w-full max-w-xs grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) =>
            k === "" ? <span key={i} /> : (
              <button key={i} onClick={() => press(k)}
                className="h-16 rounded-2xl bg-white/10 text-2xl font-semibold active:scale-95 active:bg-accent active:text-ink">
                {k}
              </button>
            ))}
        </div>
      </div>
    </main>
  );
}
