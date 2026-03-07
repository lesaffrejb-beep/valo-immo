import { NextResponse } from "next/server";
import { z } from "zod";
import { createSharedDossier } from "@/lib/dossiers";
import type { EstimationResult } from "@/lib/types";

const payloadSchema = z.object({
  dossier: z.record(z.string(), z.unknown()),
  ttlHours: z.number().min(1).max(168).default(48),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Payload invalide." }, { status: 400 });
    }

    const shared = await createSharedDossier(parsed.data.dossier as unknown as EstimationResult, parsed.data.ttlHours);

    return NextResponse.json({
      success: true,
      data: {
        token: shared.token,
        expiresAt: shared.expiresAt,
      },
    });
  } catch (error) {
    console.error("[API/dossiers]", error);
    return NextResponse.json({ success: false, error: "Impossible de créer le lien." }, { status: 500 });
  }
}

