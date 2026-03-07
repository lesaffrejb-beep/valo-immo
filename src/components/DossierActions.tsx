"use client";

import { useMemo, useState } from "react";
import { Copy, FolderHeart, Share2, ShieldAlert, Timer } from "lucide-react";
import type { EstimationResult } from "@/lib/types";

const LOCAL_KEY = "true-square:dossiers";

type LocalDossier = {
  id: string;
  savedAt: string;
  adresse: string;
  prixM2: number;
  confiance: number;
};

export default function DossierActions({ result }: { result: EstimationResult }) {
  const [message, setMessage] = useState<string>("");
  const [isBusy, setIsBusy] = useState(false);

  const summary = useMemo<LocalDossier>(
    () => ({
      id: result.ban.id,
      savedAt: new Date().toISOString(),
      adresse: result.adresse,
      prixM2: result.synthese.prix_m2_corrige_median,
      confiance: result.synthese.confiance,
    }),
    [result]
  );

  const saveLocal = () => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(LOCAL_KEY);
    const current: LocalDossier[] = raw ? JSON.parse(raw) : [];

    const next = [summary, ...current.filter((item) => item.id !== summary.id)].slice(0, 30);
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(next));

    setMessage("Dossier sauvegardé dans le CRM local de l'agence.");
  };

  const createShareLink = async () => {
    setIsBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossier: result, ttlHours: 48 }),
      });

      const json = await response.json();
      if (!json.success) throw new Error(json.error || "Erreur de création.");

      const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/partage/${json.data.token}`;
      await navigator.clipboard.writeText(shareUrl);

      const expiresAt = new Date(json.data.expiresAt).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
      setMessage(`Lien copié. Expiration automatique le ${expiresAt}.`);
    } catch {
      setMessage("Impossible de générer le lien de partage.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <FolderHeart className="h-5 w-5 mt-0.5 text-primary" />
        <div>
          <h3 className="text-base font-bold text-foreground">CRM & Partage rapide</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Sauvegardez la synthèse en local et créez un lien expirant pour maintenir l&apos;urgence commerciale auprès de votre prospect.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={saveLocal}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:border-primary/40"
        >
          <FolderHeart className="h-4 w-4" /> Sauvegarder le dossier
        </button>
        <button
          onClick={createShareLink}
          disabled={isBusy}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 relative overflow-hidden group"
        >
          {/* Subtle gradient effect for the main CTA */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

          {isBusy ? <Share2 className="h-4 w-4 animate-pulse relative z-10" /> : <Timer className="h-4 w-4 relative z-10" />}
          <span className="relative z-10">Lien client valide 48h</span>
        </button>
      </div>

      {message && (
        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 animate-fade-in-up">
          <ShieldAlert className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
