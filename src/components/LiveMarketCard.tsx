import { Globe, TrendingUp, CircleDot } from "lucide-react";
import type { LiveMarketSnapshot } from "@/lib/types";

export default function LiveMarketCard({
    liveMarket,
    dvfMedianPriceM2,
}: {
    liveMarket: LiveMarketSnapshot;
    dvfMedianPriceM2: number;
}) {
    const topListings = [...liveMarket.listings]
        .sort((a, b) => (a.distance_m ?? Number.MAX_SAFE_INTEGER) - (b.distance_m ?? Number.MAX_SAFE_INTEGER))
        .slice(0, 3);

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/30">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-foreground tracking-tight">Live Scraping Concurrents — À vendre maintenant</h3>
                        <p className="text-sm font-medium text-muted-foreground mt-0.5">
                            Le DVF (passé) indique <span className="text-foreground font-bold">{Math.round(dvfMedianPriceM2).toLocaleString("fr-FR")} €/m²</span>,
                            mais le marché actif (présent) montre {topListings.length} biens comparables à positionner.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                    <Metric label="Annonces actives" value={String(liveMarket.summary.count)} />
                    <Metric
                        label="Prix médian actif"
                        value={liveMarket.summary.median_price ? `${liveMarket.summary.median_price.toLocaleString("fr-FR")} €` : "N/C"}
                    />
                    <Metric
                        label="Prix médian actif /m²"
                        value={liveMarket.summary.median_price_m2 ? `${liveMarket.summary.median_price_m2.toLocaleString("fr-FR")} €/m²` : "N/C"}
                    />
                </div>

                {topListings.length > 0 ? (
                    <div className="space-y-3">
                        {topListings.map((listing) => (
                            <a
                                key={listing.id}
                                href={listing.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-xl border border-border px-4 py-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-semibold text-foreground">{listing.title}</p>
                                    <span className="text-sm font-black text-primary">{listing.price.toLocaleString("fr-FR")} €</span>
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-3 items-center font-medium">
                                    <span className="inline-flex items-center gap-1"><CircleDot className="h-3.5 w-3.5" /> {listing.source}</span>
                                    {listing.surface_m2 && <span>{listing.surface_m2} m²</span>}
                                    {listing.rooms && <span>{listing.rooms} pièces</span>}
                                    {listing.distance_m && <span>à {listing.distance_m} m</span>}
                                    {listing.price_m2 && <span className="text-primary font-bold">{listing.price_m2.toLocaleString("fr-FR")} €/m²</span>}
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm font-medium text-muted-foreground">Aucune annonce active n&apos;a été trouvée dans le rayon paramétré.</p>
                )}

                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>
                        Script de rendez-vous : « Le DVF confirme le passé, et ces annonces actives confirment le présent. On se positionne juste en dessous du haut du marché actif pour maximiser la conversion. »
                    </p>
                </div>
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-lg font-black text-foreground mt-1">{value}</p>
        </div>
    );
}
