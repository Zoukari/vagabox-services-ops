"use client";
import { createContext, useContext } from "react";
import type { Profil } from "./useSession";

export const LivreurCtx = createContext<Profil | null>(null);
export const useLivreur = () => useContext(LivreurCtx)!;
