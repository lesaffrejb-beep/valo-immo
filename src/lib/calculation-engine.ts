import type {
    DvfMutation,
    DpeResult,
    TransactionAnalysis,
    WeightedSurface,
    ShapAnalysis,
    ShapValue,
} from "./types";

/* ─── Coefficients de Pondération ─── */
const WEIGHTS = {
    balcon: 0.25,
    terrasse: 0.20,
    cave: 0.15,
    grenier: 0.30,
    garage_forfait: 15000, // € — valeur forfaitaire déduite
} as const;

const MAX_TRANSACTION_AGE_YEARS = 5;

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
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100) / 100;
}

/** Detect if a DVF mutation line is a garage/parking */
function isGarage(mutation: DvfMutation): boolean {
    return (
        mutation.code_type_local === 3 &&
        (mutation.type_local || "").toLowerCase().includes("dépendance")
    );
}

function isRecentEnough(dateMutation: string): boolean {
    const txDate = new Date(dateMutation);
    if (Number.isNaN(txDate.getTime())) return false;

    const oldestAllowed = new Date();
    oldestAllowed.setFullYear(oldestAllowed.getFullYear() - MAX_TRANSACTION_AGE_YEARS);

    return txDate >= oldestAllowed;
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
            if (!isRecentEnough(principal.date_mutation)) continue;

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
    dpe: DpeResult | null,
    wizardData?: WizardData
) {
    if (analyses.length === 0) {
        // Fallback générique si aucune donnée DVF dans le périmètre
        const fallbackPrice = wizardData?.typeBien === 'appartement' ? 3200 : 2800;
        return {
            prix_m2_naif_median: fallbackPrice,
            prix_m2_corrige_median: fallbackPrice,
            delta_median_pct: 0,
            nb_transactions: 0,
            surface_reference: dpe?.surface_habitable_logement || wizardData?.surface || 0,
            confiance: 0,
            quality: {
                stale_data: true,
                sample_size_ok: false,
                has_dpe: !!dpe,
            },
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
    const isFresh = newestDate > oneYearAgo;
    if (isFresh) confiance += 0.1;

    confiance = round2(Math.min(confiance, 1));

    return {
        prix_m2_naif_median: round2(naifMedian),
        prix_m2_corrige_median: round2(corrigeMedian),
        delta_median_pct: deltaMedian,
        nb_transactions: analyses.length,
        surface_reference:
            dpe?.surface_habitable_logement ||
            wizardData?.surface ||
            round2(median(analyses.map((a) => a.weighted_surface.surface_habitable))),
        confiance,
        quality: {
            stale_data: !isFresh,
            sample_size_ok: analyses.length >= 3,
            has_dpe: !!dpe,
        },
    };
}

export interface WizardData {
    surface?: number;
    dpe?: string | null;
    pptVote?: boolean | null;
    typeBien?: string | null;
    etage?: string | null;
    ascenseur?: boolean | null;
    vueDegagee?: boolean | null;
    [key: string]: unknown;
}

/**
 * Mock pour simuler la réponse de l'API Python XGBoost + SHAP
 */
export function computeShapMock(
    synthese: ReturnType<typeof computeSynthese>,
    wizardData: WizardData
): ShapAnalysis {
    const surface = wizardData.surface || synthese.surface_reference;
    // Base Calculation starting from median
    const prix_base = round2(synthese.prix_m2_corrige_median * surface);
    let prix_estime = prix_base;

    const explications_shap: ShapValue[] = [];

    // Simulate Positives (Tramway, Ecoles)
    const bonus_tram = round2(prix_base * 0.05);
    explications_shap.push({
        feature: "tramway",
        impact_value: bonus_tram,
        description: "Proximité Tram B/C (< 10min)"
    });
    prix_estime += bonus_tram;

    // Simulate DPE Decote
    if (wizardData.dpe && ['E', 'F', 'G'].includes(wizardData.dpe)) {
        const factor = wizardData.dpe === 'G' ? 250 : wizardData.dpe === 'F' ? 150 : 80;
        const decote = - (surface * factor);
        explications_shap.push({
            feature: "dpe",
            impact_value: decote,
            description: `Décote Rénovation DPE ${wizardData.dpe}`
        });
        prix_estime += decote;
    }

    // Simulate PPT (Copropriété risk)
    if (wizardData.pptVote === false) {
        const decote_ppt = -15000;
        explications_shap.push({
            feature: "ppt",
            impact_value: decote_ppt,
            description: "Risque Loi Alur (Absence Fonds PPT)"
        });
        prix_estime += decote_ppt;
    }

    // Simulate Nuisance (Noise etc.)
    const decote_bruit = - round2(prix_base * 0.02);
    explications_shap.push({
        feature: "nuisance",
        impact_value: decote_bruit,
        description: "Exposition Bruit Modérée (Lden 60dB)"
    });
    prix_estime += decote_bruit;

    // ─── Modificateurs Appartement (Étage, Ascenseur, Vue) ────────────────────
    if (wizardData.typeBien === "appartement" && wizardData.etage) {
        let impact_etage = 0;
        let label_etage = "";

        const etage: string = wizardData.etage;
        const ascenseur: boolean | null = wizardData.ascenseur ?? null;
        const vueDegagee: boolean | null = wizardData.vueDegagee ?? null;

        if (etage === "rdc") {
            // RDC : décote systématique (luminosité, sécurité, humidité)
            impact_etage = -round2(prix_base * 0.05);
            label_etage = "Rez-de-chaussée (décote accès, luminosité)";
        } else if (etage === "1-3") {
            // Étages intermédiaires bas : neutre à léger bonus
            impact_etage = ascenseur === false ? 0 : round2(prix_base * 0.01);
            label_etage = ascenseur === false
                ? "Étages 1-3 sans ascenseur (neutre)"
                : "Étages 1-3 avec ascenseur (+1%)";
        } else if (etage === "4-5") {
            // Étages moyens-hauts : bonus ascenseur important
            impact_etage = ascenseur === true
                ? round2(prix_base * 0.05)
                : -round2(prix_base * 0.02);
            label_etage = ascenseur === true
                ? "Étages 4-5 avec ascenseur (confort +5%)"
                : "Étages 4-5 sans ascenseur (pénibilité -2%)";
        } else if (etage === "6+") {
            // Dernier(s) étage(s) : forte prime si ascenseur, forte décote sinon
            impact_etage = ascenseur === true
                ? round2(prix_base * 0.08)
                : -round2(prix_base * 0.04);
            label_etage = ascenseur === true
                ? "Étage élevé avec ascenseur (vue, calme +8%)"
                : "Étage élevé sans ascenseur (fort malus -4%)";
        }

        if (impact_etage !== 0) {
            explications_shap.push({
                feature: "etage_copro",
                impact_value: impact_etage,
                description: label_etage,
            });
            prix_estime += impact_etage;
        }

        // Vue dégagée : bonus indépendant de l'étage
        if (vueDegagee === true) {
            const bonus_vue = round2(prix_base * 0.03);
            explications_shap.push({
                feature: "vue_degagee",
                impact_value: bonus_vue,
                description: "Vue dégagée ou remarquable (+3%)",
            });
            prix_estime += bonus_vue;
        }
    }

    return {
        prix_base,
        prix_estime: round2(prix_estime),
        intervalle_min: round2(prix_estime * 0.94),
        intervalle_max: round2(prix_estime * 1.06),
        explications_shap
    };
}
