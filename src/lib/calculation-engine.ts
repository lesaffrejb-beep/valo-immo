import type {
    DvfMutation,
    DpeResult,
    TransactionAnalysis,
    WeightedSurface,
} from "./types";

/* ─── Coefficients de Pondération ─── */
const WEIGHTS = {
    balcon: 0.25,
    terrasse: 0.20,
    cave: 0.15,
    grenier: 0.30,
    garage_forfait: 15000, // € — valeur forfaitaire déduite
} as const;

/* ─── Helpers ─── */

/** Median of a numeric array */
function median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

/** Round to 2 decimal places */
function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

/** Detect if a DVF mutation line is a garage/parking */
function isGarage(mutation: DvfMutation): boolean {
    return (
        mutation.code_type_local === 3 &&
        (mutation.type_local || "").toLowerCase().includes("dépendance")
    );
}

/* ─── Core Engine ─── */

/**
 * Analyse une transaction DVF en croisant avec les données DPE.
 * 
 * @param principal - Le lot principal (maison / appartement)
 * @param dependances - Les lots dépendants de la même mutation
 * @param dpe - Le DPE associé (null si non trouvé)
 */
export function analyzeTransaction(
    principal: DvfMutation,
    dependances: DvfMutation[],
    dpe: DpeResult | null
): TransactionAnalysis {
    // 1. Surface de référence
    const surfaceHabitable = dpe
        ? dpe.surface_habitable_logement
        : principal.surface_reelle_bati;

    const source: WeightedSurface["source"] = dpe ? "dpe" : "dvf_fallback";

    // 2. Déduire les garages de la valeur foncière
    const nbGarages = dependances.filter(isGarage).length;
    const deductionGarage = nbGarages * WEIGHTS.garage_forfait;
    const valeurCorrigee = Math.max(
        principal.valeur_fonciere - deductionGarage,
        principal.valeur_fonciere * 0.7 // ne jamais déduire plus de 30%
    );

    // 3. Surface annexes pondérée (hors garages)
    const annexesSurface = dependances
        .filter((d) => !isGarage(d))
        .reduce((sum, d) => sum + (d.surface_reelle_bati || 0), 0);

    // Pondération moyenne pour les annexes non-qualifiées
    const surfaceAnnexesPonderee = annexesSurface * WEIGHTS.cave;

    // 4. Surface totale pondérée
    const surfaceTotalePonderee = surfaceHabitable + surfaceAnnexesPonderee;

    // 5. Prix au m²
    const prixNaif =
        principal.surface_reelle_bati > 0
            ? round2(principal.valeur_fonciere / principal.surface_reelle_bati)
            : 0;

    const prixCorrige =
        surfaceTotalePonderee > 0
            ? round2(valeurCorrigee / surfaceTotalePonderee)
            : 0;

    const deltaPct =
        prixNaif > 0 ? round2(((prixCorrige - prixNaif) / prixNaif) * 100) : 0;

    return {
        mutation: principal,
        prix_m2_naif: prixNaif,
        prix_m2_corrige: prixCorrige,
        delta_pct: deltaPct,
        valeur_corrigee: round2(valeurCorrigee),
        weighted_surface: {
            surface_habitable: surfaceHabitable,
            surface_annexes_brute: annexesSurface,
            surface_annexes_ponderee: round2(surfaceAnnexesPonderee),
            surface_totale_ponderee: round2(surfaceTotalePonderee),
            source,
        },
        has_dpe: !!dpe,
    };
}

/**
 * Groupe les mutations DVF par id_mutation, sépare principal/dépendances,
 * puis analyse chaque groupe.
 */
export function processTransactions(
    mutations: DvfMutation[],
    dpe: DpeResult | null
): TransactionAnalysis[] {
    // Group by id_mutation
    const groups = new Map<string, DvfMutation[]>();
    for (const m of mutations) {
        const key = m.id_mutation || `${m.date_mutation}_${m.valeur_fonciere}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(m);
    }

    const analyses: TransactionAnalysis[] = [];

    for (const [, group] of groups) {
        // Separate principal (type 1 or 2) from dépendances (type 3)
        const principaux = group.filter(
            (m) => m.code_type_local === 1 || m.code_type_local === 2
        );
        const dependances = group.filter((m) => m.code_type_local === 3);

        for (const principal of principaux) {
            if (principal.surface_reelle_bati <= 0) continue;
            if (principal.valeur_fonciere <= 0) continue;

            analyses.push(analyzeTransaction(principal, dependances, dpe));
        }
    }

    // Sort by date, most recent first
    analyses.sort(
        (a, b) =>
            new Date(b.mutation.date_mutation).getTime() -
            new Date(a.mutation.date_mutation).getTime()
    );

    return analyses;
}

/**
 * Synthèse : médiane des prix naïfs et corrigés, score de confiance.
 */
export function computeSynthese(
    analyses: TransactionAnalysis[],
    dpe: DpeResult | null
) {
    if (analyses.length === 0) {
        return {
            prix_m2_naif_median: 0,
            prix_m2_corrige_median: 0,
            delta_median_pct: 0,
            nb_transactions: 0,
            surface_reference: dpe?.surface_habitable_logement || 0,
            confiance: 0,
        };
    }

    const naifs = analyses.map((a) => a.prix_m2_naif).filter((v) => v > 0);
    const corriges = analyses.map((a) => a.prix_m2_corrige).filter((v) => v > 0);

    const naifMedian = median(naifs);
    const corrigeMedian = median(corriges);
    const deltaMedian =
        naifMedian > 0
            ? round2(((corrigeMedian - naifMedian) / naifMedian) * 100)
            : 0;

    // Confidence score (0–1)
    let confiance = 0.3; // base

    if (dpe) confiance += 0.3; // DPE found → +0.3
    if (analyses.length >= 3) confiance += 0.2; // 3+ comparables
    if (analyses.length >= 5) confiance += 0.1; // 5+ comparables

    // Freshness bonus: newest transaction < 1 year
    const newestDate = new Date(analyses[0].mutation.date_mutation);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (newestDate > oneYearAgo) confiance += 0.1;

    confiance = round2(Math.min(confiance, 1));

    return {
        prix_m2_naif_median: round2(naifMedian),
        prix_m2_corrige_median: round2(corrigeMedian),
        delta_median_pct: deltaMedian,
        nb_transactions: analyses.length,
        surface_reference:
            dpe?.surface_habitable_logement ||
            round2(median(analyses.map((a) => a.weighted_surface.surface_habitable))),
        confiance,
    };
}
