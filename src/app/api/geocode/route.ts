import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/api-clients";
import { z } from "zod";

const geocodeQuerySchema = z.object({
    q: z.string().min(3, "Le paramètre 'q' est requis (3 caractères min.)").max(150),
    limit: z.coerce.number().min(1).max(20).default(5),
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const parsed = geocodeQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
        return NextResponse.json(
            { success: false, error: parsed.error.issues[0].message },
            { status: 400 }
        );
    }

    const { q, limit } = parsed.data;

    try {
        const results = await geocodeAddress(q, limit);
        return NextResponse.json({ success: true, data: results });
    } catch (err) {
        console.error("[geocode]", err);
        return NextResponse.json(
            { success: false, error: "Erreur lors du géocodage." },
            { status: 502 }
        );
    }
}
