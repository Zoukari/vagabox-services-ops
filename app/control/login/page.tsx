"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import EmailLogin from "@/components/EmailLogin";
import { callFn } from "@/lib/supabase";
import { cx } from "@/lib/utils";

function Inner() {
  // null = vérification en cours / impossible → le lien reste visible (discret)
  const [premier, setPremier] = useState<boolean | null>(null);
  useEffect(() => { callFn("control", "admin-users", { action: "etat" }).then((r) => setPremier(!r.admin_existe)).catch(() => setPremier(null)); }, []);
  return (
    <EmailLogin app="control" sub="Espace administrateur" role="admin">
      {premier !== false && (
        <Link href="/control/setup"
          className={cx("group flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm font-semibold transition hover:-translate-y-0.5",
            premier ? "border-transparent bg-gradient-to-r from-navy-600 to-navy-900 text-snow shadow-lift" : "border-dashed border-black/15 text-ink/70 hover:border-accent hover:text-accent")}>
          <span>Première utilisation ? Créer le compte administrateur</span>
          <span className="transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1">→</span>
        </Link>
      )}
    </EmailLogin>
  );
}
export default function Page() { return <Suspense><Inner /></Suspense>; }
