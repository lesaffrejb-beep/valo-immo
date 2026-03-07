import type { NeighborhoodAmenity, NeighborhoodCategoryScore, NeighborhoodScore } from "@/lib/types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const WALKING_SPEED_M_PER_MIN = 75;
const WALK_RADIUS_M = 1200;

type AmenityCategory = NeighborhoodAmenity["category"];

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function classifyElement(tags: Record<string, string>): AmenityCategory | null {
  const amenity = tags.amenity || "";
  const publicTransport = tags.public_transport || "";
  const railway = tags.railway || "";
  const shop = tags.shop || "";

  const transportValues = new Set(["bus_station", "ferry_terminal", "taxi", "bus_stop", "tram_stop", "station", "halt"]);
  const schoolValues = new Set(["school", "kindergarten", "college", "university"]);
  const foodValues = new Set(["supermarket", "bakery", "convenience", "greengrocer", "butcher"]);

  if (transportValues.has(amenity) || transportValues.has(publicTransport) || railway === "station" || railway === "tram_stop") {
    return "transport";
  }

  if (schoolValues.has(amenity)) {
    return "schools";
  }

  if (foodValues.has(shop)) {
    return "food";
  }

  return null;
}

function labelFromTags(tags: Record<string, string>, category: AmenityCategory): string {
  if (tags.name) return tags.name;

  if (category === "transport") return "Transport public";
  if (category === "schools") return "Établissement scolaire";
  return "Commerce alimentaire";
}

function computeCategoryScore(distances: number[]): NeighborhoodCategoryScore {
  const within5 = distances.filter((d) => d <= WALKING_SPEED_M_PER_MIN * 5).length;
  const within10 = distances.filter((d) => d <= WALKING_SPEED_M_PER_MIN * 10).length;
  const nearest = distances.length > 0 ? Math.min(...distances) : null;

  let score = 0;
  if (nearest !== null) {
    const accessScore = nearest <= 300 ? 4 : nearest <= 600 ? 3 : nearest <= 900 ? 2 : 1;
    const densityScore = Math.min(within10, 6) * 0.7;
    score = Math.min(10, accessScore + densityScore);
  }

  return {
    score: Number(score.toFixed(1)),
    within_5_min: within5,
    within_10_min: within10,
    nearest_m: nearest !== null ? Math.round(nearest) : null,
  };
}

function buildOverpassQuery(lat: number, lon: number, radiusM: number): string {
  return `
[out:json][timeout:20];
(
  node(around:${radiusM},${lat},${lon})["amenity"~"school|kindergarten|college|university|bus_station|ferry_terminal|taxi"];
  node(around:${radiusM},${lat},${lon})["public_transport"~"platform|stop_position|station|stop_area"];
  node(around:${radiusM},${lat},${lon})["railway"~"station|tram_stop|halt"];
  node(around:${radiusM},${lat},${lon})["shop"~"supermarket|bakery|convenience|greengrocer|butcher"];
  way(around:${radiusM},${lat},${lon})["amenity"~"school|kindergarten|college|university|bus_station|ferry_terminal|taxi"];
  way(around:${radiusM},${lat},${lon})["public_transport"~"platform|stop_position|station|stop_area"];
  way(around:${radiusM},${lat},${lon})["railway"~"station|tram_stop|halt"];
  way(around:${radiusM},${lat},${lon})["shop"~"supermarket|bakery|convenience|greengrocer|butcher"];
);
out center;
  `.trim();
}

export async function computeNeighborhoodScore(params: { lat: number; lon: number }): Promise<NeighborhoodScore | null> {
  const query = buildOverpassQuery(params.lat, params.lon, WALK_RADIUS_M);

  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: `data=${encodeURIComponent(query)}`,
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { elements?: OverpassElement[] };
    const elements = payload.elements || [];

    const amenities: NeighborhoodAmenity[] = [];

    for (const item of elements) {
      const tags = item.tags || {};
      const category = classifyElement(tags);
      if (!category) continue;

      const lat = item.lat ?? item.center?.lat;
      const lon = item.lon ?? item.center?.lon;
      if (lat === undefined || lon === undefined) continue;

      const distance = haversineDistanceMeters(params.lat, params.lon, lat, lon);
      amenities.push({
        category,
        label: labelFromTags(tags, category),
        distance_m: Math.round(distance),
      });
    }

    const transportDistances = amenities.filter((a) => a.category === "transport").map((a) => a.distance_m);
    const schoolDistances = amenities.filter((a) => a.category === "schools").map((a) => a.distance_m);
    const foodDistances = amenities.filter((a) => a.category === "food").map((a) => a.distance_m);

    const categories = {
      transport: computeCategoryScore(transportDistances),
      schools: computeCategoryScore(schoolDistances),
      food: computeCategoryScore(foodDistances),
    };

    const weightedGlobal = categories.transport.score * 0.4 + categories.schools.score * 0.3 + categories.food.score * 0.3;

    const topAmenities = amenities
      .sort((a, b) => a.distance_m - b.distance_m)
      .slice(0, 5);

    return {
      global_score: Number(weightedGlobal.toFixed(1)),
      walk_radius_m: WALK_RADIUS_M,
      generated_at: new Date().toISOString(),
      categories,
      top_amenities: topAmenities,
    };
  } catch {
    return null;
  }
}
