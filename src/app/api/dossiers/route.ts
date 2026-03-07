import { NextResponse } from "next/server";
import { z } from "zod";
import { createSharedDossier } from "@/lib/dossiers";

const estimationSchema = z.object({
  adresse: z.string().min(5).max(180),
  ban: z.object({
    id: z.string().min(1),
    label: z.string().min(3),
  }).passthrough(),
  dpe: z.unknown().nullable(),
  transactions: z.array(z.unknown()),
  synthese: z.object({
    prix_m2_corrige_median: z.number().nonnegative(),
    surface_reference: z.number().nonnegative(),
    confiance: z.number().min(0).max(1),
  }).passthrough(),
  warnings: z.array(z.string()).optional(),
}).passthrough();

const payloadSchema = z.object({
  dossier: estimationSchema,
  ttlHours: z.number().min(1).max(168).default(72),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Payload invalide." }, { status: 400 });
    }

    const shared = createSharedDossier(parsed.data.dossier, parsed.data.ttlHours);

    return NextResponse.json({
      success: true,
      data: {
        token: shared.token,
        expiresAt: shared.expiresAt,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Impossible de créer le lien." }, { status: 500 });
  }
}
