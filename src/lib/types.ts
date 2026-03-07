/* ─── BAN (Base Adresse Nationale) ─── */
export interface BanResult {
    label: string;
    id: string; // e.g. "49007_5050_00015"
    banId: string;
    housenumber: string;
    street: string;
    postcode: string;
    citycode: string; // code INSEE commune
    city: string;
    context: string;
    lon: number;
    lat: number;
    score: number;
    type: "housenumber" | "street" | "municipality" | "locality";
}

/* ─── DVF (Demande de Valeurs Foncières) ─── */
export interface DvfMutation {
    id_mutation: string;
    date_mutation: string;
    nature_mutation: string;
    valeur_fonciere: number;
    code_postal: string;
    code_commune: string;
    nom_commune: string;
    code_type_local: number; // 1=Maison, 2=Appart, 3=Dépendance, 4=Commercial
    type_local: string;
    surface_reelle_bati: number;
    nombre_pieces_principales: number;
    surface_terrain: number;
    adresse_nom_voie: string;
    adresse_numero: string;
    longitude: number;
    latitude: number;
}

/* ─── DPE (Diagnostic de Performance Énergétique) ─── */
export interface DpeResult {
    numero_dpe: string;
    date_etablissement_dpe: string;
    identifiant_ban: string;
    surface_habitable_logement: number;
    etiquette_dpe: string; // A-G
    etiquette_ges: string; // A-G
    annee_construction: number;
    type_batiment: string;
    adresse_complete: string;
    code_postal: string;
    nom_commune: string;
}

/* ─── Calculation Engine ─── */
export interface WeightedSurface {
    surface_habitable: number;
    surface_annexes_brute: number;
    surface_annexes_ponderee: number;
    surface_totale_ponderee: number;
    source: "dpe" | "dvf_fallback";
}

export interface TransactionAnalysis {
    mutation: DvfMutation;
    prix_m2_naif: number;
    prix_m2_corrige: number;
    delta_pct: number;
    valeur_corrigee: number;
    weighted_surface: WeightedSurface;
    has_dpe: boolean;
}

export interface ShapValue {
    feature: string;
    impact_value: number;
    description: string;
}

export interface ShapAnalysis {
    prix_base: number;
    prix_estime: number;
    intervalle_min: number;
    intervalle_max: number;
    explications_shap: ShapValue[];
}

export interface EstimationResult {
    adresse: string;
    ban: BanResult;
    dpe: DpeResult | null;
    transactions: TransactionAnalysis[];
    synthese: {
        prix_m2_naif_median: number;
        prix_m2_corrige_median: number;
        delta_median_pct: number;
        nb_transactions: number;
        surface_reference: number;
        confiance: number; // 0–1
        quality: {
            stale_data: boolean;
            sample_size_ok: boolean;
            has_dpe: boolean;
        };
    };
    neighborhood?: NeighborhoodScore;
    warnings?: string[];
    shap_analysis?: ShapAnalysis;
}

export interface NeighborhoodAmenity {
    category: "transport" | "schools" | "food";
    label: string;
    distance_m: number;
}

export interface NeighborhoodCategoryScore {
    score: number; // 0-10
    within_5_min: number;
    within_10_min: number;
    nearest_m: number | null;
}

export interface NeighborhoodScore {
    global_score: number; // 0-10
    walk_radius_m: number;
    generated_at: string;
    categories: {
        transport: NeighborhoodCategoryScore;
        schools: NeighborhoodCategoryScore;
        food: NeighborhoodCategoryScore;
    };
    top_amenities: NeighborhoodAmenity[];
}

/* ─── API Response Wrappers ─── */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
