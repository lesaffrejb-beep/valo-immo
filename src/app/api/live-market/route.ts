import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/api-clients";
import { fetchLiveMarketSnapshot } from "@/lib/live-market";
import { z } from "zod";

const querySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().min(200).max(5000).optional(),
    adresse: z.string().min(5).max(150).optional(),
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const parsed = querySchema.safeParse({
        lat: searchParams.get("lat"),
        lon: searchParams.get("lon"),
        radius: searchParams.get("radius"),
        adresse: searchParams.get("adresse"),
    });

    if (!parsed.success) {
        return NextResponse.json(
            { success: false, error: "Paramètres invalides. Fournir lat, lon (et optionnellement radius, adresse)." },
            { status: 400 }
        );
    }

    const { lat, lon, radius, adresse } = parsed.data;

    try {
        // Construction d'un BanResult minimal à partir des coordonnées GPS
        // Si une adresse est fournie, on enrichit avec la BAN
        let banLabel = adresse || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        let banId = `coord_${lat.toFixed(5)}_${lon.toFixed(5)}`;

        if (adresse) {
            try {
                const banResults = await geocodeAddress(adresse, 1);
                if (banResults.length > 0) {
                    banLabel = banResults[0].label;
                    banId = banResults[0].id;
                }
            } catch {
                // On continue avec les coordonnées brutes
            }
        }

        const ban = {
            label: banLabel,
            id: banId,
            banId,
            housenumber: "",
            street: "",
            postcode: "",
            citycode: "",
            city: "Angers",
            context: "49",
            lon,
            lat,
            score: 1,
            type: "housenumber" as const,
        };

        const liveMarket = await fetchLiveMarketSnapshot({ ban, radius_m: radius });

        return NextResponse.json(
            { success: true, data: liveMarket },
            {
                headers: {
                    // Cache 1h côté CDN, stale-while-revalidate 3h
                    "Cache-Control": "public, max-age=3600, stale-while-revalidate=10800",
                },
            }
        );
    } catch (err: unknown) {
        console.error("[live-market API]", err);
        return NextResponse.json(
            { success: false, error: "Erreur lors de la récupération des annonces actives." },
            { status: 500 }
        );
    }
}
