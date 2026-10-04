import type { Config } from "tailwindcss";

/** Couleurs pilotées par variables CSS → thème clair / sombre (classe .dark sur <html>).
 *  white = surface (cartes), black = contraste (bordures, voiles), ink = texte, paper = fond de page.
 *  snow / night = blanc / noir fixes (texte sur fond bleu foncé, voiles de modale). */
const v = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: v("surface"),
        black: v("contrast"),
        paper: v("paper"),
        ink: { DEFAULT: v("ink"), 2: v("ink-2"), 3: v("ink-3") },
        accent: { DEFAULT: v("accent"), dark: v("accent-dark") },
        snow: "#ffffff",
        night: "#000000",
        navy: {
          50: "#EEF3FB", 100: "#D7E3F5", 200: "#AFC6EA", 300: "#7FA2DA", 400: "#4C78C3",
          500: "#2A58A8", 600: "#1B428A", 700: "#123370", DEFAULT: "#0B2A5B", 800: "#0B2A5B", 900: "#071D41", 950: "#04112A",
        },
        brand: { blue: "#3A73B8", sun: "#FDBF6F" },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'IBM Plex Sans Arabic'", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["'Sora'", "'IBM Plex Sans Arabic'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--c-contrast) / 0.04), 0 8px 24px -12px rgb(var(--c-contrast) / 0.12)",
        lift: "0 2px 4px rgb(var(--c-contrast) / 0.04), 0 20px 40px -16px rgb(11 42 91 / 0.35)",
        glow: "0 0 0 4px rgb(var(--c-accent) / 0.15)",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "none" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": { from: { opacity: "0", transform: "scale(.94)" }, to: { opacity: "1", transform: "none" } },
        "slide-up": { from: { transform: "translateY(100%)" }, to: { transform: "none" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        blob: { "0%,100%": { transform: "translate(0,0) scale(1)" }, "33%": { transform: "translate(30px,-40px) scale(1.08)" }, "66%": { transform: "translate(-25px,20px) scale(.95)" } },
        shine: { from: { transform: "translateX(-120%) skewX(-20deg)" }, to: { transform: "translateX(220%) skewX(-20deg)" } },
        "splash-logo": {
          "0%": { opacity: "0", transform: "translateY(120px)" },
          "30%": { opacity: "1", transform: "translateY(-8px)" },
          "40%": { transform: "translateY(0)" },
          "85%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-30px)" },
        },
        "splash-bar": { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
        "pulse-ring": { "0%": { transform: "scale(.9)", opacity: ".7" }, "100%": { transform: "scale(1.6)", opacity: "0" } },
      },
      animation: {
        "fade-up": "fade-up .5s cubic-bezier(.2,.8,.2,1) backwards",
        "fade-in": "fade-in .4s ease both",
        "scale-in": "scale-in .35s cubic-bezier(.2,.8,.2,1) backwards",
        "slide-up": "slide-up .35s cubic-bezier(.2,.8,.2,1) backwards",
        float: "float 4s ease-in-out infinite",
        blob: "blob 18s ease-in-out infinite",
        "splash-logo": "splash-logo 3s cubic-bezier(.2,.8,.2,1) both",
        "splash-bar": "splash-bar 2.8s cubic-bezier(.4,0,.2,1) both",
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(.2,.8,.2,1) infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
