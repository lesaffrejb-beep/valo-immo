import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PORTFOLIO_STATUSES,
  updatePortfolioStatus,
} from "@/lib/portfolio";

const patchSchema = z.object({
  agenceId: z.string().trim().min(1).max(64).default("default"),
  status: z.enum(PORTFOLIO_STATUSES),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Mise à jour invalide." }, { status: 400 });
    }

    const updated = await updatePortfolioStatus(parsed.data.agenceId, id, parsed.data.status);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Dossier introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Impossible de mettre à jour ce dossier." }, { status: 500 });
  }
}
