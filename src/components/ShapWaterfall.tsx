"use client";

import { useMemo } from "react";
import type { ShapAnalysis } from "@/lib/types";
import { ArrowDownRight, ArrowUpRight, Minus, TrendingUp } from "lucide-react";

export default function ShapWaterfall({ analysis }: { analysis: ShapAnalysis }) {
    // Generate waterfall steps based on exact values
    const steps = useMemo(() => {
        let currentTotal = analysis.prix_base;
        const result = [];

        // Base
        result.push({
            id: 'base',
            description: "Prix de base (Surface x Prix médian du secteur)",
            value: analysis.prix_base,
            isTotal: true,
            runningTotal: currentTotal
        });

        // Modifiers
        analysis.explications_shap.forEach(exp => {
            currentTotal += exp.impact_value;
            result.push({
                id: exp.feature,
                description: exp.description,
                value: exp.impact_value,
                isTotal: false,
                runningTotal: currentTotal
            });
        });

        // Final
        result.push({
            id: 'final',
            description: "Estimation Financière Nette Vendeur",
            value: analysis.prix_estime,
            isTotal: true,
            runningTotal: analysis.prix_estime
        });

        return result;
    }, [analysis]);

    // Find min and max for scaling the waterfall visually
    const minValue = Math.min(...steps.map(s => s.runningTotal - Math.abs(s.value)), analysis.prix_base * 0.8);
    const maxValue = Math.max(...steps.map(s => s.runningTotal + Math.abs(s.value)), analysis.prix_estime * 1.1);
    const range = maxValue - minValue;

    return (
        <div className="w-full bg-card border-2 border-primary/20 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="bg-primary/10 text-primary p-3 rounded-2xl">
                    <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-2xl font-serif text-foreground">Analyse Financière Experte</h3>
                    <p className="text-sm font-medium text-muted-foreground">Méthode XGBoost & Explicabilité SHAP</p>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {steps.map((step, idx) => {
                    const isPositive = step.value > 0;
                    const isNegative = step.value < 0;

                    // Simple visual width for MVP (better math needed for real waterfall)
                    const prevTotal = idx === 0 ? 0 : steps[idx - 1].runningTotal;

                    // Bar calculations
                    const leftPct = step.isTotal ? 0 : Math.max(0, ((Math.min(prevTotal, step.runningTotal) - minValue) / range) * 100);
                    const widthPct = step.isTotal ? Math.max(0, ((step.value - minValue) / range) * 100) : Math.max(2, (Math.abs(step.value) / range) * 100);

                    return (
                        <div key={idx} className={`flex flex-col gap-1 py-3 ${!step.isTotal && 'border-l-2 border-border/50 pl-4 ml-2'}`}>
                            <div className="flex justify-between items-end mb-1">
                                <span className={`text-sm ${step.isTotal ? 'font-black text-foreground uppercase tracking-widest' : 'font-semibold text-muted-foreground'}`}>
                                    {step.description}
                                </span>
                                <span className={`text-base font-data font-bold ${step.isTotal ? 'text-primary text-xl' : (isPositive ? 'text-emerald-500' : 'text-destructive')
                                    }`}>
                                    {step.isTotal ? '' : (isPositive ? '+' : '')}{step.value.toLocaleString("fr-FR")} €
                                </span>
                            </div>

                            {/* Waterfall Bar Visual */}
                            <div className="h-8 w-full bg-muted/30 rounded-full relative overflow-hidden">
                                <div
                                    className={`absolute top-0 h-full rounded-full transition-all duration-1000 ease-out ${step.isTotal ? 'bg-primary/20 border-2 border-primary/40' :
                                            isPositive ? 'bg-emerald-500/20 border-2 border-emerald-500/50' :
                                                'bg-destructive/20 border-2 border-destructive/50'
                                        }`}
                                    style={{
                                        left: step.isTotal ? 0 : `${leftPct}%`,
                                        width: `${Math.max(widthPct, 1)}%`
                                    }}
                                >
                                    {!step.isTotal && (
                                        <div className="w-full h-full flex items-center justify-center p-1">
                                            {isPositive ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 pt-6 border-t border-border flex justify-between items-center relative z-10">
                <span className="text-sm font-medium text-muted-foreground">Fourchette de négociation estimée</span>
                <span className="text-lg font-data font-black text-foreground">
                    {analysis.intervalle_min.toLocaleString("fr-FR")} € - {analysis.intervalle_max.toLocaleString("fr-FR")} €
                </span>
            </div>
        </div>
    );
}
