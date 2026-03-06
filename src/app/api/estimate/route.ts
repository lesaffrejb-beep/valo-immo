import { NextResponse } from "next/server";
import { geocodeAddress, fetchDvfMutations, fetchDpe } from "@/lib/api-clients";
import { processTransactions, computeSynthese } from "@/lib/calculation-engine";
import type { EstimationResult } from "@/lib/types";
import { z } from "zod";

const estimateQuerySchema = z.object({
    adresse: z.string().min(5, "L'adresse doit faire au moins 5 caractères.").max(150, "Adresse trop longue."),
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const parsed = estimateQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
        return NextResponse.json(
            { success: false, error: parsed.error.issues[0].message },
            { status: 400 }
        );
    }

    const { adresse } = parsed.data;

    try {
        // ─── Step 1: Geocode ───
        const banResults = await geocodeAddress(adresse.trim(), 1);
        if (banResults.length === 0) {
            return NextResponse.json(
                { success: false, error: "Adresse non trouvée dans la BAN." },
                { status: 404 }
            );
        }
        const ban = banResults[0];

        // ─── Step 2 & 3: DVF + DPE in parallel ───
        const [mutations, dpeResults] = await Promise.all([
            fetchDvfMutations({
                lat: ban.lat,
                lon: ban.lon,
                dist: 500,
            }).catch((err) => {
                console.warn("[estimate] DVF failed:", err);
                return [];
            }),
            fetchDpe({
                identifiant_ban: ban.id,
            }).catch((err) => {
                console.warn("[estimate] DPE failed:", err);
                return [];
            }),
        ]);

        // Pick the best DPE match (most recent)
        const dpe =
            dpeResults.length > 0
                ? dpeResults.sort(
                    (a, b) =>
                        new Date(b.date_etablissement_dpe).getTime() -
                        new Date(a.date_etablissement_dpe).getTime()
                )[0]
                : null;

        // ─── Step 4: Process & Calculate ───
        const transactions = processTransactions(mutations, dpe);
        const synthese = computeSynthese(transactions, dpe);

        const result: EstimationResult = {
            adresse: ban.label,
            ban,
            dpe,
            transactions,
            synthese,
        };

        return NextResponse.json({ success: true, data: result });
    } catch (err) {
        console.error("[estimate]", err);
        return NextResponse.json(
            { success: false, error: "Erreur lors de l'estimation." },
            { status: 500 }
        );
    }
}
