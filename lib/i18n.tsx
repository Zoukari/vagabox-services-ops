"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DICT, PATTERNS, traduireMois } from "./i18n-dict";

export type Lang = "fr" | "en" | "ar";
export const LANGS: { code: Lang; label: string; court: string }[] = [
  { code: "fr", label: "Français", court: "FR" },
  { code: "en", label: "English", court: "EN" },
  { code: "ar", label: "العربية", court: "ع" },
];
const KEY = "vs-lang";

/* ───────────────────────── Moteur de traduction ─────────────────────────
 * Traduit le texte visible du DOM (FR → EN/AR) à partir du dictionnaire,
 * sans toucher aux composants. Le texte français d'origine est mémorisé par nœud,
 * donc changer de langue (ou revenir au FR) est instantané et réversible.
 * Les saisies utilisateur (input/textarea) et [data-no-i18n] ne sont jamais traduites. */

let courant: Lang = "fr";
const ORIG = new WeakMap<Text, string>();
const ECRIT = new WeakMap<Text, string>();
const ATTRS = ["placeholder", "title", "aria-label"] as const;
const ATTR_ORIG = new WeakMap<Element, Record<string, { o: string; w: string }>>();
const SAUTER = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT", "CODE"]);
const CORE = /^([^\p{L}\p{N}]*?)(\p{L}[\s\S]*?)([\s:*…]*)$/u;

function chercher(k: string, l: "en" | "ar"): string | null {
  const d = DICT[k];
  if (d) return d[l === "en" ? 0 : 1];
  for (const [re, f] of PATTERNS) { const m = k.match(re); if (m) return f(m, l); }
  return null;
}

/** Traduit une chaîne FR vers la langue courante (null si inconnue). */
export function traduire(s: string, l: Lang = courant): string | null {
  if (l === "fr" || !s) return null;
  const brut = s.replace(/\s+/g, " ").trim();
  if (!brut || !/\p{L}/u.test(brut)) return null;
  let t = chercher(brut, l);
  if (t == null) {
    const m = brut.match(CORE);
    if (m) {
      const c = chercher(m[2].trim(), l);
      if (c != null) t = m[1] + c + m[3];
    }
  }
  const avecMois = traduireMois(t ?? brut, l);
  if (t == null && avecMois === brut) return null;
  t = avecMois;
  const debut = s.match(/^\s*/)![0], fin = s.match(/\s*$/)![0];
  return debut + t + fin;
}

function ignore(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    if (SAUTER.has(e.tagName) || e.hasAttribute("data-no-i18n") || (e as HTMLElement).isContentEditable) return true;
  }
  return false;
}

function appliquerTexte(n: Text) {
  const o = ORIG.get(n);
  if (o == null) return;
  const out = courant === "fr" ? o : traduire(o) ?? o;
  ECRIT.set(n, out);
  if (n.nodeValue !== out) n.nodeValue = out;
}
function texte(n: Text, force = false) {
  const v = n.nodeValue ?? "";
  if (ECRIT.get(n) === v) { if (force) appliquerTexte(n); return; } // notre propre écriture
  if (!v.trim() || ignore(n.parentElement)) return;
  ORIG.set(n, v);
  appliquerTexte(n);
}
function attributs(el: Element) {
  // les champs (textarea…) gardent leur saisie, mais leur placeholder est traduit
  if (el.hasAttribute("data-no-i18n") || ignore(el.parentElement)) return;
  let rec = ATTR_ORIG.get(el);
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v == null) continue;
    rec ??= {};
    const r = rec[a];
    if (!r || r.w !== v) rec[a] = { o: v, w: v };
    const out = courant === "fr" ? rec[a].o : traduire(rec[a].o) ?? rec[a].o;
    rec[a].w = out;
    if (v !== out) el.setAttribute(a, out);
  }
  if (rec) ATTR_ORIG.set(el, rec);
}
function parcourir(root: Node, force = false) {
  if (root.nodeType === 3) return texte(root as Text, force);
  if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
  if (root.nodeType === 1) attributs(root as Element);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (n.nodeType === 3) texte(n as Text, force); else attributs(n as Element);
  }
}

let obs: MutationObserver | null = null;
function demarrer() {
  if (obs || typeof window === "undefined") return;
  obs = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") texte(m.target as Text);
      else if (m.type === "attributes") attributs(m.target as Element);
      else m.addedNodes.forEach((n) => parcourir(n));
    }
  });
  obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
  // alert / confirm / prompt traduits aussi
  const w = window as any;
  if (!w.__vsDialogs) {
    w.__vsDialogs = true;
    const a = window.alert.bind(window), c = window.confirm.bind(window), p = window.prompt.bind(window);
    window.alert = (msg?: any) => a(typeof msg === "string" ? traduire(msg) ?? msg : msg);
    window.confirm = (msg?: string) => c(msg ? traduire(msg) ?? msg : msg);
    window.prompt = (msg?: string, d?: string) => p(msg ? traduire(msg) ?? msg : msg, d);
  }
}
function changer(l: Lang) {
  courant = l;
  const html = document.documentElement;
  html.lang = l;
  html.dir = l === "ar" ? "rtl" : "ltr";
  parcourir(document.body, true);
}

/* ───────────────────────── Contexte React ───────────────────────── */
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "fr", setLang: () => {} });
export const useLang = () => useContext(Ctx);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setL] = useState<Lang>("fr");
  useEffect(() => {
    let l: Lang = "fr";
    try { const s = localStorage.getItem(KEY) as Lang | null; if (s && LANGS.some((x) => x.code === s)) l = s; } catch { /* ignore */ }
    demarrer();
    changer(l);
    setL(l);
  }, []);
  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
    changer(l); setL(l);
  }, []);
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}
