import { NextResponse } from "next/server";
import { fetchDpe } from "@/lib/api-clients";
import { z } from "zod";

const dpeQuerySchema = z.object({
    identifiant_ban: z.string().max(50).optional(),
    code_postal: z.string().regex(/^[0-9]{5}$/).optional(),
    adresse: z.string().max(150).optional(),
}).refine(data => data.identifiant_ban || data.code_postal || data.adresse, {
    message: "Au moins un paramètre requis : 'identifiant_ban', 'code_postal', ou 'adresse'.",
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const parsed = dpeQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
        return NextResponse.json(
            { success: false, error: parsed.error.issues[0].message },
            { status: 400 }
        );
    }

    const { identifiant_ban, code_postal, adresse } = parsed.data;

    try {
        const results = await fetchDpe({
            identifiant_ban,
            code_postal,
            adresse,
        });

        return NextResponse.json({ success: true, data: results });
    } catch (err) {
        console.error("[dpe]", err);
        return NextResponse.json(
            { success: false, error: "Erreur lors de la requête DPE." },
            { status: 502 }
        );
    }
}
