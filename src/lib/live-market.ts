import type { BanResult, LiveListing, LiveMarketSnapshot, LiveListingSource } from "./types";

type RawListing = {
    source: LiveListingSource;
    title: string;
    url: string;
    price: number;
    surface_m2: number | null;
    rooms: number | null;
    city: string | null;
    latitude_offset: number;
    longitude_offset: number;
    published_at: string;
};

const FALLBACK_LISTINGS: RawListing[] = [
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
        published_at: "2026-02-25",
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
        published_at: "2026-02-27",
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
        published_at: "2026-02-23",
    },
];

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function median(values: number[]): number | null {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    return Math.round(sorted[mid]);
}

export async function fetchLiveMarketSnapshot(params: {
    ban: BanResult;
    radius_m?: number;
}): Promise<LiveMarketSnapshot> {
    const radius = params.radius_m ?? 1200;

    const listings: LiveListing[] = FALLBACK_LISTINGS.map((item, index) => {
        const lat = params.ban.lat + item.latitude_offset;
        const lon = params.ban.lon + item.longitude_offset;
        const distance_m = Math.round(haversineDistanceMeters(params.ban.lat, params.ban.lon, lat, lon));
        const price_m2 = item.surface_m2 ? Math.round(item.price / item.surface_m2) : null;

        return {
            id: `${item.source}-${index + 1}`,
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
        };
    }).filter((listing) => (listing.distance_m ?? Infinity) <= radius);

    return {
        generated_at: new Date().toISOString(),
        radius_m: radius,
        listings,
        summary: {
            count: listings.length,
            median_price: median(listings.map((l) => l.price)),
            median_price_m2: median(listings.map((l) => l.price_m2).filter((v): v is number => v !== null)),
            by_source: {
                leboncoin: listings.filter((l) => l.source === "leboncoin").length,
                seloger: listings.filter((l) => l.source === "seloger").length,
            },
        },
    };
}
