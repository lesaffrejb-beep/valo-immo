import { describe, it, expect } from "vitest";
import { analyzeTransaction, processTransactions, computeSynthese } from "../src/lib/calculation-engine";
import type { DvfMutation, DpeResult } from "../src/lib/types";

describe("Calculation Engine", () => {
    describe("analyzeTransaction", () => {
        it("should correctly compute prix_m2_corrige for a standard house with no dependencies", () => {
            const principal: DvfMutation = {
                id_mutation: "1",
                date_mutation: new Date().toISOString(),
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
            const principal = mockMutation();
            principal.valeur_fonciere = 200000;
            principal.code_type_local = 2;
            principal.type_local = "Appartement";
            principal.surface_reelle_bati = 100;

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
            const dpe: DpeResult = mockDpe();

            const result = analyzeTransaction(principal, [], dpe);

            // Naif usues DVF: 100k / 80 = 1250
            // Corrige uses DPE: 100k / 100 = 1000
            expect(result.prix_m2_naif).toBe(1250);
            expect(result.prix_m2_corrige).toBe(1000);
            expect(result.weighted_surface.source).toBe("dpe");
            expect(result.weighted_surface.surface_habitable).toBe(100);
        });

        it("should handle multiple dependencies (garage + cave) correctly", () => {
            const principal = mockMutation();
            principal.valeur_fonciere = 200000;
            principal.surface_reelle_bati = 100;

            const garage: DvfMutation = { ...principal, type_local: "Dépendance (garage)", code_type_local: 3, surface_reelle_bati: 15 };
            const cave: DvfMutation = { ...principal, type_local: "Cave", code_type_local: 3, surface_reelle_bati: 10 };

            const result = analyzeTransaction(principal, [garage, cave], null);

            // Valeur corrigée = 200000 - 15000 (garage) = 185000.
            // Surface pondérée = 100 + (10 * 0.15) (cave) = 101.5.
            // Prix corrigé = 185000 / 101.5 = 1822.66
            expect(result.valeur_corrigee).toBe(185000);
            expect(result.weighted_surface.surface_annexes_ponderee).toBe(1.5);
            expect(result.weighted_surface.surface_totale_ponderee).toBe(101.5);
            expect(result.prix_m2_corrige).toBe(1822.66);
        });

        it("should cap the garage deduction to max 30% of total price", () => {
            const principal = mockMutation();
            principal.valeur_fonciere = 40000;
            principal.surface_reelle_bati = 50;

            const garage: DvfMutation = { ...principal, type_local: "Dépendance (garage)", code_type_local: 3 };
            const garage2: DvfMutation = { ...principal, type_local: "Dépendance (garage 2)", code_type_local: 3 };

            // 2 garages = 30000 deduction. But price is 40000, 30% max is 12000 (meaning it shouldn't drop below 40000 * 0.7 = 28000)
            const result = analyzeTransaction(principal, [garage, garage2], null);
            expect(result.valeur_corrigee).toBe(28000);
        });
    });

    describe("processTransactions", () => {
        it("should correctly group principal and dependencies by id_mutation", () => {
            const principal = mockMutation();
            const garage: DvfMutation = { ...principal, type_local: "Dépendance (garage)", code_type_local: 3 };

            // Should produce only 1 analysis containing 1 dependency
            const analyses = processTransactions([principal, garage], null);
            expect(analyses.length).toBe(1);
            expect(analyses[0].mutation.type_local).toBe("Maison");
            expect(analyses[0].valeur_corrigee).toBe(85000); // 100k - 15k
        });

        it("should exclude mutations with 0 surface or 0 price", () => {
            const principalZeroSurf = { ...mockMutation(), id_mutation: "1", surface_reelle_bati: 0 };
            const principalZeroPrice = { ...mockMutation(), id_mutation: "2", valeur_fonciere: 0 };
            const valid = mockMutation(); valid.id_mutation = "3";

            const analyses = processTransactions([principalZeroSurf, principalZeroPrice, valid], null);
            expect(analyses.length).toBe(1);
            expect(analyses[0].mutation.id_mutation).toBe("3");
        });
    });

    describe("computeSynthese", () => {
        it("synthese should boost confidence score based on transactions and DPE", () => {
            const analyses = [
                analyzeTransaction({ ...mockMutation(), surface_reelle_bati: 100, valeur_fonciere: 200000 }, [], null),
                analyzeTransaction({ ...mockMutation(), surface_reelle_bati: 100, valeur_fonciere: 210000 }, [], null),
                analyzeTransaction({ ...mockMutation(), surface_reelle_bati: 100, valeur_fonciere: 190000 }, [], null),
            ];

            const syntheseWithoutDPE = computeSynthese(analyses, null);
            // Base 0.3 + 3 comps 0.2 + freshness 0.1 = 0.6
            expect(syntheseWithoutDPE.confiance).toBe(0.6);

            const dpe: DpeResult = mockDpe();
            const syntheseWithDPE = computeSynthese(analyses, dpe);
            // Base 0.3 + 3 comps 0.2 + freshness 0.1 + dpe 0.3 = 0.9
            expect(syntheseWithDPE.confiance).toBe(0.9);
        });

        it("should return zeros if there are no analyses", () => {
            const synthese = computeSynthese([], null);
            expect(synthese.prix_m2_naif_median).toBe(0);
            expect(synthese.nb_transactions).toBe(0);
        });
    });
});

function mockMutation(): DvfMutation {
    return {
        id_mutation: "1",
        date_mutation: new Date().toISOString(),
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
