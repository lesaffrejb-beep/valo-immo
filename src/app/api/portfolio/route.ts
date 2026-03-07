import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createPortfolioItem,
  listPortfolio,
  PORTFOLIO_STATUSES,
} from "@/lib/portfolio";

const agencySchema = z.string().trim().min(1).max(64).default("default");

const createSchema = z.object({
  agenceId: z.string().trim().min(1).max(64).default("default"),
  adresse: z.string().trim().min(5).max(180),
  prixEstime: z.number().positive(),
  confiance: z.number().min(0).max(1),
  status: z.enum(PORTFOLIO_STATUSES).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const agencyResult = agencySchema.safeParse(url.searchParams.get("agenceId") ?? "default");

  if (!agencyResult.success) {
    return NextResponse.json({ success: false, error: "Identifiant agence invalide." }, { status: 400 });
  }

  const items = await listPortfolio(agencyResult.data);
  return NextResponse.json({ success: true, data: items });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Payload portefeuille invalide." }, { status: 400 });
    }

    const item = await createPortfolioItem(parsed.data.agenceId, {
      adresse: parsed.data.adresse,
      prixEstime: parsed.data.prixEstime,
      confiance: parsed.data.confiance,
      status: parsed.data.status,
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Impossible de sauvegarder le dossier." }, { status: 500 });
  }
}
