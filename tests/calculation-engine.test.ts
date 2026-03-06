import { describe, it, expect } from "vitest";
import { analyzeTransaction, computeSynthese } from "../src/lib/calculation-engine";
import type { DvfMutation, DpeResult } from "../src/lib/types";

describe("Calculation Engine", () => {
    it("should correctly compute prix_m2_corrige for a standard house with no dependencies", () => {
        const principal: DvfMutation = {
            id_mutation: "1",
            date_mutation: "2025-01-01",
            nature_mutation: "Vente",
            valeur_fonciere: 200000,
            code_commune: "75001",
            code_postal: "75001",
            nom_commune: "Paris",
            code_type_local: 1,
            type_local: "Maison",
            surface_reelle_bati: 100,
            nombre_pieces_principales: 4,
            surface_terrain: 200,
            adresse_nom_voie: "Rue",
            adresse_numero: "1",
            longitude: 0,
            latitude: 0,
        };

        const result = analyzeTransaction(principal, [], null);

        // valeur 200000, surface 100 -> naif = 2000, corrige = 2000
        expect(result.prix_m2_naif).toBe(2000);
        expect(result.prix_m2_corrige).toBe(2000);
        expect(result.delta_pct).toBe(0);
        expect(result.weighted_surface.surface_totale_ponderee).toBe(100);
    });

    it("should deduct garage forfait (15000) and compute correctly", () => {
        const principal: DvfMutation = {
            id_mutation: "2",
            date_mutation: "2025-01-01",
            nature_mutation: "Vente",
            valeur_fonciere: 200000,
            code_commune: "75001",
            code_postal: "75001",
            nom_commune: "Paris",
            code_type_local: 2,
            type_local: "Appartement",
            surface_reelle_bati: 100,
            nombre_pieces_principales: 4,
            surface_terrain: 0,
            adresse_nom_voie: "Rue",
            adresse_numero: "1",
            longitude: 0,
            latitude: 0,
        };

        const garage: DvfMutation = { ...principal, id_mutation: "2-garage", code_type_local: 3, type_local: "Dépendance (garage)", surface_reelle_bati: 15 };

        // We pass the garage as a dependency
        const result = analyzeTransaction(principal, [garage], null);

        // Valeur corrigée = 200000 - 15000 = 185000. 
        // Surface pondérée = 100 (le garage est géré en forfait prix, pas en surface).
        // Donc prix_corrige = 185000 / 100 = 1850.
        expect(result.valeur_corrigee).toBe(185000);
        expect(result.prix_m2_corrige).toBe(1850);
        expect(result.prix_m2_naif).toBe(2000);
        expect(result.delta_pct).toBe(-7.5);
    });

    it("should prioritize DPE surface over DVF surface", () => {
        const principal: DvfMutation = { ...mockMutation(), surface_reelle_bati: 80, valeur_fonciere: 100000 };
        const dpe: DpeResult = {
            numero_dpe: "abcdef",
            date_etablissement_dpe: "2025-02-01",
            identifiant_ban: "x",
            surface_habitable_logement: 100,
            etiquette_dpe: "C",
            etiquette_ges: "A",
            annee_construction: 2000,
            type_batiment: "Maison",
            adresse_complete: "Rue",
            code_postal: "75001",
            nom_commune: "Paris"
        };

        const result = analyzeTransaction(principal, [], dpe);

        // Naif usues DVF: 100k / 80 = 1250
        // Corrige uses DPE: 100k / 100 = 1000
        expect(result.prix_m2_naif).toBe(1250);
        expect(result.prix_m2_corrige).toBe(1000);
        expect(result.weighted_surface.source).toBe("dpe");
        expect(result.weighted_surface.surface_habitable).toBe(100);
    });

    it("synthese should boost confidence score based on transactions and DPE", () => {
        const analyses = [
            analyzeTransaction({ ...mockMutation(), surface_reelle_bati: 100, valeur_fonciere: 200000 }, [], null),
            analyzeTransaction({ ...mockMutation(), surface_reelle_bati: 100, valeur_fonciere: 210000 }, [], null),
            analyzeTransaction({ ...mockMutation(), surface_reelle_bati: 100, valeur_fonciere: 190000 }, [], null),
        ];

        const syntheseWithoutDPE = computeSynthese(analyses, null);
        // Base 0.3 + 3 comparables 0.2 = 0.5. (plus Freshness bonus 0.1 since date is 2025 = 0.6)
        expect(syntheseWithoutDPE.confiance).toBe(0.6);

        const dpe: DpeResult = { ...mockDpe() };
        const syntheseWithDPE = computeSynthese(analyses, dpe);
        // + 0.3 DPE = 0.9
        expect(syntheseWithDPE.confiance).toBe(0.9);
    });
});

function mockMutation(): DvfMutation {
    return {
        id_mutation: "1",
        date_mutation: "2025-01-01",
        nature_mutation: "Vente",
        valeur_fonciere: 100000,
        code_commune: "75001",
        code_postal: "75001",
        nom_commune: "Paris",
        code_type_local: 1,
        type_local: "Maison",
        surface_reelle_bati: 100,
        nombre_pieces_principales: 4,
        surface_terrain: 200,
        adresse_nom_voie: "Rue",
        adresse_numero: "1",
        longitude: 0,
        latitude: 0,
    };
}
function mockDpe(): DpeResult {
    return {
        numero_dpe: "abcdef",
        date_etablissement_dpe: "2025-02-01",
        identifiant_ban: "x",
        surface_habitable_logement: 100,
        etiquette_dpe: "C",
        etiquette_ges: "A",
        annee_construction: 2000,
        type_batiment: "Maison",
        adresse_complete: "Rue",
        code_postal: "75001",
        nom_commune: "Paris"
    };
}
