"use client";

import { useState } from "react";
import type { EstimationResult } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, ShieldCheck, Info, FileSearch, SlidersHorizontal, Drill, Sparkles, Eye, TreePine, Calculator, Percent, Building, Coins, Printer, X, MapPin, Landmark, Wallet, Flame, Snowflake, Droplets } from "lucide-react";
import AgentBriefing from "./AgentBriefing";
import CommercialisationStrategy from "./CommercialisationStrategy";
import { calculateAnnualDebtCost, calculateDebtYield, calculateMonthlyPayment, getUsuryStatus } from "@/lib/finance";

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

/* ─── Helpers Components ─── */
function SegmentedControl({
    options,
    value,
    onChange
}: {
    options: { label: string; value: number; icon: React.ReactNode }[];
    value: number;
    onChange: (val: number) => void;
}) {
    return (
        <div className="flex p-1 bg-secondary/50 rounded-xl border border-border/50 w-full overflow-hidden">
            {options.map((opt) => {
                const isActive = value === opt.value;
                return (
                    <button
                        key={opt.label}
                        onClick={() => onChange(opt.value)}
                        className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all text-center leading-tight min-w-0 ${isActive
                            ? "bg-card text-primary shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                            }`}
                    >
                        <span className="shrink-0">{opt.icon}</span>
                        <span className="truncate w-full">{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

/* ─── Synthese Card ─── */
export default function SyntheseCard({ result }: { result: EstimationResult }) {
    const { synthese, dpe, adresse } = result;

    // Expert Modifiers State
    const [etat, setEtat] = useState<number>(0);
    const [exterieur, setExterieur] = useState<number>(0);
    const [vue, setVue] = useState<number>(0);

    const totalModifiers = etat + exterieur + vue;
    const basePrice = synthese.prix_m2_corrige_median;
    const adjustedPriceM2 = basePrice * (1 + totalModifiers);

    // Total calculation
    const isValuable = adjustedPriceM2 > 0 && synthese.surface_reference > 0;
    const totalBase = isValuable ? adjustedPriceM2 * synthese.surface_reference : 0;

    // Yield calculation
    const [loyerM2, setLoyerM2] = useState<number>(15);
    const loyerAnnuel = loyerM2 * synthese.surface_reference * 12;
    const rentabiliteBrute = totalBase > 0 ? (loyerAnnuel / totalBase) * 100 : 0;
    const isRentable = rentabiliteBrute >= 5.5;

    // Notaire calculation
    const fraisNotaireAncien = totalBase * 0.08;
    const fraisNotaireNeuf = totalBase * 0.025;
    const ecartNotaire = fraisNotaireAncien - fraisNotaireNeuf;

    // DPE Renovation Logic
    const isPassoire = dpe && ["E", "F", "G"].includes(dpe.etiquette_dpe);
    let renovationCostM2 = 0;
    if (isPassoire) {
        if (dpe.etiquette_dpe === "G") renovationCostM2 = 1200;
        else if (dpe.etiquette_dpe === "F") renovationCostM2 = 800;
        else if (dpe.etiquette_dpe === "E") renovationCostM2 = 400;
    }
    const totalRenovationCost = renovationCostM2 * synthese.surface_reference;
    const finalNetPrice = Math.max(0, totalBase - totalRenovationCost);

    // Liquidity calculation (Microsoft Track)
    const currentYearMonth = new Date().getFullYear() * 12 + new Date().getMonth();
    let totalMonthsAgo = 0;
    let validTxCount = 0;
    result.transactions.forEach((tx) => {
        if (!tx.mutation.date_mutation) return;
        const d = new Date(tx.mutation.date_mutation);
        const diff = currentYearMonth - (d.getFullYear() * 12 + d.getMonth());
        if (diff >= 0) {
            totalMonthsAgo += diff;
            validTxCount++;
        }
    });
    const avgMonthsAgo = validTxCount > 0 ? totalMonthsAgo / validTxCount : 0;
    const liquidityStatus = avgMonthsAgo < 12
        ? { label: "Tendu (Très Liquide)", color: "text-destructive", bg: "bg-destructive/10", icon: <Flame className="h-4 w-4" /> }
        : avgMonthsAgo < 24
            ? { label: "Équilibré (Standard)", color: "text-primary", bg: "bg-primary/10", icon: <Droplets className="h-4 w-4" /> }
            : { label: "Froid (Peu Liquide)", color: "text-blue-500", bg: "bg-blue-500/10", icon: <Snowflake className="h-4 w-4" /> };

    // Financing calculation (PayPal Track)
    const [apport, setApport] = useState<number>(30000);
    const [taux, setTaux] = useState<number>(3.8);
    const [duree, setDuree] = useState<number>(25);
    const [tauxUsure, setTauxUsure] = useState<number>(5.1);

    const capitalEmprunte = Math.max(0, finalNetPrice + fraisNotaireAncien - apport);
    const mensualite = calculateMonthlyPayment(capitalEmprunte, taux, duree);
    const tauxStress = Math.min(taux + 1, tauxUsure);
    const mensualiteStress = calculateMonthlyPayment(capitalEmprunte, tauxStress, duree);
    const usuryStatus = getUsuryStatus(taux, tauxUsure);

    const loyerMensuel = loyerAnnuel / 12;
    const cashflowBrut = loyerMensuel - mensualite;
    const cashflowStress = loyerMensuel - mensualiteStress;
    const rendementDette = calculateDebtYield(loyerAnnuel, calculateAnnualDebtCost(mensualite));

    // Presentation Mode State
    const [presentationMode, setPresentationMode] = useState(false);

    if (presentationMode) {
        return (
            <div className="fixed inset-0 z-50 bg-background overflow-y-auto print:bg-white print:text-black animate-fade-in">
                <div className="min-h-screen flex flex-col max-w-6xl mx-auto p-8 sm:p-12 lg:p-20 relative">
                    <button
                        onClick={() => setPresentationMode(false)}
                        className="absolute top-8 right-8 p-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors print:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="absolute top-8 right-24 flex items-center gap-2 px-4 py-2.5 rounded-full bg-brass text-white font-bold text-sm shadow-xl hover:bg-brass/90 transition-colors print:hidden"
                    >
                        <Printer className="h-4 w-4" />
                        Exporter PDF
                    </button>

                    <div className="text-center mb-16 space-y-5 print:mb-12">
                        <div className="flex justify-center mb-6 print:mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 print:border-2 print:border-black print:bg-transparent print:shadow-none">
                                <Building className="h-8 w-8 text-primary-foreground print:text-black" />
                            </div>
                        </div>
                        <div className="inline-block border border-brass/30 px-5 py-2 rounded-full bg-brass/5 print:border-black/20 print:bg-transparent">
                            <span className="text-[12px] font-bold text-brass uppercase tracking-[0.25em] print:text-black">Dossier d&apos;Expertise Confidentiel</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-5xl font-serif text-foreground leading-[1.1] tracking-tight print:text-black">
                            {adresse}
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground mt-2 uppercase tracking-widest">
                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center lg:items-start justify-center flex-1 w-full">
                        {/* Huge price */}
                        <div className="flex-1 text-center lg:text-left space-y-6">
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest print:text-gray-500">Valeur Nette Estimée</p>
                            <div className="flex items-baseline justify-center lg:justify-start gap-3">
                                <span className="font-data text-6xl sm:text-7xl lg:text-8xl font-black text-foreground tracking-tighter print:text-black">
                                    {Math.round(totalBase).toLocaleString("fr-FR")}
                                </span>
                                <span className="text-3xl font-serif italic text-muted-foreground print:text-gray-400">€</span>
                            </div>
                            <p className="text-base font-medium text-muted-foreground">Soit <strong className="text-foreground">{Math.round(adjustedPriceM2).toLocaleString("fr-FR")} €/m²</strong> pour <strong className="text-foreground">{synthese.surface_reference.toFixed(0)} m²</strong> de surface de calcul.</p>

                            {isPassoire && (
                                <div className="mt-8 p-8 bg-destructive/5 rounded-3xl border border-destructive/10 print:border-black/20 print:bg-transparent">
                                    <p className="text-xs font-bold text-destructive uppercase tracking-widest mb-2 print:text-black">Impact Rénovation Énergétique (DPE {dpe?.etiquette_dpe})</p>
                                    <p className="font-data text-3xl font-black text-destructive print:text-black">- {Math.round(totalRenovationCost).toLocaleString("fr-FR")} €</p>
                                    <p className="text-sm font-medium text-destructive/80 mt-3 italic print:text-gray-600">Valeur finale nette vendeur suggérée : <strong className="text-destructive text-lg ml-1 print:text-black">{Math.round(finalNetPrice).toLocaleString("fr-FR")} €</strong></p>
                                </div>
                            )}

                            {(rentabiliteBrute > 0) && (
                                <div className="mt-8 p-8 bg-card rounded-3xl border border-border shadow-sm flex flex-col justify-between items-start gap-4">
                                    <div className="w-full flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Rendement Locatif Projeté</p>
                                            <p className="text-sm text-muted-foreground font-medium">Loyer de {loyerM2} €/m²</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-data font-black text-primary text-4xl">{rentabiliteBrute.toFixed(1)}</span>
                                            <span className="text-primary/70 font-serif italic text-xl ml-1">%</span>
                                        </div>
                                    </div>
                                    <div className="w-full border-t border-border/50 pt-4 flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">Cashflow Brut (Loyer - Mensualité Crédit {duree}ans)</span>
                                        <span className={`font-data font-bold text-lg ${cashflowBrut >= 0 ? 'text-success' : 'text-destructive'}`}>
                                            {cashflowBrut >= 0 ? "+" : ""}{cashflowBrut.toFixed(0)} €/mois
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Adjustments Summary */}
                        <div className="flex-1 w-full max-w-md bg-secondary/30 rounded-[2rem] p-8 border border-border/50 shadow-inner print:bg-transparent print:border-black/20 print:shadow-none">
                            <h3 className="text-sm font-bold text-foreground mb-8 uppercase tracking-widest text-center border-b border-border/50 pb-4 print:text-black print:border-black/20">Paramètres Retenus par l&apos;Expert</h3>
                            <ul className="space-y-5 text-[15px] font-medium text-muted-foreground print:text-gray-700">
                                <li className="flex justify-between items-center">
                                    <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Transactions Analysées</span>
                                    <span className="font-bold text-foreground bg-background px-3 py-1 rounded-md border border-border">{synthese.nb_transactions} références</span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span className="flex items-center gap-2"><FileSearch className="h-4 w-4" /> Indice de Confiance Data</span>
                                    <span className="font-bold text-foreground bg-background px-3 py-1 rounded-md border border-border">{Math.round(synthese.confiance * 100)} %</span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span className="flex items-center gap-2"><Percent className="h-4 w-4" /> Base DVF Médiane</span>
                                    <span className="font-bold text-foreground bg-background px-3 py-1 rounded-md border border-border">{synthese.prix_m2_corrige_median.toLocaleString("fr-FR")} €/m²</span>
                                </li>

                                <div className="h-px w-full bg-border/50 my-2" />

                                <li className="flex justify-between border-l-2 border-primary/30 pl-3">
                                    <span>État du bien</span>
                                    <span className="font-bold text-foreground">{etat > 0 ? "Refait à neuf (+10%)" : etat < 0 ? "À rénover (-10%)" : "Standard"}</span>
                                </li>
                                <li className="flex justify-between border-l-2 border-primary/30 pl-3">
                                    <span>Surfaces extérieures</span>
                                    <span className="font-bold text-foreground">{exterieur > 0.05 ? "Terrasse (+10%)" : exterieur > 0 ? "Balcon (+5%)" : "Aucun"}</span>
                                </li>
                                <li className="flex justify-between border-l-2 border-primary/30 pl-3">
                                    <span>Ensoleillement / Vue</span>
                                    <span className="font-bold text-foreground">{vue > 0 ? "Exceptionnelle (+10%)" : vue < 0 ? "Nuisance (-5%)" : "Standard"}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-20 text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium border-t border-border/50 pt-8 opacity-50 print:border-black/20 print:text-gray-400">
                        Rapport sécurisé généré par TrueSquare Certified Engine. Document strictement confidentiel.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-linear-to-b from-brass/10 to-transparent rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-500" />

            <div className="relative rounded-[1.75rem] border border-border bg-card p-6 md:p-10 space-y-10 shadow-xl shadow-foreground/5 animate-fade-in-up">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-2">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <FileSearch className="h-5 w-5 text-brass" />
                            <p className="text-[11px] font-bold text-brass uppercase tracking-[0.2em]">Rapport d&apos;expertise</p>

                            <button
                                onClick={() => { setPresentationMode(true); window.scrollTo(0, 0); }}
                                className="ml-4 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all bg-secondary/50 px-2.5 py-1 rounded-md border border-border/50 shadow-sm hover:shadow-md active:scale-95"
                            >
                                <Printer className="h-3 w-3" />
                                Ouvrir Mode Présentation
                            </button>
                        </div>
                        <h2 className="text-3xl md:text-3xl lg:text-4xl font-serif text-foreground leading-[1.1] tracking-tight">
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
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Valorisation Brute (DVF)</p>
                        <div className="flex items-baseline gap-2">
                            <span className="font-data text-3xl font-bold text-foreground/80">
                                {synthese.prix_m2_naif_median > 0
                                    ? synthese.prix_m2_naif_median.toLocaleString("fr-FR")
                                    : "—"}
                            </span>
                            <span className="text-lg font-serif italic text-muted-foreground">€/m²</span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-4 leading-normal italic">
                            Prix brut tiré des mutations cadastrales sans pondération énergétique et sans ajustement expert.
                        </p>
                    </div>

                    {/* Consolidated Adjusted Value Card - The Star */}
                    <div className="relative p-7 rounded-2xl bg-primary shadow-2xl shadow-primary/20 border border-primary overflow-hidden group/star">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover/star:scale-110 transition-transform duration-700" />

                        <div className="flex items-center justify-between relative z-10 mb-3">
                            <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Valeur Ajustée</p>
                            {totalModifiers !== 0 && (
                                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded text-right">
                                    {(totalModifiers * 100).toFixed(0)}%
                                </span>
                            )}
                        </div>

                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="font-data text-4xl md:text-5xl font-extrabold text-white tracking-tighter">
                                {adjustedPriceM2 > 0
                                    ? Math.round(adjustedPriceM2).toLocaleString("fr-FR")
                                    : "—"}
                            </span>
                            <span className="text-2xl font-serif italic text-white/70">€/m²</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-6 relative z-10">
                            <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full">
                                <DeltaBadge pct={synthese.delta_median_pct + (totalModifiers * 100)} />
                            </div>
                            {dpe && (
                                <span className="text-[10px] font-bold text-white uppercase bg-brass px-3 py-1.5 rounded-full shadow-lg">
                                    DVF × DPE
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expert Adjustments (Hedonic Modifiers) */}
                <div className="space-y-5 pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5 text-primary" />
                        <h3 className="text-sm font-bold text-foreground">Pondérations Expertales</h3>
                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">Interactif</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* État Général */}
                        <div className="space-y-3">
                            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">État Général</p>
                            <SegmentedControl
                                value={etat}
                                onChange={setEtat}
                                options={[
                                    { label: "À Rénover", value: -0.10, icon: <Drill className="h-3.5 w-3.5 shrink-0" /> },
                                    { label: "Standard", value: 0, icon: <Minus className="h-3.5 w-3.5 shrink-0" /> },
                                    { label: "Refait à neuf", value: 0.10, icon: <Sparkles className="h-3.5 w-3.5 shrink-0" /> }
                                ]}
                            />
                        </div>
                        {/* Extérieur */}
                        <div className="space-y-3">
                            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">Extérieur</p>
                            <SegmentedControl
                                value={exterieur}
                                onChange={setExterieur}
                                options={[
                                    { label: "Aucun", value: 0, icon: <Minus className="h-3.5 w-3.5 shrink-0" /> },
                                    { label: "Balcon", value: 0.05, icon: <TreePine className="h-3.5 w-3.5 shrink-0" /> },
                                    { label: "Terrasse", value: 0.10, icon: <TreePine className="h-3.5 w-3.5 shrink-0" /> }
                                ]}
                            />
                        </div>
                        {/* Vue */}
                        <div className="space-y-3">
                            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">Vue / Nuisance</p>
                            <SegmentedControl
                                value={vue}
                                onChange={setVue}
                                options={[
                                    { label: "Nuisance", value: -0.05, icon: <Eye className="h-3.5 w-3.5 opacity-50" /> },
                                    { label: "Standard", value: 0, icon: <Minus className="h-3.5 w-3.5 shrink-0" /> },
                                    { label: "Exceptionnelle", value: 0.10, icon: <Eye className="h-3.5 w-3.5 shrink-0" /> }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Total Value & Renovation Cost */}
                {isValuable && (
                    <div className="pt-8 border-t border-border">
                        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col md:flex-row">

                            {/* Valeur Totale */}
                            <div className="p-8 flex-1 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calculator className="h-5 w-5 text-brass" />
                                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Valorisation Fiscale Globale</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-data text-4xl sm:text-5xl font-black text-foreground tracking-tight">
                                        {Math.round(totalBase).toLocaleString("fr-FR")}
                                    </span>
                                    <span className="text-xl font-serif italic text-muted-foreground">€</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3 font-medium">Prix pondéré ({adjustedPriceM2.toFixed(0)} €/m²) × Surface ({synthese.surface_reference.toFixed(0)} m²)</p>
                            </div>

                            {/* Déficit Énergétique (if applicable) */}
                            {isPassoire ? (
                                <div className="p-8 flex-1 bg-destructive/5 border-t md:border-t-0 md:border-l border-destructive/10">
                                    <p className="text-[11px] font-black text-destructive/80 uppercase tracking-[0.15em] mb-3">
                                        Décote Rénovation Énergétique (DPE {dpe.etiquette_dpe})
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-data text-3xl font-bold text-destructive">
                                            - {Math.round(totalRenovationCost).toLocaleString("fr-FR")}
                                        </span>
                                        <span className="text-lg font-serif italic text-destructive/70">€</span>
                                    </div>
                                    <p className="text-[13px] text-destructive/80 mt-3 font-medium italic">
                                        Estimation du coût des travaux pour sortir du statut de passoire thermique (~{renovationCostM2}€/m²).
                                    </p>

                                    <div className="mt-6 pt-4 border-t border-destructive/10">
                                        <p className="text-[10px] uppercase font-bold text-destructive/60 mb-1">Valeur Nette Vendeur (&quot;Net Vendeur Post-Travaux&quot;)</p>
                                        <span className="font-data text-2xl font-black text-foreground">
                                            {Math.round(finalNetPrice).toLocaleString("fr-FR")} <span className="text-sm font-serif italic text-muted-foreground">€</span>
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 flex-1 bg-success/5 border-t md:border-t-0 md:border-l border-success/10 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 text-success">
                                        <div className="p-2 bg-success/10 rounded-full"><ShieldCheck className="h-5 w-5" /></div>
                                        <p className="text-sm font-bold">Performance Énergétique Conforme</p>
                                    </div>
                                    <p className="text-[13px] text-success/80 mt-3 font-medium">
                                        Aucune décote de rénovation énergétique majeure applicable selon le DPE actuel ({dpe?.etiquette_dpe || "Non classé passeoire"}).
                                    </p>
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* Advanced Investment Metrics (Yield & VEFA) */}
                {isValuable && (
                    <div className="pt-8 border-t border-border grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Rendement Locatif */}
                        <div className="bg-secondary/40 border border-border/60 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Coins className="h-5 w-5 text-primary" />
                                        <h4 className="text-sm font-bold text-foreground">Rendement Locatif Brut</h4>
                                    </div>
                                    <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full">Simulateur</span>
                                </div>

                                <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 mb-5">
                                    <span className="text-xs font-semibold text-muted-foreground w-full">Loyer mensuel estimé :</span>
                                    <div className="flex items-center gap-1 bg-secondary px-3 py-1.5 rounded-lg border border-border/50 focus-within:ring-1 focus-within:ring-primary transition-all">
                                        <input
                                            type="number"
                                            value={loyerM2}
                                            onChange={(e) => setLoyerM2(Number(e.target.value) || 0)}
                                            className="w-10 bg-transparent text-sm font-bold text-foreground outline-none text-right appearance-none"
                                        />
                                        <span className="text-xs text-muted-foreground font-medium">€/m²</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-end justify-between mt-auto">
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1">Rentabilité Annuelle</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className={`font-data text-4xl sm:text-5xl font-black tracking-tight ${isRentable ? "text-success" : "text-foreground"}`}>
                                            {rentabiliteBrute.toFixed(1)}
                                        </span>
                                        <span className={`text-xl font-serif italic ${isRentable ? "text-success/70" : "text-muted-foreground"}`}>%</span>
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-muted-foreground text-right w-1/2">
                                    ~{Math.round(loyerAnnuel).toLocaleString("fr-FR")} € / an
                                </p>
                            </div>
                        </div>

                        {/* Benchmark Neuf / Ancien */}
                        <div className="bg-linear-to-br from-brass/5 to-transparent border border-brass/20 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Building className="h-5 w-5 text-brass" />
                                <h4 className="text-sm font-bold text-foreground">Benchmark Ancien vs Neuf</h4>
                            </div>

                            <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed font-medium">
                                Les frais de notaire réduits dans la VEFA (2.5%) par rapport à l&apos;Ancien (8%) créent un levier d&apos;acquisition majeur pour l&apos;acheteur :
                            </p>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">Frais Notaire (Ancien 8%)</span>
                                    <span className="font-bold text-foreground">{Math.round(fraisNotaireAncien).toLocaleString("fr-FR")} €</span>
                                </div>
                                <div className="flex justify-between items-center text-sm bg-card p-3 -mx-3 rounded-xl border border-border shadow-sm">
                                    <span className="font-bold text-primary">Frais Notaire (Neuf 2.5%)</span>
                                    <span className="font-bold text-primary">{Math.round(fraisNotaireNeuf).toLocaleString("fr-FR")} €</span>
                                </div>

                                <div className="pt-4 border-t border-border/50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-black text-foreground uppercase tracking-widest">Économie préservée</span>
                                        <span className="font-data text-2xl font-black text-brass">
                                            + {Math.round(ecartNotaire).toLocaleString("fr-FR")} €
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-1 text-right italic font-serif">De pouvoir d&apos;achat supplémentaire</p>
                                </div>
                            </div>
                        </div>

                        {/* Stress-Test Financement (PayPal Track) */}
                        <div className="bg-secondary/40 border border-border/60 rounded-2xl p-6 lg:col-span-2 relative overflow-hidden flex flex-col justify-between">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Landmark className="h-5 w-5 text-primary" />
                                    <h4 className="text-sm font-bold text-foreground">Simulation de Solvabilité Acquéreur (Stress-Test)</h4>
                                </div>
                                <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full whitespace-nowrap hidden sm:inline-block">Simulateur</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-muted-foreground">Apport Personnel</label>
                                    <div className="flex items-center gap-1 bg-card px-3 py-2 rounded-lg border border-border/50 focus-within:ring-1 focus-within:ring-primary transition-all">
                                        <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                                        <input
                                            type="number"
                                            value={apport}
                                            onChange={(e) => setApport(Number(e.target.value) || 0)}
                                            className="w-full bg-transparent text-sm font-bold text-foreground outline-none text-right appearance-none"
                                        />
                                        <span className="text-xs text-muted-foreground font-medium">€</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-muted-foreground">Taux Moyen (Hors Ass.)</label>
                                    <div className="flex items-center gap-1 bg-card px-3 py-2 rounded-lg border border-border/50 focus-within:ring-1 focus-within:ring-primary transition-all">
                                        <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={taux}
                                            onChange={(e) => setTaux(Number(e.target.value) || 0)}
                                            className="w-full bg-transparent text-sm font-bold text-foreground outline-none text-right appearance-none"
                                        />
                                        <span className="text-xs text-muted-foreground font-medium">%</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-muted-foreground">Taux d&apos;usure (trim.)</label>
                                    <div className="flex items-center gap-1 bg-card px-3 py-2 rounded-lg border border-border/50 focus-within:ring-1 focus-within:ring-primary transition-all">
                                        <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={tauxUsure}
                                            onChange={(e) => setTauxUsure(Number(e.target.value) || 0)}
                                            className="w-full bg-transparent text-sm font-bold text-foreground outline-none text-right appearance-none"
                                        />
                                        <span className="text-xs text-muted-foreground font-medium">%</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-muted-foreground">Durée du Crédit</label>
                                    <div className="flex items-center bg-card rounded-lg border border-border/50 p-1">
                                        <button onClick={() => setDuree(20)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${duree === 20 ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}>20 ans</button>
                                        <button onClick={() => setDuree(25)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${duree === 25 ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}>25 ans</button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-background border border-border p-4 rounded-xl">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Mensualité Estimée</p>
                                        <p className="text-xs font-medium text-muted-foreground">Pour emprunter {Math.round(capitalEmprunte).toLocaleString("fr-FR")} €</p>
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="font-data text-3xl font-black text-foreground">{Math.round(mensualite).toLocaleString("fr-FR")}</span>
                                        <span className="text-lg font-serif italic text-muted-foreground">€/mois</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="bg-background border border-border rounded-xl p-3">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Conformité usure</p>
                                        <p className={`text-sm font-bold ${usuryStatus === 'ok' ? 'text-success' : usuryStatus === 'warning' ? 'text-warning' : 'text-destructive'}`}>
                                            {usuryStatus === "ok" ? "Conforme" : usuryStatus === "warning" ? "Zone de vigilance" : "Non finançable"}
                                        </p>
                                    </div>
                                    <div className="bg-background border border-border rounded-xl p-3">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Mensualité stress (+1 pt)</p>
                                        <p className="text-sm font-bold text-foreground">{Math.round(mensualiteStress).toLocaleString("fr-FR")} €/mois</p>
                                    </div>
                                    <div className="bg-background border border-border rounded-xl p-3">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Rendement après dette</p>
                                        <p className={`text-sm font-bold ${rendementDette >= 0 ? 'text-success' : 'text-destructive'}`}>{rendementDette.toFixed(1)}%</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-background border border-border p-4 rounded-xl">
                                    <p className="text-xs font-medium text-muted-foreground">Cashflow en stress-test (taux {tauxStress.toFixed(1)}%)</p>
                                    <span className={`font-data font-bold text-lg ${cashflowStress >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {cashflowStress >= 0 ? '+' : ''}{cashflowStress.toFixed(0)} €/mois
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* Secondary data & indicators */}
                <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 border-t border-border">
                    {/* Transactions Count */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Échantillonnage</p>
                        <div className="flex items-baseline gap-2">
                            <span className="font-data text-2xl font-bold text-foreground">{synthese.nb_transactions}</span>
                            <span className="text-xs font-serif italic text-muted-foreground">références</span>
                        </div>
                    </div>

                    {/* Market Liquidity (Microsoft Track) */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Liquidité Marché</p>
                        <div className="flex items-center gap-2 mt-1 w-full max-w-[150px]">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${liquidityStatus.bg} ${liquidityStatus.color}`}>
                                {liquidityStatus.icon}
                                {liquidityStatus.label}
                            </span>
                        </div>
                    </div>

                    {/* Surface Ref */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Surface calcul</p>
                        <div className="flex items-baseline gap-2">
                            <span className="font-data text-2xl font-bold text-foreground">
                                {synthese.surface_reference > 0 ? synthese.surface_reference.toFixed(0) : "—"}
                            </span>
                            <span className="text-xs font-serif italic text-muted-foreground">m² habitables</span>
                        </div>
                    </div>

                    {/* Confidence Index */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Fiabilité</p>
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

                {/* --- MODULE STRATÉGIE COMMERCIALISATION --- */}
                <CommercialisationStrategy valeurNetteEstimee={finalNetPrice} />

                <AgentBriefing
                    totalModifiers={totalModifiers}
                    isPassoire={Boolean(isPassoire)}
                    dpeLabel={dpe?.etiquette_dpe || null}
                    liquidityLabel={liquidityStatus.label}
                    adjustedPrice={adjustedPriceM2}
                    basePrice={basePrice}
                    fraisNotaireEcart={ecartNotaire}
                />
            </div>
        </div>
    );
}

