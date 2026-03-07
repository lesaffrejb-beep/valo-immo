import { NextResponse } from "next/server";
import { geocodeAddress, fetchDvfMutations, fetchDpe } from "@/lib/api-clients";
import { processTransactions, computeSynthese, computeShapMock } from "@/lib/calculation-engine";
import { computeNeighborhoodScore } from "@/lib/neighborhood";
import { fetchParcelFeatures } from "@/lib/hyperlocal";
import { fetchLiveMarketSnapshot } from "@/lib/live-market";
import type { EstimationResult } from "@/lib/types";
import { z } from "zod";

const estimateQuerySchema = z.object({
    adresse: z.string().min(5, "L'adresse doit faire au moins 5 caractères.").max(150, "Adresse trop longue."),
    typeBien: z.string().optional(),
    surface: z.number().optional(),
    dpe: z.string().optional(),
    pptVote: z.boolean().nullable().optional(),
});

export async function POST(request: Request) {
    const body = await request.json();
    const parsed = estimateQuerySchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { success: false, error: parsed.error.issues[0].message },
            { status: 400 }
        );
    }

    const { adresse, dpe: wizardDpe } = parsed.data;

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

        let dvfUnavailable = false;

        // ─── Step 2 & 3: DVF + DPE in parallel ───
        const [mutations, dpeResults] = await Promise.all([
            fetchDvfMutations({
                lat: ban.lat,
                lon: ban.lon,
                dist: 500,
            }).catch((err) => {
                dvfUnavailable = true;
                console.warn("[estimate] DVF failed, fallback to empty:", err);
                return [];
            }),
            fetchDpe({
                identifiant_ban: ban.id,
            }).catch((err) => {
                console.warn("[estimate] DPE failed:", err);
                return [];
            }),
        ]);

        // Pick the best DPE match (most recent), OR override with wizard DPE
        let dpe =
            dpeResults.length > 0
                ? dpeResults.sort(
                    (a, b) =>
                        new Date(b.date_etablissement_dpe).getTime() -
                        new Date(a.date_etablissement_dpe).getTime()
                )[0]
                : null;

        if (wizardDpe && dpe) {
            dpe = { ...dpe, etiquette_dpe: wizardDpe };
        }

        // ─── Step 4: Process & Calculate ───
        const transactions = processTransactions(mutations, dpe);
        const synthese = computeSynthese(transactions, dpe);
        const [neighborhood, geoContext, liveMarket] = await Promise.all([
            computeNeighborhoodScore({ lat: ban.lat, lon: ban.lon }),
            fetchParcelFeatures({ lat: ban.lat, lng: ban.lon }),
            fetchLiveMarketSnapshot({ ban }),
        ]);
        const shap_analysis = computeShapMock(synthese, parsed.data);

        const warnings: string[] = [];

        if (dvfUnavailable) {
            warnings.push("Les serveurs DVF sont temporairement indisponibles. L'estimation est affichée avec des données partielles.");
        } else if (transactions.length === 0) {
            warnings.push("Aucune transaction DVF exploitable n'a été trouvée dans ce périmètre. Élargissez la zone ou vérifiez l'adresse.");
        }


        warnings.push("Module Live Scraping concurrents (beta) activé : annonces à vendre LeBonCoin/SeLoger affichées pour le pitch de positionnement en rendez-vous.");

        const result: EstimationResult = {
            adresse: ban.label,
            ban,
            dpe,
            transactions,
            synthese,
            neighborhood: neighborhood || undefined,
            geo_context: geoContext || undefined,
            live_market: liveMarket,
            shap_analysis,
            warnings: warnings.length > 0 ? warnings : undefined,
        };

        return NextResponse.json({ success: true, data: result });
    } catch (err: unknown) {
        console.error("[estimate]", err);

        return NextResponse.json(
            { success: false, error: "Erreur lors de l'estimation." },
            { status: 500 }
        );
    }
}
