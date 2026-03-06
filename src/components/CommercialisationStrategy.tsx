import { useState } from "react";
import { Calculator, Percent, Coins, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface CommercialisationStrategyProps {
    valeurNetteEstimee: number;
}

export default function CommercialisationStrategy({ valeurNetteEstimee }: CommercialisationStrategyProps) {
    const [commissionType, setCommissionType] = useState<"percentage" | "fixed">("percentage");
    const [commissionRate, setCommissionRate] = useState<number>(4.5);
    const [fixedCommission, setFixedCommission] = useState<number>(10000);
    const [isExpanded, setIsExpanded] = useState<boolean>(true);

    // Calculate Honoraires based on type
    const honoraires = commissionType === "percentage"
        ? Math.round(valeurNetteEstimee * (commissionRate / 100))
        : fixedCommission;

    const prixFaiBrut = valeurNetteEstimee + honoraires;

    // Algorithm for psychological pricing (e.g., 403,000 -> 399,000)
    const calculateSeuilPsychologique = (price: number) => {
        if (price < 100000) return Math.floor(price / 5000) * 5000;
        if (price < 500000) {
            const base = Math.floor(price / 10000) * 10000;
            const remainder = price % 10000;
            if (remainder > 7000) return base + 9000;
            if (remainder > 3000) return base + 5000;
            return base - 1000; // e.g., 402,000 -> 399,000
        }
        if (price < 1000000) return Math.floor(price / 10000) * 10000;
        return Math.floor(price / 50000) * 50000;
    };

    const prixFaiOptimise = calculateSeuilPsychologique(prixFaiBrut);
    const ecartPsychologique = prixFaiOptimise - prixFaiBrut;
    const impactSurNet = ecartPsychologique < 0 ? ecartPsychologique : 0; // If we lower the FAI, it eats into the Net Vendeur (or agency fee, but usually Net Vendeur)
    const finalNetVendeur = valeurNetteEstimee + impactSurNet;

    return (
        <div className="mt-8 rounded-3xl bg-secondary/20 border border-border/50 overflow-hidden print:border-black/20 print:bg-transparent">
            {/* Header (Toggleable) */}
            <div
                className="px-8 py-5 border-b border-border/50 bg-secondary/30 flex items-center justify-between cursor-pointer hover:bg-secondary/40 transition-colors print:bg-transparent print:border-black/20"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center print:border-black/20 print:bg-transparent">
                        <Calculator className="h-5 w-5 text-foreground print:text-black" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-foreground print:text-black">Stratégie de Commercialisation</h3>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5 print:text-gray-500">Calcul des Honoraires & Optimisation F.A.I (Frais d&apos;Agence Inclus)</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-foreground bg-background px-2 py-1 rounded-md border border-border uppercase tracking-wide print:hidden">Interactif</span>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground print:hidden" /> : <ChevronDown className="h-5 w-5 text-muted-foreground print:hidden" />}
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 print:gap-4">
                    {/* Left: Interactive Controls (Hidden in Print for cleaner look if requested, but we'll show values) */}
                    <div className="lg:col-span-5 space-y-6 flex flex-col justify-center print:hidden">
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Honoraires d&apos;Agence</p>
                            <div className="flex bg-background border border-border rounded-lg p-1 mb-4">
                                <button
                                    onClick={() => setCommissionType("percentage")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${commissionType === "percentage" ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <Percent className="h-4 w-4" /> Pourcentage
                                </button>
                                <button
                                    onClick={() => setCommissionType("fixed")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${commissionType === "fixed" ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <Coins className="h-4 w-4" /> Forfait Fixe
                                </button>
                            </div>

                            {commissionType === "percentage" ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-muted-foreground">Taux de commission</span>
                                        <span className="text-primary">{commissionRate.toFixed(2)} %</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        step="0.1"
                                        value={commissionRate}
                                        onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                        <span>1%</span>
                                        <span>10%</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-muted-foreground block">Montant Forfaitaire (€)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={fixedCommission}
                                            onChange={(e) => setFixedCommission(Number(e.target.value))}
                                            className="w-full bg-background border border-border rounded-lg py-3 px-4 text-foreground font-semibold font-data focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            step="1000"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-serif">€</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Faux divider for print */}
                    <div className="hidden print:block lg:col-span-12 h-px bg-black/20 my-2"></div>

                    {/* Right: Results / Output */}
                    <div className="lg:col-span-7 bg-background rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between print:col-span-12 print:border-black/20 print:shadow-none print:p-0 print:bg-transparent">

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest print:text-gray-500">Valeur Nette Vendeur Estimée</span>
                                <span className="font-data text-xl font-bold text-foreground print:text-black">{Math.round(valeurNetteEstimee).toLocaleString("fr-FR")} €</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-t border-border/50 print:border-black/20">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 print:text-gray-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground print:bg-gray-500"></span> Honoraires d&apos;Agence {commissionType === "percentage" ? `(${commissionRate}%)` : "(Forfait)"}
                                </span>
                                <span className="font-data text-xl font-bold text-foreground print:text-black">+ {honoraires.toLocaleString("fr-FR")} €</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-t border-border/50 print:border-black/20 opacity-50">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest print:text-gray-500">Prix Mathématique F.A.I</span>
                                <span className="font-data text-xl font-bold text-foreground print:text-black">{prixFaiBrut.toLocaleString("fr-FR")} €</span>
                            </div>
                        </div>

                        {/* Psychological Price Recommendation */}
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 print:border-black/40 print:bg-transparent">
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    <CheckCircle2 className="h-6 w-6 text-primary print:text-black" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="text-sm font-bold text-primary print:text-black">Positionnement Commercial Recommandé F.A.I</h4>
                                        <span className="font-data text-3xl font-black text-primary tracking-tight print:text-black">{prixFaiOptimise.toLocaleString("fr-FR")} <span className="text-xl font-serif italic text-primary/70 print:text-gray-600">€</span></span>
                                    </div>
                                    <p className="text-xs font-medium text-primary/80 leading-relaxed print:text-gray-700">
                                        Ce prix optimise votre visibilité sur les portails immobiliers en ciblant le seuil psychologique optimal.
                                        {impactSurNet < 0 && (
                                            <span className="block mt-2 font-bold bg-primary/10 px-2 py-1 rounded print:bg-transparent print:p-0">
                                                Ajustement induit sur le Net Vendeur : {Math.round(finalNetVendeur).toLocaleString("fr-FR")} € (soit {impactSurNet.toLocaleString("fr-FR")} €)
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
