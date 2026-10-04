"use client";
import { Suspense } from "react";
import EmailLogin from "@/components/EmailLogin";

export default function Page() {
  return <Suspense><EmailLogin app="track" sub="Espace compagnies & aéroport" role="compagnie" /></Suspense>;
}
