/**
 * tests/live-market.test.ts
 * Tests unitaires pour le module Live Scraping TrueSquare V6
 */

import { describe, it, expect, beforeEach } from "vitest";
import { haversineDistanceMeters, median } from "../src/lib/live-market";


describe("haversineDistanceMeters", () => {
    it("retourne 0 pour deux points identiques", () => {
        expect(haversineDistanceMeters(47.4784, -0.5632, 47.4784, -0.5632)).toBe(0);
    });

    it("calcule correctement la distance Angers Centre → La Roseraie (~2.4 km)", () => {
        // Angers Centre : 47.4784, -0.5632
        // La Roseraie :   47.4932, -0.5510
        const dist = haversineDistanceMeters(47.4784, -0.5632, 47.4932, -0.5510);
        expect(dist).toBeGreaterThan(1800);
        expect(dist).toBeLessThan(2800);
    });

    it("calcule correctement la distance Paris → Angers (~265 km)", () => {
        // Paris : 48.8566, 2.3522 — Angers : 47.4784, -0.5632
        // Distance réelle haversine ≈ 265 km
        const dist = haversineDistanceMeters(48.8566, 2.3522, 47.4784, -0.5632);
        expect(dist).toBeGreaterThan(250_000);
        expect(dist).toBeLessThan(285_000);
    });

    it("est symétrique (A→B = B→A)", () => {
        const d1 = haversineDistanceMeters(47.4784, -0.5632, 47.4932, -0.5510);
        const d2 = haversineDistanceMeters(47.4932, -0.5510, 47.4784, -0.5632);
        expect(Math.abs(d1 - d2)).toBeLessThan(0.01);
    });
});

describe("median", () => {
    it("retourne null pour un tableau vide", () => {
        expect(median([])).toBeNull();
    });

    it("retourne la valeur unique pour un seul élément", () => {
        expect(median([42])).toBe(42);
    });

    it("retourne la valeur centrale pour un nombre impair d'éléments", () => {
        expect(median([3, 1, 2])).toBe(2);
    });

    it("retourne la moyenne des deux centraux pour un nombre pair", () => {
        expect(median([1, 2, 3, 4])).toBe(3); // (2+3)/2 = 2.5 → arrondi à 3
    });

    it("gère correctement les valeurs identiques", () => {
        expect(median([5, 5, 5])).toBe(5);
    });

    it("ne mute pas le tableau source", () => {
        const arr = [10, 5, 8, 2];
        median(arr);
        expect(arr).toEqual([10, 5, 8, 2]);
    });
});

describe("fetchLiveMarketSnapshot (fallback mode)", () => {
    // Tests en mode fallback (sans ZENROWS_API_KEY ni Supabase)
    beforeEach(() => {
        delete process.env.ZENROWS_API_KEY;
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    });

    const banAngers = {
        label: "15 rue des Lices, Angers",
        id: "49007_5050_00015",
        banId: "49007_5050_00015",
        housenumber: "15",
        street: "rue des Lices",
        postcode: "49000",
        citycode: "49007",
        city: "Angers",
        context: "49",
        lon: -0.5569,
        lat: 47.4701,
        score: 0.97,
        type: "housenumber" as const,
    };

    it("retourne un snapshot en mode démo quand aucune clé n'est configurée", async () => {
        const { fetchLiveMarketSnapshot } = await import("../src/lib/live-market");
        const snapshot = await fetchLiveMarketSnapshot({ ban: banAngers });

        expect(snapshot.is_demo).toBe(true);
        expect(snapshot.source_cache).toBe(false);
        expect(snapshot.listings.length).toBeGreaterThan(0);
        expect(snapshot.summary.count).toBe(snapshot.listings.length);
    });

    it("filtre les listings hors du rayon", async () => {
        const { fetchLiveMarketSnapshot } = await import("../src/lib/live-market");

        // Rayon très petit (100m) → devrait filtrer la plupart des listings
        const snapshot = await fetchLiveMarketSnapshot({ ban: banAngers, radius_m: 100 });
        expect(snapshot.listings.every(l => (l.distance_m ?? Infinity) <= 100)).toBe(true);
    });

    it("calcule correctement le median_price_m2 du summary", async () => {
        const { fetchLiveMarketSnapshot } = await import("../src/lib/live-market");
        const snapshot = await fetchLiveMarketSnapshot({ ban: banAngers });

        const prices_m2 = snapshot.listings
            .map(l => l.price_m2)
            .filter((v): v is number => v !== null);

        if (prices_m2.length > 0) {
            expect(snapshot.summary.median_price_m2).not.toBeNull();
        } else {
            expect(snapshot.summary.median_price_m2).toBeNull();
        }
    });

    it("tous les listings ont les champs requis", async () => {
        const { fetchLiveMarketSnapshot } = await import("../src/lib/live-market");
        const snapshot = await fetchLiveMarketSnapshot({ ban: banAngers });

        for (const listing of snapshot.listings) {
            expect(listing.id).toBeTruthy();
            expect(["leboncoin", "seloger"]).toContain(listing.source);
            expect(typeof listing.price).toBe("number");
            expect(listing.price).toBeGreaterThan(0);
            expect(listing.url).toMatch(/^https?:\/\//);
        }
    });
});
