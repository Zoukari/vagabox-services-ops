"use client";
import { Suspense } from "react";
import EmailLogin from "@/components/EmailLogin";

export default function Page() {
  return <Suspense><EmailLogin app="track" sub="VS Track — Compagnies" role="compagnie" /></Suspense>;
}
