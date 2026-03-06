"use client";

import type { EstimationResult } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, ShieldCheck, Info } from "lucide-react";

/* ─── DPE Étiquette Badge ─── */
const DPE_COLORS: Record<string, { bg: string; text: string }> = {
    A: { bg: "bg-emerald-500", text: "text-white" },
    B: { bg: "bg-green-500", text: "text-white" },
    C: { bg: "bg-lime-500", text: "text-white" },
    D: { bg: "bg-yellow-400", text: "text-neutral-900" },
    E: { bg: "bg-orange-500", text: "text-white" },
    F: { bg: "bg-red-500", text: "text-white" },
    G: { bg: "bg-red-700", text: "text-white" },
};

export function DpeBadge({ label }: { label: string }) {
    const c = DPE_COLORS[label] || { bg: "bg-[var(--muted)]", text: "text-[var(--muted-foreground)]" };
    return (
        <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm shadow-sm ${c.bg} ${c.text}`}
            title={`DPE : ${label}`}
        >
            {label}
        </span>
    );
}

/* ─── Confiance Indicator ─── */
function ConfianceBar({ value }: { value: number }) {
    const pct = Math.round(value * 100);
    const color =
        pct >= 70
            ? "bg-[var(--success)]"
            : pct >= 40
                ? "bg-[var(--warning)]"
                : "bg-[var(--destructive)]";
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 shadow-sm ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className={`text-sm font-data font-semibold text-[var(--foreground)]`}>
                {pct}%
            </span>
        </div>
    );
}

/* ─── Delta Badge ─── */
function DeltaBadge({ pct }: { pct: number }) {
    if (Math.abs(pct) < 0.5)
        return (
            <span className="inline-flex items-center gap-1 text-[var(--muted-foreground)] text-sm font-medium">
                <Minus className="h-4 w-4" /> Stable
            </span>
        );
    const positive = pct > 0;
    return (
        <span
            className={`inline-flex items-center gap-1 text-sm font-bold ${positive ? "text-[var(--success)]" : "text-[var(--destructive)]"
                }`}
        >
            {positive ? (
                <TrendingUp className="h-4 w-4" />
            ) : (
                <TrendingDown className="h-4 w-4" />
            )}
            {positive ? "+" : ""}
            {pct.toFixed(1)}%
        </span>
    );
}

/* ─── Synthese Card ─── */
export default function SyntheseCard({ result }: { result: EstimationResult }) {
    const { synthese, dpe, adresse } = result;

    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8 space-y-8 shadow-sm animate-fade-in-up">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[var(--foreground)] leading-tight">
                        {adresse}
                    </h2>
                    <p className="text-sm font-medium text-[var(--muted-foreground)] mt-1.5 uppercase tracking-wide">
                        Synthèse de l&apos;estimation immobilière
                    </p>
                </div>
                {dpe && (
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <DpeBadge label={dpe.etiquette_dpe} />
                    </div>
                )}
            </div>

            {/* Main metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl bg-[var(--muted)] border border-[var(--border)] p-6 flex flex-col justify-center">
                    <p className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Prix/m² statutaire (DVF)</p>
                    <p className="font-data text-3xl font-bold text-[var(--foreground)]">
                        {synthese.prix_m2_naif_median > 0
                            ? synthese.prix_m2_naif_median.toLocaleString("fr-FR")
                            : "—"}{" "}
                        <span className="text-xl font-medium text-[var(--muted-foreground)]">€/m²</span>
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-2 font-medium">Basé sur la surface cadastrale</p>
                </div>

                <div className="rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 p-6 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full -mr-10 -mt-10 pointer-events-none" />
                    <p className="text-sm font-bold text-[var(--primary)] uppercase tracking-wide mb-2 relative z-10">Prix/m² consolidé</p>
                    <p className="font-data text-4xl font-extrabold text-[var(--primary)] relative z-10">
                        {synthese.prix_m2_corrige_median > 0
                            ? synthese.prix_m2_corrige_median.toLocaleString("fr-FR")
                            : "—"}{" "}
                        <span className="text-2xl font-bold opacity-80">€/m²</span>
                    </p>
                    <div className="flex items-center gap-3 mt-3 relative z-10">
                        <DeltaBadge pct={synthese.delta_median_pct} />
                        {dpe && (
                            <span className="text-xs font-semibold text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-md">
                                Croisement DVF × DPE
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-3 gap-6 text-center border-t border-b border-[var(--border)] py-6">
                <div className="border-r border-[var(--border)]">
                    <p className="font-data text-2xl font-bold text-[var(--foreground)]">
                        {synthese.nb_transactions}
                    </p>
                    <p className="text-xs font-bold text-[var(--muted-foreground)] mt-1.5 uppercase tracking-wider">Transactions</p>
                </div>
                <div className="border-r border-[var(--border)]">
                    <p className="font-data text-2xl font-bold text-[var(--foreground)]">
                        {synthese.surface_reference > 0
                            ? `${synthese.surface_reference.toFixed(0)} m²`
                            : "—"}
                    </p>
                    <p className="text-xs font-bold text-[var(--muted-foreground)] mt-1.5 uppercase tracking-wider">
                        {result.dpe ? "Surf. de référence" : "Surf. médiane"}
                    </p>
                </div>
                <div className="px-2 flex flex-col justify-center items-center">
                    <p className="text-xs font-bold text-[var(--muted-foreground)] mb-2.5 uppercase tracking-wider w-full text-left pl-1">Indice de confiance</p>
                    <div className="w-full">
                        <ConfianceBar value={synthese.confiance} />
                    </div>
                </div>
            </div>

            {/* DPE info */}
            {dpe && (
                <div className="rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 px-5 py-4 flex items-start gap-4">
                    <ShieldCheck className="h-6 w-6 text-[var(--primary)] shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--foreground)] leading-relaxed font-medium">
                        La surface habitable fiabilisée est de{" "}
                        <span className="font-bold text-[var(--primary)]">
                            {dpe.surface_habitable_logement} m²
                        </span>.{" "}
                        Ce chiffre prévaut sur la surface cadastrale brute pour le calcul du prix consolidé (DPE certifié en{" "}
                        {new Date(dpe.date_etablissement_dpe).getFullYear()}).
                        {dpe.annee_construction > 0 && ` Bâtiment construit en ${dpe.annee_construction}.`}
                    </p>
                </div>
            )}

            {!dpe && (
                <div className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/5 px-5 py-4 flex items-start gap-4">
                    <Info className="h-6 w-6 text-[var(--warning)] shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--foreground)] leading-relaxed font-medium">
                        <span className="font-bold text-[var(--warning)]">Information incomplète :</span> Aucun DPE récent trouvé. Le prix consolidé utilise la surface cadastrale (DVF) comme référence. La marge d&apos;erreur peut être plus élevée selon la nature du bien.
                    </p>
                </div>
            )}
        </div>
    );
}
