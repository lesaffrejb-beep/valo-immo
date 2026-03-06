"use client";

import { useState, useTransition } from "react";
import { Building2, ChevronRight, Github, Loader2 } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import dynamic from "next/dynamic";
import type { BanResult, EstimationResult } from "@/lib/types";

const ResultPanel = dynamic(() => import("@/components/ResultPanel"), {
  loading: () => <div className="p-12 text-center text-[var(--muted-foreground)] flex items-center justify-center gap-2"><Loader2 className="animate-spin h-5 w-5" /> Chargement du module...</div>,
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
    <div className="min-h-screen bg-[var(--background)] flex flex-col selection:bg-[var(--primary)]/20 selection:text-[var(--primary)]">
      {/* ─── Header ─── */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center shadow-sm">
              <Building2 className="h-4 w-4 text-[var(--primary-foreground)]" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[var(--foreground)]">
              TrueSquare
            </span>
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-px h-4 bg-[var(--border)] mx-1" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                Expertise Foncière
              </span>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors p-2 rounded-md hover:bg-[var(--muted)]"
            aria-label="Github"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="flex-1 flex flex-col">
        {/* Hero / Search section */}
        <section
          className={`transition-all duration-700 ease-out ${state.status === "idle"
            ? "py-32"
            : "py-12"
            }`}
        >
          <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
            {state.status === "idle" && (
              <div className="animate-fade-in-up">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-4 py-1.5 mb-8 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                    DVF × DPE · Données Réelles
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--foreground)] tracking-tight mb-6 leading-[1.15]">
                  La valeur vénale exacte, <br className="hidden sm:block" />
                  <span className="text-[var(--primary)]">sans surfaces fantômes.</span>
                </h1>
                <p className="max-w-2xl mx-auto text-[var(--muted-foreground)] text-lg sm:text-xl leading-relaxed mb-12 font-medium">
                  Une estimation robuste basée sur le croisement algorithmique officiel des transactions immobilières (DVF) et des surfaces habitables (DPE).
                </p>
              </div>
            )}

            <div className={`w-full ${state.status !== "idle" ? "max-w-4xl" : "max-w-2xl"} transition-all duration-500`}>
              <SearchBar onSelect={handleSelect} isLoading={isLoading} />
            </div>

            {state.status === "idle" && (
              <p className="mt-6 text-sm font-medium text-[var(--muted-foreground)] flex flex-wrap justify-center items-center gap-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                <span>Exemples d&apos;expertises :</span>
                <ExampleBtn
                  label="15 rue de la Paix, Paris"
                  onSelect={handleSelect}
                />
                <ChevronRight className="h-3.5 w-3.5 text-[var(--border)]" />
                <ExampleBtn
                  label="12 cours Mirabeau, Aix"
                  onSelect={handleSelect}
                />
              </p>
            )}
          </div>
        </section>

        {/* ─── Loading skeleton ─── */}
        {isLoading && (
          <div className="max-w-4xl mx-auto px-6 w-full space-y-6 pb-24">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 space-y-8 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="space-y-3 w-1/3">
                  <div className="h-6 rounded bg-[var(--muted)] animate-pulse w-full" />
                  <div className="h-4 rounded bg-[var(--muted)] animate-pulse w-2/3" />
                </div>
                <div className="h-8 w-8 rounded-lg bg-[var(--muted)] animate-pulse" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-32 rounded-xl bg-[var(--muted)] animate-pulse" />
                <div className="h-32 rounded-xl bg-[var(--muted)] animate-pulse" />
              </div>
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[var(--border)]">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-[var(--muted)] animate-pulse" />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] h-64 animate-pulse shadow-sm" />
          </div>
        )}

        {/* ─── Error ─── */}
        {state.status === "error" && (
          <div className="max-w-4xl mx-auto px-6 w-full pb-24 animate-fade-in-up">
            <div className="rounded-2xl border border-[var(--destructive)]/20 bg-[var(--destructive)]/10 px-8 py-6 shadow-sm">
              <p className="text-base font-bold text-[var(--destructive)] mb-2">
                Échec de l&apos;estimation
              </p>
              <p className="text-sm font-medium text-[var(--destructive)]/80">{state.message}</p>
            </div>
          </div>
        )}

        {/* ─── Results ─── */}
        {state.status === "done" && (
          <div className="px-6 pb-24 w-full animate-fade-in-up">
            <ResultPanel result={state.result} />
          </div>
        )}

        {/* ─── FAQ ─── */}
        <section className="py-24 border-t border-[var(--border)] bg-[var(--background)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--primary)]/[0.02] pointer-events-none" />
          <div className="max-w-5xl mx-auto px-6 relative z-10">
            <FAQ />
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">
            Sources des données :{" "}
            <a
              href="https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres/"
              className="text-[var(--foreground)] hover:text-[var(--primary)] underline decoration-[var(--border)] hover:decoration-[var(--primary)] underline-offset-4 transition-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              DVF (DGFiP)
            </a>
            {" "}×{" "}
            <a
              href="https://data.ademe.fr/datasets/dpe-v2-logements-existants"
              className="text-[var(--foreground)] hover:text-[var(--primary)] underline decoration-[var(--border)] hover:decoration-[var(--primary)] underline-offset-4 transition-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              DPE (ADEME)
            </a>
            <br className="md:hidden mt-2" />
            <span className="hidden md:inline">{" · "}</span>Licence Ouverte Etalab 2.0
          </p>
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Estimation statistique non contractuelle
          </p>
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
      className="text-[var(--primary)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] px-3 py-1.5 rounded-lg transition-colors cursor-pointer bg-[var(--primary)]/5"
    >
      {label}
    </button>
  );
}
