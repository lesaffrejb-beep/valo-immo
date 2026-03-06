"use client";

import type { EstimationResult } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, ShieldCheck, Info, FileSearch } from "lucide-react";

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
    const c = DPE_COLORS[label] || { bg: "bg-muted", text: "text-muted-foreground" };
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
            ? "bg-success"
            : pct >= 40
                ? "bg-warning"
                : "bg-destructive";
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className={`text-[13px] font-data font-semibold text-foreground`}>
                {pct}%
            </span>
        </div>
    );
}

/* ─── Delta Badge ─── */
function DeltaBadge({ pct }: { pct: number }) {
    if (Math.abs(pct) < 0.5)
        return (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground text-[13px] font-medium">
                <Minus className="h-3.5 w-3.5" /> Stable
            </span>
        );
    const positive = pct > 0;
    return (
        <span
            className={`inline-flex items-center gap-1.5 text-[13px] font-bold ${positive ? "text-success" : "text-destructive"
                }`}
        >
            {positive ? (
                <TrendingUp className="h-3.5 w-3.5" />
            ) : (
                <TrendingDown className="h-3.5 w-3.5" />
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
        <div className="relative group">
            {/* Subtle glow / shadow layering */}
            <div className="absolute -inset-0.5 bg-linear-to-b from-brass/10 to-transparent rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-500" />

            <div className="relative rounded-[1.75rem] border border-border bg-card p-6 md:p-10 space-y-10 shadow-xl shadow-foreground/5 animate-fade-in-up">

                {/* Header - Expert Style */}
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-2">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <FileSearch className="h-5 w-5 text-brass" />
                            <p className="text-[11px] font-bold text-brass uppercase tracking-[0.2em]">Rapport d&apos;expertise</p>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif text-foreground leading-[1.1] tracking-tight">
                            {adresse}
                        </h2>
                        <div className="h-px w-24 bg-linear-to-r from-brass to-transparent opacity-30" />
                    </div>
                    {dpe && (
                        <div className="flex flex-col items-end gap-2 shrink-0 bg-secondary/50 p-2 rounded-xl border border-border/50">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Énergie</p>
                            <DpeBadge label={dpe.etiquette_dpe} />
                        </div>
                    )}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

                    {/* Raw Value Card */}
                    <div className="relative p-7 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/40 transition-colors">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Valeur Naïve (DVF)</p>
                        <div className="flex items-baseline gap-2">
                            <span className="font-data text-3xl font-bold text-foreground/80">
                                {synthese.prix_m2_naif_median > 0
                                    ? synthese.prix_m2_naif_median.toLocaleString("fr-FR")
                                    : "—"}
                            </span>
                            <span className="text-lg font-serif italic text-muted-foreground">€/m²</span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-4 leading-normal italic">
                            Prix brut tiré des mutations cadastrales sans pondération énergétique.
                        </p>
                    </div>

                    {/* Consolidated Value Card - The Star */}
                    <div className="relative p-7 rounded-2xl bg-primary shadow-2xl shadow-primary/20 border border-primary overflow-hidden group/star">
                        {/* Decorative pattern */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover/star:scale-110 transition-transform duration-700" />

                        <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-3 relative z-10">Estimation Consolidée</p>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="font-data text-4xl md:text-5xl font-extrabold text-white tracking-tighter">
                                {synthese.prix_m2_corrige_median > 0
                                    ? synthese.prix_m2_corrige_median.toLocaleString("fr-FR")
                                    : "—"}
                            </span>
                            <span className="text-2xl font-serif italic text-white/70">€/m²</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-6 relative z-10">
                            <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full">
                                <DeltaBadge pct={synthese.delta_median_pct} />
                            </div>
                            {dpe && (
                                <span className="text-[10px] font-bold text-white uppercase bg-brass px-3 py-1.5 rounded-full shadow-lg">
                                    Corrigé DPE
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Secondary data & indicators */}
                <div className="pt-4 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Transactions Count */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Échantillonnage</p>
                            <div className="flex items-center gap-3">
                                <span className="font-data text-2xl font-bold text-foreground">{synthese.nb_transactions}</span>
                                <span className="text-sm font-serif italic text-muted-foreground">références de transactions</span>
                            </div>
                        </div>

                        {/* Surface Ref */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Surface calcul</p>
                            <div className="flex items-center gap-3">
                                <span className="font-data text-2xl font-bold text-foreground">
                                    {synthese.surface_reference > 0 ? synthese.surface_reference.toFixed(0) : "—"}
                                </span>
                                <span className="text-sm font-serif italic text-muted-foreground">m² habitables</span>
                            </div>
                        </div>

                        {/* Confidence Index */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fiabilité</p>
                            <ConfianceBar value={synthese.confiance} />
                        </div>
                    </div>

                    {/* Explanatory blocks */}
                    <div className="space-y-4 pt-4">
                        {dpe ? (
                            <div className="p-5 rounded-xl border-l-4 border-primary bg-secondary/40 flex items-start gap-5">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[13px] font-bold text-foreground">Calcul fiabilisé par croisement de données</p>
                                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                                        La surface habitable de <strong className="text-foreground">{dpe.surface_habitable_logement} m²</strong> certifiée en {new Date(dpe.date_etablissement_dpe).getFullYear()} a été utilisée pour éliminer les approximations cadastrales habituelles.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 rounded-xl border-l-4 border-brass bg-brass/5 flex items-start gap-5">
                                <div className="p-2 bg-brass/10 rounded-lg text-brass">
                                    <Info className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[13px] font-bold text-foreground">Avertissement : surface cadastrale uniquement</p>
                                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                                        Aucun DPE certifié n&apos;a été détecté pour cette adresse. Le calcul repose sur la déclaration cadastrale (DVF), pouvant inclure des erreurs sur la surface habitable réelle.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

