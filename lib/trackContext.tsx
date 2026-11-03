"use client";
import { createContext, useContext } from "react";
import type { Profil } from "./useSession";

export const TrackCtx = createContext<Profil | null>(null);
/** Profil de l'agent VE Track connecté (type_track = lecture | saisie) */
export const useTrackProfil = () => useContext(TrackCtx)!;
export const estSaisie = (p?: Profil | null) => p?.type_track === "saisie";
