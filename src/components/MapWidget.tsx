"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { EstimationResult } from "@/lib/types";

// Fix default icon issue with Leaflet in Next.js
delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Create custom DivIcon for the target property
const TargetIcon = L.divIcon({
    className: "custom-target-icon",
    html: `<div class="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg border-2 border-background ring-4 ring-primary/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

// Create custom DivIcon for DVF transactions
const createDvfIcon = (isExcluded: boolean, isBuilding: boolean) => {
    return L.divIcon({
        className: "custom-dvf-icon",
        html: `<div class="w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 ${isExcluded ? 'bg-muted border-border text-muted-foreground opacity-50' : 'bg-background border-primary text-primary'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${isBuilding ? '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>' : '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'}</svg>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
    });
};

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function MapWidget({ result, excludedIds, onToggleExclusion }: { result: EstimationResult, excludedIds?: Set<string>, onToggleExclusion?: (id: string) => void }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const targetCenter: [number, number] = [result.ban.lat, result.ban.lon];

    if (!mounted) {
        return (
            <div className="w-full h-[400px] rounded-2xl bg-muted/30 animate-pulse border border-border flex items-center justify-center">
                <p className="text-sm font-medium text-muted-foreground">Chargement de la carte...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-border bg-card shadow-sm relative z-0">
            <MapContainer
                center={targetCenter}
                zoom={16}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
            >
                {/* CartoDB Positron for a clean, light, elegant aesthetic */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <ChangeView center={targetCenter} />

                {/* Target Property Marker */}
                <Marker position={targetCenter} icon={TargetIcon}>
                    <Popup className="premium-popup">
                        <div className="text-center pb-1">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Bien Cible</p>
                            <p className="font-semibold text-foreground text-sm">{result.ban.label}</p>
                        </div>
                    </Popup>
                </Marker>

                {/* DVF Transactions Markers */}
                {result.transactions.map((tx) => {
                    const txId = tx.mutation.id_mutation || `${tx.mutation.date_mutation}_${tx.mutation.valeur_fonciere}`;
                    const isExcluded = excludedIds?.has(txId) ?? false;
                    const isBuilding = tx.mutation.type_local?.toLowerCase() === "appartement";

                    const prixM2 = tx.mutation.surface_reelle_bati
                        ? Math.round(tx.mutation.valeur_fonciere / tx.mutation.surface_reelle_bati)
                        : null;

                    return (
                        <Marker
                            key={txId}
                            position={[tx.mutation.latitude, tx.mutation.longitude]}
                            icon={createDvfIcon(isExcluded, isBuilding)}
                        >
                            <Popup className="premium-popup">
                                <div className="space-y-3 min-w-[200px]">
                                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{tx.mutation.type_local}</span>
                                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                            {new Date(tx.mutation.date_mutation).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                                        </span>
                                    </div>

                                    <div className="flex items-baseline justify-between">
                                        <span className="text-xs text-muted-foreground">Surface</span>
                                        <span className="text-sm font-semibold text-foreground">{tx.mutation.surface_reelle_bati} m²</span>
                                    </div>

                                    <div className="flex items-baseline justify-between">
                                        <span className="text-xs text-muted-foreground">Net Vendeur</span>
                                        <span className="text-sm font-semibold text-foreground">
                                            {tx.mutation.valeur_fonciere.toLocaleString("fr-FR")} €
                                        </span>
                                    </div>

                                    {prixM2 && (
                                        <div className="pt-2 mt-2 border-t border-border flex items-baseline justify-between">
                                            <span className="text-[11px] uppercase font-bold text-primary tracking-wider">Mètre carré</span>
                                            <span className="text-base font-data font-black text-primary">{prixM2.toLocaleString("fr-FR")} €/m²</span>
                                        </div>
                                    )}

                                    {onToggleExclusion && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleExclusion(txId);
                                            }}
                                            className={`w-full mt-3 py-1.5 rounded-md text-xs font-bold transition-colors ${isExcluded
                                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                : "bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-background"
                                                }`}
                                        >
                                            {isExcluded ? "Ré-inclure au calcul" : "Exclure l'anomalie"}
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-[400] bg-background/90 backdrop-blur-sm border border-border p-3 rounded-xl shadow-lg flex flex-col gap-2 pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary border-2 border-background ring-2 ring-primary/20"></div>
                    <span className="text-[11px] font-semibold text-foreground">Bien estimé</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-background border-2 border-primary"></div>
                    <span className="text-[11px] font-medium text-foreground">Transaction retenue</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-muted border-2 border-border opacity-50"></div>
                    <span className="text-[11px] font-medium text-muted-foreground">Transaction exclue</span>
                </div>
            </div>
        </div >
    );
}
