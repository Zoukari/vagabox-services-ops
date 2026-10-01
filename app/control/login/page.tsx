"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import EmailLogin from "@/components/EmailLogin";
import { callFn } from "@/lib/supabase";

function Inner() {
  const [premier, setPremier] = useState(false);
  useEffect(() => { callFn("control", "admin-users", { action: "etat" }).then((r) => setPremier(!r.admin_existe)).catch(() => {}); }, []);
  return (
    <EmailLogin app="control" sub="VS Control" role="admin">
      {premier && (
        <Link href="/control/setup" className="mt-4 block rounded-xl bg-accent p-3 text-center text-sm font-semibold text-ink">
          Première utilisation : créer le compte administrateur →
        </Link>
      )}
    </EmailLogin>
  );
}
export default function Page() { return <Suspense><Inner /></Suspense>; }
