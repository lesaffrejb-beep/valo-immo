import { NextResponse } from "next/server";
import { z } from "zod";
import { createSharedDossier } from "@/lib/dossiers";

const payloadSchema = z.object({
  dossier: z.any(),
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
