"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
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
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/dossiers/${params.token}`);
        const json: SharedResponse = await res.json();

        if (!json.success || !json.data) {
          setError(json.error || "Ce lien n'est plus valide.");
          return;
        }

        setResult(json.data.dossier);
      } catch {
        setError("Impossible de charger le dossier partagé.");
      }
    };

    if (params.token) load();
  }, [params.token]);

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] font-bold">TrueSquare • Dossier partagé</p>
          <h1 className="mt-2 text-2xl font-serif">Consultation client sécurisée</h1>
        </div>

        {!result && !error && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-[var(--muted-foreground)] flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Chargement du dossier...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4 text-amber-900 flex items-start gap-3">
            <TriangleAlert className="h-5 w-5 mt-0.5 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {result && <ResultPanel result={result} />}
      </div>
    </main>
  );
}
