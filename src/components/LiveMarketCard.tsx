"use client";

import { useState, useCallback } from "react";
import { Globe, TrendingUp, CircleDot, RefreshCw, Lock, Sparkles } from "lucide-react";
import type { LiveMarketSnapshot } from "@/lib/types";

// ─── Feature Flag ──────────────────────────────────────────────────────────
// Synchronisé avec LIVE_SCRAPING_ENABLED dans live-market.ts
// Mettre à false pour désactiver l'overlay V2 quand le scraping réel est actif.
const LIVE_TEASER_MODE = true;

// ─── Badge DPE ─────────────────────────────────────────────────────────────

const DPE_STYLES: Record<string, string> = {
    A: "bg-[#00a14b] text-white",
    B: "bg-[#4caf50] text-white",
    C: "bg-[#8bc34a] text-white",
    D: "bg-[#ffc107] text-black",
    E: "bg-[#ff9800] text-white",
    F: "bg-[#f44336] text-white",
    G: "bg-[#b71c1c] text-white",
};

function DpeBadge({ letter, label }: { letter: string | null; label?: string }) {
    if (!letter) return null;
    const style = DPE_STYLES[letter.toUpperCase()] ?? "bg-muted text-muted-foreground";
    return (
        <span
            className={`inline-flex items-center justify-center h-5 min-w-5 px-1 rounded text-[10px] font-black tracking-wide ${style}`}
            title={label ? `${label} : ${letter}` : `DPE ${letter}`}
        >
            {letter}
        </span>
    );
}

function DaysOnMarketBadge({ days }: { days: number | null }) {
    if (days === null) return null;
    const color =
        days < 30 ? "text-green-600 dark:text-green-400"
            : days < 60 ? "text-amber-600 dark:text-amber-400"
                : "text-red-500 dark:text-red-400";
    return (
        <span className={`text-xs font-semibold ${color}`} title="Délai de mise en ligne">
            {days}j en ligne
        </span>
    );
}

// ─── Overlay Teaser V2 ──────────────────────────────────────────────────────

function TeaserOverlay() {
    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl overflow-hidden backdrop-blur-sm bg-card/60">
            <div className="text-center px-6 py-5 space-y-3 max-w-xs">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                    <Lock className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-black tracking-tight text-foreground">
                    Disponible en V2
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Les annonces actives en temps réel (LeBonCoin / SeLoger) seront disponibles dans la prochaine version premium.
                </p>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                    <Sparkles className="h-3 w-3" />
                    Sur demande
                </span>
            </div>
        </div>
    );
}

// ─── Composant principal ────────────────────────────────────────────────────

export default function LiveMarketCard({
    liveMarket: initialSnapshot,
    dvfMedianPriceM2,
    lat,
    lon,
}: {
    liveMarket: LiveMarketSnapshot;
    dvfMedianPriceM2: number;
    lat: number;
    lon: number;
}) {
    const [snapshot, setSnapshot] = useState(initialSnapshot);
    const [refreshing, setRefreshing] = useState(false);

    const showTeaser = LIVE_TEASER_MODE && snapshot.is_demo;

    const topListings = [...snapshot.listings]
        .sort((a, b) => (a.distance_m ?? Number.MAX_SAFE_INTEGER) - (b.distance_m ?? Number.MAX_SAFE_INTEGER))
        .slice(0, 5);

    const handleRefresh = useCallback(async () => {
        if (showTeaser) return;
        setRefreshing(true);
        try {
            const res = await fetch(`/api/live-market?lat=${lat}&lon=${lon}&radius=${snapshot.radius_m}`);
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) setSnapshot(json.data as LiveMarketSnapshot);
            }
        } catch {
            // silencieux
        } finally {
            setRefreshing(false);
        }
    }, [lat, lon, snapshot.radius_m, showTeaser]);

    const livePriceM2 = snapshot.summary.median_price_m2;
    const deltaM2 = livePriceM2 && dvfMedianPriceM2 ? livePriceM2 - dvfMedianPriceM2 : null;
    const deltaPct = deltaM2 && dvfMedianPriceM2 ? ((deltaM2 / dvfMedianPriceM2) * 100).toFixed(1) : null;

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border bg-muted/30">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-foreground tracking-tight">
                                Marché Actif — À vendre maintenant
                            </h3>
                            {showTeaser ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                                    <Sparkles className="h-3 w-3" />
                                    V2
                                </span>
                            ) : snapshot.source_cache ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60 px-2 py-0.5 rounded-full border border-primary/20">
                                    Cache
                                </span>
                            ) : null}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mt-0.5">
                            DVF (passé) :{" "}
                            <span className="text-foreground font-bold">
                                {Math.round(dvfMedianPriceM2).toLocaleString("fr-FR")} €/m²
                            </span>
                            {!showTeaser && deltaM2 !== null && deltaPct !== null && (
                                <>
                                    {" · "}Marché actif :{" "}
                                    <span
                                        className={`font-bold ${deltaM2 > 0 ? "text-red-500" : "text-green-600 dark:text-green-400"}`}
                                    >
                                        {deltaM2 > 0 ? "+" : ""}
                                        {deltaM2.toLocaleString("fr-FR")} €/m² ({deltaM2 > 0 ? "+" : ""}
                                        {deltaPct}%)
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                    {!showTeaser && (
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="shrink-0 p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                            title="Actualiser les annonces actives"
                            aria-label="Actualiser les annonces actives"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-4">
                {/* Métriques résumées — toujours visibles */}
                <div className="grid sm:grid-cols-4 gap-3">
                    <Metric label="Annonces actives" value={showTeaser ? "12+" : String(snapshot.summary.count)} />
                    <Metric
                        label="Prix médian actif"
                        value={showTeaser
                            ? "••• €"
                            : snapshot.summary.median_price
                                ? `${snapshot.summary.median_price.toLocaleString("fr-FR")} €`
                                : "N/C"}
                    />
                    <Metric
                        label="Prix médian /m²"
                        value={showTeaser
                            ? "•••• €/m²"
                            : snapshot.summary.median_price_m2
                                ? `${snapshot.summary.median_price_m2.toLocaleString("fr-FR")} €/m²`
                                : "N/C"}
                    />
                    <Metric
                        label="Délai médian"
                        value={showTeaser
                            ? "•• jours"
                            : snapshot.summary.avg_days_on_market !== null
                                ? `${snapshot.summary.avg_days_on_market} jours`
                                : "N/C"}
                    />
                </div>

                {/* Listings — floutés si teaser, normaux sinon */}
                <div className="relative">
                    {showTeaser && <TeaserOverlay />}
                    <div className={showTeaser ? "select-none" : ""}>
                        {topListings.length > 0 ? (
                            <div className="space-y-2.5">
                                {topListings.map((listing) => (
                                    <a
                                        key={listing.id}
                                        href={showTeaser ? undefined : listing.url}
                                        target={showTeaser ? undefined : "_blank"}
                                        rel="noreferrer noopener"
                                        className={`block rounded-xl border border-border px-4 py-3 transition-colors group ${showTeaser ? "cursor-default" : "hover:border-primary/40 hover:bg-primary/5"}`}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <p className={`font-semibold text-sm flex-1 min-w-0 pr-2 ${showTeaser ? "blur-sm text-foreground" : "text-foreground"}`}>
                                                {listing.title}
                                            </p>
                                            <span className={`text-sm font-black text-primary shrink-0 ${showTeaser ? "blur-sm" : ""}`}>
                                                {listing.price.toLocaleString("fr-FR")} €
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2 items-center">
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground capitalize ${showTeaser ? "blur-[2px]" : ""}`}>
                                                <CircleDot className="h-3.5 w-3.5" />
                                                {listing.source}
                                            </span>
                                            {listing.surface_m2 && (
                                                <span className={`text-[11px] font-medium text-muted-foreground ${showTeaser ? "blur-[2px]" : ""}`}>
                                                    {listing.surface_m2} m²
                                                </span>
                                            )}
                                            {listing.distance_m ? (
                                                <span className={`text-[11px] font-medium text-muted-foreground ${showTeaser ? "blur-[2px]" : ""}`}>
                                                    à {listing.distance_m} m
                                                </span>
                                            ) : null}
                                            {listing.price_m2 && (
                                                <span className={`text-[11px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded ${showTeaser ? "blur-sm" : "group-hover:bg-primary/10 transition-colors"}`}>
                                                    {listing.price_m2.toLocaleString("fr-FR")} €/m²
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1">
                                                <DpeBadge letter={listing.dpe_letter} label="DPE" />
                                                <DpeBadge letter={listing.ges_letter} label="GES" />
                                            </span>
                                            <DaysOnMarketBadge days={listing.days_on_market} />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm font-medium text-muted-foreground py-4 text-center">
                                Aucune annonce active trouvée dans le rayon de {snapshot.radius_m} m.
                            </p>
                        )}
                    </div>
                </div>

                {/* Script de rendez-vous */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>
                        <span className="font-bold">Script RDV :</span>{" "}
                        {showTeaser
                            ? "« Le DVF certifie le passé. En V2, TrueSquare croisera en temps réel les annonces actives de LeBonCoin et SeLoger pour certifier le présent — et vous donner un argument béton face aux vendeurs. »"
                            : `« Le DVF certifie le passé, ces ${snapshot.summary.count} annonces actives certifient le présent.
                            ${deltaM2 !== null && deltaM2 > 0
                                ? ` Le marché de présentation est actuellement ${Math.abs(deltaM2).toLocaleString("fr-FR")} €/m² au-dessus des ventes actées — un argument pour pitcher une position légèrement en dessous.`
                                : deltaM2 !== null && deltaM2 < 0
                                    ? ` Le marché de présentation est actuellement en retrait de ${Math.abs(deltaM2).toLocaleString("fr-FR")} €/m² vs les ventes passées — position à discuter.`
                                    : " Fixons un prix de présentation juste en dessous du haut du marché actif."}
                            »`
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Sous-composant Metric ──────────────────────────────────────────────────

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-base font-black text-foreground mt-1">{value}</p>
        </div>
    );
}
