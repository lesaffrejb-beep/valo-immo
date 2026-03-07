"use client";

import { useState, useTransition } from "react";
import { Building2, Loader2, Info } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import dynamic from "next/dynamic";
import type { BanResult, EstimationResult } from "@/lib/types";

const ResultPanel = dynamic(() => import("@/components/ResultPanel"), {
  loading: () => <div className="p-12 text-center text-[var(--muted-foreground)] flex items-center justify-center gap-2"><Loader2 className="animate-spin h-5 w-5" /> Initialisation de l&apos;environnement d&apos;expertise...</div>,
});

const FAQ = dynamic(() => import("@/components/FAQ"));

type AppState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: EstimationResult }
  | { status: "error"; message: string };

export default function Home() {
  const [state, setState] = useState<AppState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const handleSelect = (ban: BanResult) => {
    startTransition(async () => {
      setState({ status: "loading" });
      try {
        const res = await fetch(
          `/api/estimate?adresse=${encodeURIComponent(ban.label)}`
        );
        const json = await res.json();
        if (!json.success) {
          setState({ status: "error", message: json.error || "Erreur inconnue." });
        } else {
          setState({ status: "done", result: json.data });
        }
      } catch {
        setState({
          status: "error",
          message: "Impossible de contacter le serveur. Vérifiez votre connexion.",
        });
      }
    });
  };

  const isLoading = state.status === "loading" || isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* ─── Header ─── */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50 transition-all duration-500">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group">
              <Building2 className="h-5 w-5 text-primary-foreground group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl tracking-tight text-foreground leading-none">
                TrueSquare
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brass mt-1 opacity-80">
                Haute Expertise
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="flex-1 flex flex-col">
        {/* Hero / Search section */}
        <section
          className={`transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${state.status === "idle"
            ? "py-40 lg:py-52"
            : "py-16 lg:py-20"
            }`}
        >
          <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
            {state.status === "idle" && (
              <div className="animate-fade-in-up space-y-8">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-foreground tracking-tight leading-[1.05]">
                  La vérité du prix, <br className="hidden sm:block" />
                  <span className="italic text-primary">enfin certifiée.</span>
                </h1>
                <p className="max-w-2xl mx-auto text-muted-foreground text-xl leading-relaxed mb-12 font-medium opacity-80">
                  Croisement algorithmique haute fidélité entre transactions notariales (DVF) et surfaces habitables vérifiées (DPE).
                </p>
              </div>
            )}

            <div className={`w-full ${state.status !== "idle" ? "max-w-5xl" : "max-w-3xl"} transition-all duration-700`}>
              <SearchBar onSelect={handleSelect} isLoading={isLoading} />
            </div>

            {state.status === "idle" && (
              <div className="mt-10 flex flex-col items-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Adresses types</p>
                <div className="flex flex-wrap justify-center items-center gap-3">
                  <ExampleBtn
                    label="15 rue de la Paix, Paris"
                    onSelect={handleSelect}
                  />
                  <ExampleBtn
                    label="12 cours Mirabeau, Aix"
                    onSelect={handleSelect}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── Loading skeleton ─── */}
        {isLoading && (
          <div className="max-w-5xl mx-auto px-6 w-full space-y-10 pb-32 animate-fade-in-up">
            {/* Simulation de la carte Synthese */}
            <div className="relative rounded-[1.75rem] border border-border bg-card p-10 space-y-10 shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
              <div className="space-y-4">
                <div className="h-10 w-2/3 bg-muted animate-pulse rounded-lg" />
                <div className="h-4 w-1/4 bg-muted animate-pulse rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="h-32 bg-secondary/50 animate-pulse rounded-2xl" />
                <div className="h-32 bg-primary/5 animate-pulse rounded-2xl" />
              </div>
            </div>
          </div>
        )}

        {/* ─── Error ─── */}
        {state.status === "error" && (
          <div className="max-w-5xl mx-auto px-6 w-full pb-32 animate-fade-in-up">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-8 py-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto text-destructive">
                <Info className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-serif text-foreground">Avis de Valeur Impossible</p>
                <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto">{state.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Results ─── */}
        {state.status === "done" && (
          <div className="px-6 pb-32 w-full animate-fade-in-up">
            <div className="max-w-5xl mx-auto">
              <ResultPanel result={state.result} />
            </div>
          </div>
        )}

        {/* ─── FAQ ─── */}
        <section className="py-32 border-t border-border bg-secondary/20 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16 space-y-4">
              <h3 className="text-3xl font-serif text-foreground tracking-tight">Rigueur & Transparence Algorithmique</h3>
              <p className="text-muted-foreground max-w-xl mx-auto font-medium opacity-70">
                L&apos;intégralité de notre méthodologie d&apos;extraction et de fiabilisation des données DVF.
              </p>
            </div>
            <FAQ />
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-card py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-brass" />
              <span className="font-serif text-xl tracking-tight text-foreground">TrueSquare</span>
            </div>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed max-w-md">
              TrueSquare est une plateforme indépendante d&apos;expertise foncière. Nous utilisons l&apos;intelligence artificielle pour redresser les biais de surface et fournir une valeur exacte au m².
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Sources Institutionnelles</p>
            <div className="flex gap-8">
              <a href="#" className="text-xs font-bold text-foreground hover:text-primary transition-colors">DVF (DGFiP)</a>
              <a href="#" className="text-xs font-bold text-foreground hover:text-primary transition-colors">DPE (ADEME)</a>
              <a href="#" className="text-xs font-bold text-foreground hover:text-primary transition-colors">Etalab 2.0</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Quick-fill Example Button ─── */
function ExampleBtn({
  label,
  onSelect,
}: {
  label: string;
  onSelect: (b: BanResult) => void;
}) {
  const handleClick = async () => {
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(label)}&limit=1`);
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        onSelect(json.data[0]);
      }
    } catch {
      // silent
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-[11px] font-bold text-primary hover:text-primary-foreground border border-primary/20 hover:bg-primary px-4 py-2 rounded-full transition-all duration-300 uppercase tracking-wider bg-primary/5"
    >
      {label}
    </button>
  );
}
