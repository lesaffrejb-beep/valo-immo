"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, TriangleAlert, Clock, ShieldCheck } from "lucide-react";
import type { EstimationResult } from "@/lib/types";
import ResultPanel from "@/components/ResultPanel";

type SharedResponse = {
  success: boolean;
  data?: {
    expiresAt: string;
    dossier: EstimationResult;
  };
  error?: string;
};

export default function SharedDossierPage() {
  const params = useParams<{ token: string }>();
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [error, setError] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number }>({ hours: 0, minutes: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/dossiers/${params.token}`);
        const json: SharedResponse = await res.json();

        if (!json.success || !json.data) {
          setError(json.error || "Ce rapport certifié n'est plus accessible.");
          return;
        }

        setResult(json.data.dossier);
        setExpiresAt(new Date(json.data.expiresAt));
      } catch {
        setError("Impossible de charger le dossier partagé.");
      }
    };

    if (params.token) load();
  }, [params.token]);

  // Handle countdown
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const diffStr = expiresAt.getTime() - now.getTime();

      if (diffStr <= 0) {
        setError("Ce rapport certifié a expiré et n'est plus accessible. Veuillez contacter votre conseiller.");
        setResult(null);
        return;
      }

      const hours = Math.floor(diffStr / (1000 * 60 * 60));
      const minutes = Math.floor((diffStr % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft({ hours, minutes });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [expiresAt]);


  return (
    <main className="min-h-screen bg-background px-6 py-12 selection:bg-primary/20 selection:text-primary">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">

        {/* Premium Client Header with Urgency Banner */}
        <div className="rounded-2xl border border-border bg-card shadow-md overflow-hidden flex flex-col sm:flex-row relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="p-6 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">TrueSquare • Vue Client Certifiée</p>
            </div>
            <h1 className="text-2xl font-serif text-foreground tracking-tight">Rapport d'Expertise Valeur Vénale</h1>
            <p className="text-sm font-medium text-muted-foreground mt-1.5 opacity-80 max-w-lg">Ce dossier contient des données transactionnelles sensibles. Il vous est partagé de manière sécurisée et éphémère.</p>
          </div>
          {result && expiresAt && (
            <div className="p-6 bg-muted/40 border-t sm:border-t-0 sm:border-l border-border flex items-center justify-center min-w-[280px]">
              <div className="w-full relative px-4 py-3 bg-card border border-primary/20 rounded-xl overflow-hidden shadow-sm group">
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                <div className="relative flex items-center justify-between z-10">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> Expire dans</span>
                  <div className="text-sm font-black text-foreground tabular-nums">
                    {timeLeft.hours}h {timeLeft.minutes.toString().padStart(2, '0')}m
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {!result && !error && (
          <div className="rounded-2xl border border-border bg-card p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-4 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="font-medium text-sm">Déchiffrement du rapport...</span>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-8 py-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto text-destructive">
              <TriangleAlert className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-serif text-foreground">Accès Révoqué</p>
              <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto">{error}</p>
            </div>
          </div>
        )}

        {result && <ResultPanel result={result} isSharedView={true} />}
      </div>
    </main>
  );
}
