"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "vs-theme";
const Ctx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => {} });
export const useTheme = () => useContext(Ctx);

/** Script anti-flash : applique le thème avant le premier rendu. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${KEY}');if(t==='dark')document.documentElement.classList.add('dark');var l=localStorage.getItem('vs-lang');if(l==='ar'){document.documentElement.dir='rtl';document.documentElement.lang='ar'}else if(l==='en'){document.documentElement.lang='en'}}catch(e){}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => { setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light"); }, []);
  const toggle = useCallback(() => {
    setTheme((t) => {
      const n: Theme = t === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", n === "dark");
      try { localStorage.setItem(KEY, n); } catch { /* ignore */ }
      return n;
    });
  }, []);
  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}
