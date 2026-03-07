import { NextResponse } from "next/server";
import { getSharedDossier } from "@/lib/dossiers";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const shared = await getSharedDossier(token);

  if (!shared) {
    return NextResponse.json(
      { success: false, error: "Ce lien est expiré ou introuvable." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: shared });
}

