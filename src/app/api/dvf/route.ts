import { NextResponse } from "next/server";
import { fetchDvfMutations } from "@/lib/api-clients";
import { z } from "zod";

const dvfQuerySchema = z.object({
    code_commune: z.string().regex(/^[A-Z0-9]{5}$/, "Format code commune Insee invalide").optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lon: z.coerce.number().min(-180).max(180).optional(),
    dist: z.coerce.number().min(50).max(2000).default(500),
}).refine(data => data.code_commune || (data.lat !== undefined && data.lon !== undefined), {
    message: "Paramètre 'code_commune' ou 'lat' + 'lon' requis.",
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const parsed = dvfQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
        return NextResponse.json(
            { success: false, error: parsed.error.issues[0].message },
            { status: 400 }
        );
    }

    const { code_commune, lat, lon, dist } = parsed.data;

    try {
        const mutations = await fetchDvfMutations({
            code_commune,
            lat,
            lon,
            dist,
        });

        return NextResponse.json({ success: true, data: mutations });
    } catch (err) {
        console.error("[dvf]", err);
        return NextResponse.json(
            { success: false, error: "Erreur lors de la requête DVF." },
            { status: 502 }
        );
    }
}
