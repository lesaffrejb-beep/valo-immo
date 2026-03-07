"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Loader2, X, ArrowRight, Building, Home, CheckCircle2, ShieldCheck } from "lucide-react";
import type { BanResult } from "@/lib/types";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet/dist/leaflet.css";

// Helper pour charger dynamiquement Leaflet uniquement côté client
const getTargetIcon = () => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return L.divIcon({
        className: "custom-target-icon",
        html: `<div class="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg border-2 border-background ring-4 ring-primary/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
};

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

interface MiniMapProps {
    lat: number;
    lon: number;
}
function MiniMap({ lat, lon }: MiniMapProps) {
    const center: [number, number] = [lat, lon];
    return (
        <div className="w-full h-48 rounded-xl overflow-hidden border border-border mt-4">
            <MapContainer
                center={center}
                zoom={16}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <ChangeView center={center} />
                {getTargetIcon() && <Marker position={center} icon={getTargetIcon() || undefined} />}
            </MapContainer>
        </div>
    );
}

interface SearchBarProps {
    onSelect: (result: BanResult & Record<string, unknown>) => void;
    isLoading?: boolean;
}

function titleCase(value: string): string {
    return value.toLowerCase().replace(/(^|\s|-|'|’)(\p{L})/gu, (m) => m.toUpperCase());
}

function formatSuggestionTitle(suggestion: BanResult): string {
    const streetPart = `${suggestion.housenumber ? `${suggestion.housenumber} ` : ""}${suggestion.street}`.trim();
    return `${titleCase(streetPart)}, ${suggestion.postcode} ${titleCase(suggestion.city)}`;
}

export default function SearchBar({ onSelect, isLoading = false }: SearchBarProps) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

    // Step 1: Address & Type
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<BanResult[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [selectedBan, setSelectedBan] = useState<BanResult | null>(null);
    const [typeBien, setTypeBien] = useState<'appartement' | 'maison' | null>(null);

    // Step 2: Specs
    const [surface, setSurface] = useState("");
    const [pieces, setPieces] = useState("");
    const [annee, setAnnee] = useState("");
    const [isCalculating, setIsCalculating] = useState(false);

    // Step 3: Modifiers
    const [dpe, setDpe] = useState<string | null>(null);
    const [pptVote, setPptVote] = useState<boolean | null>(null);
    // Modificateurs appartement (Step 3 conditionnel)
    const [etage, setEtage] = useState<"rdc" | "1-3" | "4-5" | "6+" | null>(null);
    const [ascenseur, setAscenseur] = useState<boolean | null>(null);
    const [vueDegagee, setVueDegagee] = useState<boolean | null>(null);


    // Step 4: Lead
    const [leadName, setLeadName] = useState("");
    const [leadEmail, setLeadEmail] = useState("");
    const [leadTel, setLeadTel] = useState("");

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const selectedRef = useRef<string>("");

    const fetchSuggestions = useCallback(async (q: string) => {
        const cleaned = q.trim();
        if (cleaned.length < 3 || cleaned === selectedRef.current) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }
        setIsFetching(true);
        try {
            const res = await fetch(`/api/geocode?q=${encodeURIComponent(cleaned)}&limit=6`);
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
                setSuggestions(json.data);
                setIsOpen(json.data.length > 0);
                setActiveIndex(-1);
            }
        } catch {
            setSuggestions([]);
        } finally {
            setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(query), 280);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, fetchSuggestions]);

    const handleSelectBan = (result: BanResult) => {
        const formatted = formatSuggestionTitle(result);
        selectedRef.current = formatted;
        setQuery(formatted);
        setSelectedBan(result);
        setSuggestions([]);
        setIsOpen(false);
    };

    const nextStep = () => setStep((s) => Math.min(s + 1, 4) as 1 | 2 | 3 | 4);

    const handleStep2Submit = () => {
        if (!surface || !pieces || !annee) return;
        setIsCalculating(true);
        setTimeout(() => {
            setIsCalculating(false);
            nextStep();
        }, 1500);
    };

    const handleFinalSubmit = () => {
        if (!leadName || !leadEmail) return;
        if (selectedBan) {
            onSelect({
                ...selectedBan,
                typeBien,
                surface: parseInt(surface),
                pieces: parseInt(pieces),
                annee: parseInt(annee),
                dpe,
                pptVote,
                etage,
                ascenseur,
                vueDegagee,
                lead: { name: leadName, email: leadEmail, tel: leadTel }
            });
        }
    };

    // --- RENDER STEPS ---
    if (step === 1) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in-up">
                <div
                    className={`flex items-center gap-3 rounded-2xl px-5 py-4 bg-card border-2 border-border transition-all duration-200 shadow-sm focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--color-primary)]/10 relative`}
                >
                    {isFetching ? <Loader2 className="h-6 w-6 text-primary shrink-0 animate-spin" /> : <Search className="h-6 w-6 text-muted-foreground shrink-0" />}
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            selectedRef.current = "";
                            setQuery(e.target.value);
                            setSelectedBan(null);
                        }}
                        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                        placeholder="Ex: 20 rue Dupetit Thouars 49000 Angers"
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-lg font-medium outline-none"
                    />
                    {query.length > 0 && (
                        <button onClick={() => { setQuery(""); setSelectedBan(null); }} className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted outline-none">
                            <X className="h-5 w-5" />
                        </button>
                    )}

                    {isOpen && suggestions.length > 0 && (
                        <ul className="absolute z-50 top-full left-0 mt-2 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden text-left">
                            {suggestions.map((s, i) => (
                                <li key={s.id} onMouseDown={() => handleSelectBan(s)} className={`flex items-start px-5 py-3 cursor-pointer hover:bg-muted/50 ${i > 0 ? "border-t border-border" : ""}`}>
                                    <div className="flex flex-col min-w-0 w-full pl-9 relative">
                                        <MapPin className="h-5 w-5 mt-0.5 text-primary absolute left-0 top-0" />
                                        <span className="text-base font-semibold text-foreground truncate">{formatSuggestionTitle(s)}</span>
                                        <span className="text-sm font-medium text-muted-foreground mt-0.5 truncate">{s.context}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {selectedBan && (
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm animate-fade-in-up">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-serif">Confirmation de localisation</h3>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold uppercase">Géocodé</span>
                        </div>
                        <MiniMap lat={selectedBan.lat} lon={selectedBan.lon} />

                        <div className="space-y-4">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-center">Type de bien</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setTypeBien('appartement')}
                                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all ${typeBien === 'appartement' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-transparent text-muted-foreground hover:border-primary/50'}`}
                                >
                                    <Building className="h-8 w-8" />
                                    <span className="font-bold">Appartement</span>
                                </button>
                                <button
                                    onClick={() => setTypeBien('maison')}
                                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all ${typeBien === 'maison' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-transparent text-muted-foreground hover:border-primary/50'}`}
                                >
                                    <Home className="h-8 w-8" />
                                    <span className="font-bold">Maison</span>
                                </button>
                            </div>
                        </div>

                        {typeBien && (
                            <button onClick={nextStep} className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-4 rounded-xl font-bold hover:bg-foreground/90 transition-all">
                                Continuer l'évaluation <ArrowRight className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in-up">
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
                        <h3 className="text-2xl font-serif">Caractéristiques du bien</h3>
                        <span className="text-sm font-bold text-muted-foreground">Étape 2/4</span>
                    </div>

                    {isCalculating ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-6">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="text-lg font-medium text-foreground text-center">Interrogation de la base DVF en cours...</p>
                            <div className="w-full max-w-sm h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-2/3 animate-pulse rounded-full"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Surface Habitable (m²)</label>
                                    <input type="number" value={surface} onChange={e => setSurface(e.target.value)} placeholder="Ex: 85" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Nombre de pièces</label>
                                    <input type="number" value={pieces} onChange={e => setPieces(e.target.value)} placeholder="Ex: 4" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Année de construction</label>
                                    <input type="number" value={annee} onChange={e => setAnnee(e.target.value)} placeholder="Ex: 1998" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                                </div>
                            </div>
                            <button
                                disabled={!surface || !pieces || !annee}
                                onClick={handleStep2Submit}
                                className="w-full mt-6 flex items-center justify-center gap-2 bg-foreground text-background py-4 rounded-xl font-bold hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Analyser le micro-marché <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (step === 3) {
        const isOldAppartment = typeBien === 'appartement' && parseInt(annee) <= 2011;
        const dpes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in-up">
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
                        <h3 className="text-2xl font-serif">Variables d'ajustement</h3>
                        <span className="text-sm font-bold text-muted-foreground">Étape 3/4</span>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Critique : Diagnostic Énergétique</label>
                            <div className="flex flex-wrap gap-2">
                                {dpes.map(letter => (
                                    <button
                                        key={letter}
                                        onClick={() => setDpe(letter)}
                                        className={`w-12 h-12 rounded-xl font-bold text-lg transition-all border-2 ${dpe === letter ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}
                                    >
                                        {letter}
                                    </button>
                                ))}
                            </div>
                            {dpe && ['E', 'F', 'G'].includes(dpe) && (
                                <p className="text-xs font-semibold text-destructive mt-2 inline-flex items-center gap-1 bg-destructive/10 px-2 py-1 rounded">
                                    Une décote travaux sera modélisée par le moteur.
                                </p>
                            )}
                        </div>

                        {isOldAppartment && (
                            <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-primary/5 relative">
                                <ShieldCheck className="absolute top-4 right-4 h-6 w-6 text-primary/40" />
                                <label className="text-sm font-bold text-primary uppercase tracking-wider">Risque Loi Climat (Copropriété)</label>
                                <p className="text-sm text-muted-foreground">Votre copropriété a plus de 15 ans. Le Plan Pluriannuel de Travaux (PPT) a-t-il été acté en AG ?</p>
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <button onClick={() => setPptVote(true)} className={`py-3 rounded-lg border-2 font-bold transition-colors ${pptVote === true ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary/30'}`}>Oui, provisionné</button>
                                    <button onClick={() => setPptVote(false)} className={`py-3 rounded-lg border-2 font-bold transition-colors ${pptVote === false ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-border bg-background text-foreground hover:border-destructive/30'}`}>Non ou insuffisant</button>
                                </div>
                            </div>
                        )}

                        {/* Modificateurs Copropriété — Appartement uniquement */}
                        {typeBien === 'appartement' && (
                            <div className="space-y-6 p-5 rounded-xl border border-border bg-background">
                                <p className="text-sm font-bold text-foreground uppercase tracking-wider">Caractéristiques de copropriété</p>

                                {/* Étage */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Étage du bien</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {([
                                            { key: 'rdc', label: 'RDC' },
                                            { key: '1-3', label: '1-3ᵉ' },
                                            { key: '4-5', label: '4-5ᵉ' },
                                            { key: '6+', label: '6+' },
                                        ] as const).map(({ key, label }) => (
                                            <button
                                                key={key}
                                                onClick={() => setEtage(key)}
                                                className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${etage === key
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border bg-transparent text-muted-foreground hover:border-primary/40'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Ascenseur */}
                                {etage && etage !== 'rdc' && (
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Ascenseur</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setAscenseur(true)}
                                                className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${ascenseur === true
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border bg-transparent text-muted-foreground hover:border-primary/40'
                                                    }`}
                                            >
                                                Oui
                                            </button>
                                            <button
                                                onClick={() => setAscenseur(false)}
                                                className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${ascenseur === false
                                                    ? 'border-destructive bg-destructive/10 text-destructive'
                                                    : 'border-border bg-transparent text-muted-foreground hover:border-destructive/30'
                                                    }`}
                                            >
                                                Non
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Vue dégagée */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Vue dégagée ou intéressante</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setVueDegagee(true)}
                                            className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${vueDegagee === true
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border bg-transparent text-muted-foreground hover:border-primary/40'
                                                }`}
                                        >
                                            Oui
                                        </button>
                                        <button
                                            onClick={() => setVueDegagee(false)}
                                            className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${vueDegagee === false
                                                ? 'border-border bg-muted text-muted-foreground'
                                                : 'border-border bg-transparent text-muted-foreground hover:border-primary/40'
                                                }`}
                                        >
                                            Non / Standard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            disabled={!dpe || (isOldAppartment && pptVote === null) || (typeBien === 'appartement' && (!etage || (etage !== 'rdc' && ascenseur === null) || vueDegagee === null))}
                            onClick={nextStep}
                            className="w-full mt-6 flex items-center justify-center gap-2 bg-foreground text-background py-4 rounded-xl font-bold hover:bg-foreground/90 disabled:opacity-50 transition-all"
                        >
                            Verrouiller les paramètres <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 4) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in-up">
                <div className="bg-card border-2 border-primary/30 rounded-2xl p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-primary/40 via-primary to-primary/40"></div>

                    <div className="text-center mb-8 space-y-4">
                        <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                        <h3 className="text-3xl font-serif">Modélisation prête</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            L'algorithme a traité la parcelle, les nuisances et le DVF. Où devons-nous envoyer le rapport SHAP d'expertise financière ?
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nom complet</label>
                            <input type="text" value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="Jean Dupont" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-base focus:border-primary outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email (pour le PDF privé)</label>
                            <input type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} placeholder="jean@example.com" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-base focus:border-primary outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Téléphone (Optionnel)</label>
                            <input type="tel" value={leadTel} onChange={e => setLeadTel(e.target.value)} placeholder="06 12 34 56 78" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-base focus:border-primary outline-none" />
                        </div>

                        <button
                            disabled={!leadName || !leadEmail || isLoading}
                            onClick={handleFinalSubmit}
                            className="w-full mt-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-xl font-black text-lg hover:brightness-110 disabled:opacity-50 transition-all shadow-lg hover:shadow-primary/25"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : "Générer le rapport & Prix"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
