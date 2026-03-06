import type { BanResult, DvfMutation, DpeResult } from "./types";

const BAN_BASE = "https://api-adresse.data.gouv.fr";
// DVF+ Cerema — open data API géolocalisée (fiable, open data Etalab)
const DVF_CEREMA = process.env.DVF_API_BASE || "https://apidf-preprod.cerema.fr/dvf_opendata/geomutations/";
const DPE_BASE =
    "https://data.ademe.fr/data-fair/api/v1/datasets/dpe-v2-logements-existants/lines";

/* ─── Helpers ─── */

async function fetchWithTimeout(
    url: string,
    timeoutMs = 5000
): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { "User-Agent": "TrueSquare/1.0" },
            next: { revalidate: 86400 } // Cache 24h natif Data Cache Next.js
        });
        return res;
    } finally {
        clearTimeout(id);
    }
}

/**
 * Convert lat/lon/dist (metres) to a bounding box string for Cerema API.
 * Max bbox: 0.02° × 0.02° (~2.2 km × 1.7 km)
 */
function toBbox(lat: number, lon: number, distMeters: number = 500): string {
    // 1° latitude ≈ 111 km, 1° longitude ≈ 111 km × cos(lat)
    const deltaLat = Math.min(distMeters / 111000, 0.009);
    const deltaLon = Math.min(distMeters / (111000 * Math.cos((lat * Math.PI) / 180)), 0.009);
    const minLon = (lon - deltaLon).toFixed(6);
    const minLat = (lat - deltaLat).toFixed(6);
    const maxLon = (lon + deltaLon).toFixed(6);
    const maxLat = (lat + deltaLat).toFixed(6);
    return `${minLon},${minLat},${maxLon},${maxLat}`;
}

/**
 * Map Cerema codtypbien to DVF code_type_local (1=Maison, 2=Appart, 3=Dépendance)
 * 110-119 → Maisons individuelles
 * 120-129 → Appartements
 * 130-149 → Dépendances / Divers
 */
function mapCodeTypLocal(codtypbien: string | number): number {
    const code = String(codtypbien);
    if (code.startsWith("11")) return 1; // Maison
    if (code.startsWith("12")) return 2; // Appartement
    return 3; // Dépendance / commercial / autre
}

/* ─── BAN — Geocoding ─── */

export async function geocodeAddress(
    query: string,
    limit = 5
): Promise<BanResult[]> {
    const url = `${BAN_BASE}/search/?q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetchWithTimeout(url);

    if (!res.ok) {
        throw new Error(`BAN API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const features = data.features || [];

    return features.map(
        (f: {
            properties: Record<string, unknown>;
            geometry: { coordinates: number[] };
        }) => ({
            label: f.properties.label as string,
            id: f.properties.id as string,
            banId: (f.properties.banId as string) || (f.properties.id as string),
            housenumber: (f.properties.housenumber as string) || "",
            street: (f.properties.street as string) || (f.properties.name as string) || "",
            postcode: f.properties.postcode as string,
            citycode: f.properties.citycode as string,
            city: f.properties.city as string,
            context: f.properties.context as string,
            lon: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
            score: f.properties.score as number,
            type: f.properties.type as BanResult["type"],
        })
    );
}

/* ─── DVF — Transactions via Cerema DVF+ Open Data ─── */

export async function fetchDvfMutations(params: {
    code_commune?: string;
    lat?: number;
    lon?: number;
    dist?: number;
}): Promise<DvfMutation[]> {
    let url: string;

    if (params.lat !== undefined && params.lon !== undefined) {
        const bbox = toBbox(params.lat, params.lon, params.dist || 500);
        url = `${DVF_CEREMA}?in_bbox=${bbox}&page_size=100`;
    } else {
        console.warn("[DVF] No lat/lon provided for Cerema API, skipping.");
        return [];
    }

    try {
        const res = await fetchWithTimeout(url, 8000); // 8s timeout for DVF Cerema
        if (!res.ok) {
            throw new Error(`[DVF] Cerema API returned ${res.status}`);
        }

        const data = await res.json();
        // The Cerema geomutations endpoint returns GeoJSON FeatureCollection
        const features: Record<string, unknown>[] = data.features || [];

        return features
            // Prioritize freshest transactions first before filtering & mapping
            .sort((a, b) => {
                const da = new Date(String((a.properties as Record<string, unknown> | undefined)?.datemut || "")).getTime();
                const db = new Date(String((b.properties as Record<string, unknown> | undefined)?.datemut || "")).getTime();
                return db - da;
            })
            .map((f) => {
                const p = (f.properties || {}) as Record<string, unknown>;
                const libnat = String(p.libnatmut || "");
                // Only keep actual sales
                if (libnat !== "Vente" && !libnat.includes("futur d'achèvement")) return null;

                const valeur = Number(p.valeurfonc) || 0;
                if (valeur <= 0) return null;

                const codtypbien = p.codtypbien;
                const codeTypeLocal = mapCodeTypLocal(String(codtypbien || "0"));

                // Only residential or dependencies
                if (codeTypeLocal > 3) return null;

                const sbati = Number(p.sbati) || 0;
                if (codeTypeLocal < 3 && sbati <= 0) return null;

                // Extract coordinates from geometry centroid (Point or Polygon)
                let lon = 0, lat = 0;
                const geom = f.geometry as { type: string; coordinates: unknown[] } | null;
                if (geom?.type === "Point") {
                    lon = (geom.coordinates as number[])[0];
                    lat = (geom.coordinates as number[])[1];
                } else if (geom?.type === "Polygon") {
                    const coords = (geom.coordinates as number[][][])[0];
                    if (coords?.length > 0) {
                        lon = coords.reduce((s, c) => s + c[0], 0) / coords.length;
                        lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
                    }
                }

                const codeInsee = Array.isArray(p.l_codinsee)
                    ? (p.l_codinsee as string[])[0] || ""
                    : String(p.l_codinsee || "");

                return {
                    id_mutation: String(p.idopendata || p.idmutinvar || ""),
                    date_mutation: String(p.datemut || ""),
                    nature_mutation: libnat,
                    valeur_fonciere: valeur,
                    code_postal: String(p.coddep || "") + "000", // approximation
                    code_commune: codeInsee,
                    nom_commune: "",
                    code_type_local: codeTypeLocal,
                    type_local: String(p.libtypbien || ""),
                    surface_reelle_bati: sbati,
                    nombre_pieces_principales: 0,
                    surface_terrain: Number(p.sterr) || 0,
                    adresse_nom_voie: "",
                    adresse_numero: "",
                    longitude: lon,
                    latitude: lat,
                } as DvfMutation;
            })
            .filter((m): m is DvfMutation => m !== null);
    } catch (err) {
        console.error("[DVF] Cerema API failed:", err);
        throw new Error("DVF_API_FAILED");
    }
}

/* ─── DPE — Performance Énergétique (ADEME) ─── */

export async function fetchDpe(params: {
    identifiant_ban?: string;
    code_postal?: string;
    adresse?: string;
}): Promise<DpeResult[]> {
    const searchParams = new URLSearchParams();
    searchParams.set("size", "10");

    const qsParts: string[] = [];
    if (params.identifiant_ban) {
        qsParts.push(`identifiant_ban:"${params.identifiant_ban}"`);
    }
    if (params.code_postal) {
        qsParts.push(`code_postal_ban:"${params.code_postal}"`);
    }

    if (qsParts.length > 0) {
        searchParams.set("qs", qsParts.join(" AND "));
    } else if (params.adresse) {
        searchParams.set("q", params.adresse);
    }

    searchParams.set(
        "select",
        [
            "numero_dpe",
            "date_etablissement_dpe",
            "identifiant_ban",
            "surface_habitable_logement",
            "etiquette_dpe",
            "etiquette_ges",
            "annee_construction_dpe",
            "type_batiment",
            "adresse_ban",
            "code_postal_ban",
            "nom_commune_ban",
        ].join(",")
    );

    const url = `${DPE_BASE}?${searchParams.toString()}`;

    try {
        const res = await fetchWithTimeout(url, 5000);

        if (!res.ok) {
            console.warn(`DPE API returned ${res.status}, falling back to empty`);
            return [];
        }

        const data = await res.json();
        const results = data.results || [];

        return results
            .filter((r: Record<string, unknown>) => Number(r.surface_habitable_logement) > 0)
            .map(
                (r: Record<string, unknown>) =>
                    ({
                        numero_dpe: String(r.numero_dpe || ""),
                        date_etablissement_dpe: String(r.date_etablissement_dpe || ""),
                        identifiant_ban: String(r.identifiant_ban || ""),
                        surface_habitable_logement: Number(r.surface_habitable_logement) || 0,
                        etiquette_dpe: String(r.etiquette_dpe || ""),
                        etiquette_ges: String(r.etiquette_ges || ""),
                        annee_construction: Number(r.annee_construction_dpe) || 0,
                        type_batiment: String(r.type_batiment || ""),
                        adresse_complete: String(r.adresse_ban || ""),
                        code_postal: String(r.code_postal_ban || ""),
                        nom_commune: String(r.nom_commune_ban || ""),
                    }) as DpeResult
            );
    } catch (err) {
        console.warn("DPE API unreachable, returning empty:", err);
        return [];
    }
}
