/**
 * live-market.ts — Module Live Scraping Concurrents TrueSquare V6
 *
 * Architecture 3 couches (par ordre de priorité) :
 * 1. Cache Supabase (< 6h, requête géospatiale PostGIS)
 * 2. API ZenRows (si ZENROWS_API_KEY configurée, appel réel LeBonCoin)
 * 3. FALLBACK statique (données de démo, flag is_demo = true)
 */

import type { BanResult, LiveListing, LiveMarketSnapshot, LiveListingSource } from "./types";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

// ─── Feature Flag ─────────────────────────────────────────────────────────────
// Mettre à true pour activer le vrai scraping (ZenRows + cache Supabase).
// En trial ZenRows : garder à false → teaser V2 flou côté UI.
const LIVE_SCRAPING_ENABLED = false;


// ─── Supabase client (server-side, service role) ───────────────────────────
function getSupabaseServer() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

// ─── Helpers mathématiques ──────────────────────────────────────────────────

export function haversineDistanceMeters(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function median(values: number[]): number | null {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    return Math.round(sorted[mid]);
}

function avgOrNull(values: number[]): number | null {
    if (!values.length) return null;
    return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

function daysOld(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function buildSummary(listings: LiveListing[]) {
    const validDays = listings.map(l => l.days_on_market).filter((v): v is number => v !== null);
    return {
        count: listings.length,
        median_price: median(listings.map(l => l.price)),
        median_price_m2: median(listings.map(l => l.price_m2).filter((v): v is number => v !== null)),
        by_source: {
            leboncoin: listings.filter(l => l.source === "leboncoin").length,
            seloger: listings.filter(l => l.source === "seloger").length,
        } as Record<LiveListingSource, number>,
        avg_days_on_market: avgOrNull(validDays),
    };
}

// ─── LAYER 3 — Données de démo (FALLBACK) ──────────────────────────────────

type RawFallback = {
    source: LiveListingSource;
    title: string;
    url: string;
    price: number;
    surface_m2: number | null;
    rooms: number | null;
    city: string;
    latitude_offset: number;
    longitude_offset: number;
    published_at: string;
    dpe_letter: string | null;
    ges_letter: string | null;
};

const FALLBACK_LISTINGS: RawFallback[] = [
    {
        source: "leboncoin",
        title: "Maison rénovée proche commerces",
        url: "https://www.leboncoin.fr/recherche?category=9",
        price: 339000,
        surface_m2: 95,
        rooms: 5,
        city: "Angers",
        latitude_offset: 0.0014,
        longitude_offset: 0.0013,
        published_at: "2026-02-10",
        dpe_letter: "C",
        ges_letter: "C",
    },
    {
        source: "seloger",
        title: "Appartement lumineux avec balcon",
        url: "https://www.seloger.com/list.htm",
        price: 249000,
        surface_m2: 67,
        rooms: 3,
        city: "Angers",
        latitude_offset: -0.0011,
        longitude_offset: 0.001,
        published_at: "2026-02-21",
        dpe_letter: "E",
        ges_letter: "D",
    },
    {
        source: "leboncoin",
        title: "Maison familiale secteur calme",
        url: "https://www.leboncoin.fr/recherche?category=9",
        price: 389000,
        surface_m2: 112,
        rooms: 6,
        city: "Angers",
        latitude_offset: 0.0008,
        longitude_offset: -0.0012,
        published_at: "2026-01-15",
        dpe_letter: "B",
        ges_letter: "A",
    },
    {
        source: "seloger",
        title: "T4 avec terrasse et parking",
        url: "https://www.seloger.com/list.htm",
        price: 296000,
        surface_m2: 81,
        rooms: 4,
        city: "Angers",
        latitude_offset: -0.0016,
        longitude_offset: -0.0007,
        published_at: "2026-02-27",
        dpe_letter: "F",
        ges_letter: "E",
    },
    {
        source: "leboncoin",
        title: "Studio rénové proche tramway",
        url: "https://www.leboncoin.fr/recherche?category=9",
        price: 98000,
        surface_m2: 28,
        rooms: 1,
        city: "Angers",
        latitude_offset: 0.0005,
        longitude_offset: 0.0019,
        published_at: "2026-03-01",
        dpe_letter: "D",
        ges_letter: "D",
    },
];

function buildFallbackListings(ban: BanResult, radius: number): LiveListing[] {
    return FALLBACK_LISTINGS.map((item, index) => {
        const lat = ban.lat + item.latitude_offset;
        const lon = ban.lon + item.longitude_offset;
        const distance_m = Math.round(haversineDistanceMeters(ban.lat, ban.lon, lat, lon));
        const price_m2 = item.surface_m2 ? Math.round(item.price / item.surface_m2) : null;
        const days_on_market = daysOld(item.published_at);

        return {
            id: `fallback-${item.source}-${index + 1}`,
            source: item.source,
            title: item.title,
            url: item.url,
            price: item.price,
            surface_m2: item.surface_m2,
            rooms: item.rooms,
            city: item.city,
            latitude: lat,
            longitude: lon,
            distance_m,
            price_m2,
            published_at: item.published_at,
            dpe_letter: item.dpe_letter,
            ges_letter: item.ges_letter,
            days_on_market,
        };
    }).filter(l => (l.distance_m ?? Infinity) <= radius);
}

// ─── LAYER 1 — Cache Supabase ───────────────────────────────────────────────

async function fetchFromSupabaseCache(
    ban: BanResult,
    radius: number
): Promise<LiveListing[] | null> {
    try {
        const supabase = getSupabaseServer();
        if (!supabase) return null;

        // Requête PostGIS : biens dans un rayon de `radius` mètres, scrapés il y a < 6h
        const { data, error } = await supabase
            .from("live_listings_cache")
            .select("*")
            .gt("scraped_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
            .limit(20);

        if (error || !data || data.length === 0) return null;

        // Filtrer côté JS par distance (le filtre géospatial nécessite PostGIS RPC)
        return data
            .map((row: Record<string, unknown>) => {
                const lat = Number(row.latitude) || 0;
                const lon = Number(row.longitude) || 0;
                const distance_m = Math.round(haversineDistanceMeters(ban.lat, ban.lon, lat, lon));
                return {
                    id: String(row.id),
                    source: (row.source as LiveListingSource) || "leboncoin",
                    title: String(row.title || ""),
                    url: String(row.url || ""),
                    price: Number(row.price) || 0,
                    surface_m2: row.surface_m2 ? Number(row.surface_m2) : null,
                    rooms: row.rooms ? Number(row.rooms) : null,
                    city: row.city ? String(row.city) : null,
                    latitude: lat,
                    longitude: lon,
                    distance_m,
                    price_m2: row.price_m2 ? Number(row.price_m2) : null,
                    published_at: row.published_at ? String(row.published_at) : null,
                    dpe_letter: row.dpe_letter ? String(row.dpe_letter) : null,
                    ges_letter: row.ges_letter ? String(row.ges_letter) : null,
                    days_on_market: row.published_at ? daysOld(String(row.published_at)) : null,
                } as LiveListing;
            })
            .filter(l => (l.distance_m ?? Infinity) <= radius);
    } catch {
        return null;
    }
}

// ─── LAYER 2 — ZenRows (vrai scraping) ─────────────────────────────────────

async function fetchFromZenRows(
    ban: BanResult,
    radius: number
): Promise<LiveListing[] | null> {
    const apiKey = process.env.ZENROWS_API_KEY;
    if (!apiKey) return null;

    try {
        // URL LeBonCoin avec paramètres géolocalisés autour du point BAN
        const lbcUrl = encodeURIComponent(
            `https://www.leboncoin.fr/recherche?category=9&locations=${ban.lat},${ban.lon},${radius}`
        );
        const zenrowsUrl = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${lbcUrl}&js_render=true&premium_proxy=true`;

        const res = await fetch(zenrowsUrl, {
            method: "GET",
            signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
            console.warn("[live-market] ZenRows réponse non-ok:", res.status);
            return null;
        }

        const html = await res.text();
        const $ = cheerio.load(html);
        const lbcListings: LiveListing[] = [];

        // Sélecteurs CSS classiques Leboncoin (peuvent varier selon l'A/B testing)
        $('a[data-qa-id="aditem_container"]').each((i, el) => {
            const $el = $(el);

            const href = $el.attr("href") || "";
            const url = href.startsWith("http") ? href : `https://www.leboncoin.fr${href}`;

            // Extract ID from URL
            const idMatch = href.match(/\/(\d+)\.htm/);
            const id = idMatch ? `lbc_${idMatch[1]}` : `lbc_scrape_${Date.now()}_${i}`;

            const title = $el.find('[data-qa-id="aditem_title"], p[title]').first().text().trim();
            const priceText = $el.find('[data-test-id="price"], [data-qa-id="aditem_price"]').text().trim();
            const price = parseInt(priceText.replace(/\D/g, ""), 10) || 0;

            if (!title || price <= 0) return;

            // Specs (surface, pièces) souvent disséminées dans des spans ou paragraphes
            let surface_m2: number | null = null;
            let rooms: number | null = null;

            $el.find('p, span').each((_, textEl) => {
                const text = $(textEl).text().trim().toLowerCase();
                // Surface
                if (text.includes("m²") || text.includes("m2")) {
                    const match = text.match(/([\d,]+)/);
                    if (match && !surface_m2) surface_m2 = parseFloat(match[1].replace(",", "."));
                }
                // Pièces
                if (text.includes("pièce") || text.includes("piece") || text.includes("p.")) {
                    const match = text.match(/(\d+)/);
                    if (match && !rooms) rooms = parseInt(match[1], 10);
                }
            });

            // Localisation
            const cityText = $el.find('[data-qa-id="aditem_location"] p').first().text().trim() || ban.city;
            const city = cityText.split(" ")[0] || ban.city;

            // Image
            const imgEl = $el.find('img');
            const thumbnail_url = imgEl.attr("src") || imgEl.attr("data-src") || undefined;

            lbcListings.push({
                id,
                source: "leboncoin",
                title,
                url,
                price,
                surface_m2,
                rooms,
                city,
                thumbnail_url,
                // On met les coordonnées calculées du centre de recherche (difficile à extraire depuis la liste)
                latitude: ban.lat,
                longitude: ban.lon,
                price_m2: surface_m2 && surface_m2 > 0 ? Math.round(price / surface_m2) : null,
                distance_m: 0, // estimé since on force la city via lat/lon
                published_at: new Date().toISOString(), // Fallback: sans entrer dans l'annonce on met la date du jour ou null
                dpe_letter: null,
                ges_letter: null,
                days_on_market: null,
            });
        });

        if (lbcListings.length > 0) {
            console.info(`[live-market] ZenRows: ${lbcListings.length} annonces extraites via CSS selectors`);
            return lbcListings;
        }

        console.info("[live-market] ZenRows: HTML parsé mais 0 annonces trouvées avec les sélecteurs actuels → fallback");
        return null;
    } catch (err) {
        console.warn("[live-market] ZenRows échec:", err);
        return null;
    }
}

// ─── LAYER 0 — Persistance cache Supabase ──────────────────────────────────

async function persistToCache(ban: BanResult, listings: LiveListing[]) {
    try {
        const supabase = getSupabaseServer();
        if (!supabase || listings.length === 0) return;

        const rows = listings.map(l => ({
            id: l.id,
            source: l.source,
            title: l.title,
            url: l.url,
            price: l.price,
            surface_m2: l.surface_m2,
            rooms: l.rooms,
            dpe_letter: l.dpe_letter,
            ges_letter: l.ges_letter,
            city: l.city,
            latitude: l.latitude,
            longitude: l.longitude,
            distance_m: l.distance_m,
            price_m2: l.price_m2,
            published_at: l.published_at,
            scraped_at: new Date().toISOString(),
        }));

        await supabase.from("live_listings_cache").upsert(rows, { onConflict: "id" });
    } catch (err) {
        console.warn("[live-market] persistToCache échec (non bloquant):", err);
    }
}

// ─── API Publique ────────────────────────────────────────────────────────────

export async function fetchLiveMarketSnapshot(params: {
    ban: BanResult;
    radius_m?: number;
}): Promise<LiveMarketSnapshot> {
    const radius = params.radius_m ?? 1200;
    const { ban } = params;

    // ─── Court-circuit Feature Flag ───────────────────────────────────────────
    // LIVE_SCRAPING_ENABLED = false → teaser V2, saute directement au fallback
    if (!LIVE_SCRAPING_ENABLED) {
        const fallback = buildFallbackListings(ban, radius);
        return {
            generated_at: new Date().toISOString(),
            radius_m: radius,
            listings: fallback,
            is_demo: true,
            source_cache: false,
            summary: buildSummary(fallback),
        };
    }

    // Layer 1 — Cache Supabase
    const cached = await fetchFromSupabaseCache(ban, radius);
    if (cached && cached.length >= 2) {
        return {
            generated_at: new Date().toISOString(),
            radius_m: radius,
            listings: cached,
            is_demo: false,
            source_cache: true,
            summary: buildSummary(cached),
        };
    }

    // Layer 2 — ZenRows (scraping réel)
    const scraped = await fetchFromZenRows(ban, radius);
    if (scraped && scraped.length >= 2) {
        // Persistance asynchrone (non-bloquant)
        void persistToCache(ban, scraped);
        return {
            generated_at: new Date().toISOString(),
            radius_m: radius,
            listings: scraped,
            is_demo: false,
            source_cache: false,
            summary: buildSummary(scraped),
        };
    }

    // Layer 3 — FALLBACK statique (démo)
    const fallback = buildFallbackListings(ban, radius);
    return {
        generated_at: new Date().toISOString(),
        radius_m: radius,
        listings: fallback,
        is_demo: true,
        source_cache: false,
        summary: buildSummary(fallback),
    };
}
