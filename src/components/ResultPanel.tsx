"use client";

import { useState, useMemo } from "react";
import { MapPin, Eye, EyeOff } from "lucide-react";
import type { EstimationResult } from "@/lib/types";
import SyntheseCard from "./SyntheseCard";
import { computeSynthese } from "@/lib/calculation-engine";
import dynamic from "next/dynamic";

const MapWidget = dynamic(() => import("./MapWidget"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[400px] rounded-2xl bg-muted/30 animate-pulse border border-[var(--border)] flex items-center justify-center">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Initilisation du Cadastre...</p>
        </div>
    )
});

export default function ResultPanel({ result }: { result: EstimationResult }) {
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

    const toggleExclusion = (id: string) => {
        setExcludedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const computedResult = useMemo(() => {
        if (excludedIds.size === 0) return result;

        const activeTransactions = result.transactions.filter(t => {
            const id = t.mutation.id_mutation || `${t.mutation.date_mutation}_${t.mutation.valeur_fonciere}`;
            return !excludedIds.has(id);
        });

        const newSynthese = computeSynthese(activeTransactions, result.dpe);

        return {
            ...result,
            synthese: newSynthese
        };
    }, [result, excludedIds]);

    if (!result) return null;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            {/* 1. Carte de Synthèse principale */}
            <SyntheseCard
                result={computedResult}
            />

            {/* Cadastre Intégré */}
            <MapWidget
                result={result}
                excludedIds={excludedIds}
                onToggleExclusion={toggleExclusion}
            />

            {/* 2. Tableau des 5 transactions DVF les plus proches */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">
                            Références Cadastrales (Base DVF)
                        </h3>
                        <p className="text-sm font-medium text-[var(--muted-foreground)] mt-0.5">
                            Échantillon brut des mutations environnantes. <span className="text-primary">Écartez les anomalies statistiques pour certifier la médiane.</span>
                        </p>
                    </div>
                </div>

                {result.transactions && result.transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] bg-transparent">
                                    <th className="px-6 py-4 font-semibold w-12 text-center">Retenir</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Type</th>
                                    <th className="px-6 py-4 font-semibold text-right">Surface</th>
                                    <th className="px-6 py-4 font-semibold text-right text-[var(--primary)]">Prix / m² corrigé</th>
                                    <th className="px-6 py-4 font-semibold text-right">Net Vendeur</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {result.transactions
                                    .slice(0, 10) // Analyser un sous-ensemble plus large pour le filtrage
                                    .filter(t => !excludedIds.has(t.mutation.id_mutation || `${t.mutation.date_mutation}_${t.mutation.valeur_fonciere}`))
                                    .slice(0, 5) // Garder les 5 meilleures références actives
                                    .map((t, idx) => {
                                        const prixM2 = t.mutation.surface_reelle_bati ? Math.round(t.mutation.valeur_fonciere / t.mutation.surface_reelle_bati) : null;
                                        const isHouse = t.mutation.type_local?.toLowerCase() === "maison";
                                        const txId = t.mutation.id_mutation || `${t.mutation.date_mutation}_${t.mutation.valeur_fonciere}`;
                                        const isExcluded = excludedIds.has(txId);

                                        return (
                                            <tr
                                                key={txId}
                                                className={`border-b border-[var(--border)] last:border-none transition-colors group ${isExcluded ? 'opacity-40 bg-muted/20 grayscale' : 'hover:bg-[var(--muted)]/50'}`}
                                            >
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => toggleExclusion(txId)}
                                                        className={`p-1.5 rounded-md transition-colors ${isExcluded ? "text-muted-foreground hover:bg-muted" : "text-primary hover:bg-primary/10"}`}
                                                        title={isExcluded ? "Ré-inclure cette transaction" : "Exclure cette transaction du calcul"}
                                                    >
                                                        {isExcluded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
                                                    {new Date(t.mutation.date_mutation).toLocaleDateString("fr-FR", {
                                                        month: "short",
                                                        year: "numeric"
                                                    })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold tracking-wide
                                                    ${isHouse
                                                                ? "bg-[var(--muted)] text-[var(--muted-foreground)]"
                                                                : "bg-primary/10 text-[var(--primary)]"
                                                            }`}
                                                    >
                                                        {t.mutation.type_local || "N/A"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-[var(--foreground)]">
                                                    {t.mutation.surface_reelle_bati} m²
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-extrabold text-[var(--primary)] bg-primary/5 px-2.5 py-1 rounded-md group-hover:bg-primary/10 transition-colors">
                                                        {prixM2 ? `${prixM2.toLocaleString("fr-FR")} €` : "-"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-[var(--foreground)]">
                                                    {t.mutation.valeur_fonciere.toLocaleString("fr-FR", {
                                                        style: "currency",
                                                        currency: "EUR",
                                                        maximumFractionDigits: 0,
                                                    })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center flex flex-col items-center">
                        <MapPin className="h-8 w-8 text-[var(--muted-foreground)]/30 mb-3" />
                        <p className="text-sm font-medium text-[var(--muted-foreground)]">
                            Volume transactionnel insuffisant dans ce périmètre pour certifier une valeur.
                        </p>
                    </div>
                )}
            </div>

            {/* 3. DPE Raw Data (Collapsible/Debug info pour expert) */}
            {result.dpe && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden flex flex-col text-sm">
                    <div className="px-6 py-4 bg-[var(--muted)]/30 border-b border-[var(--border)] flex justify-between items-center">
                        <h4 className="font-semibold text-[var(--foreground)]">Diagnostic de Performance Énergétique (Certification ADEME)</h4>
                        <span className="text-xs font-medium text-[var(--muted-foreground)] bg-[var(--background)] border border-[var(--border)] px-2 py-1 rounded">
                            {result.dpe.numero_dpe}
                        </span>
                    </div>
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Surface Habitable</span>
                            <p className="font-medium text-[var(--foreground)]">{result.dpe.surface_habitable_logement} m²</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Année construction</span>
                            <p className="font-medium text-[var(--foreground)]">{result.dpe.annee_construction || "N/C"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Émission GES</span>
                            <p className="font-medium text-[var(--foreground)]">{result.dpe.etiquette_ges}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
