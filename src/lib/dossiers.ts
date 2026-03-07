import type { EstimationResult } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export interface SharedDossier {
  token: string;
  createdAt: string;
  expiresAt: string;
  dossier: EstimationResult;
}

export async function createSharedDossier(dossier: EstimationResult, ttlHours: number): Promise<SharedDossier> {
  const safeTtl = Number.isFinite(ttlHours) ? Math.min(168, Math.max(1, Math.round(ttlHours))) : 72;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + safeTtl * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("shared_dossiers")
    .insert([
      {
        dossier_data: dossier,
        expires_at: expiresAt.toISOString(),
        created_at: now.toISOString(),
      },
    ])
    .select()
    .single();

  if (error || !data) {
    console.error("[dossiers] Error creating shared dossier:", error);
    throw new Error("Impossible de créer le dossier partagé.");
  }

  return {
    token: data.token,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    dossier: data.dossier_data as EstimationResult,
  };
}

export async function getSharedDossier(token: string): Promise<SharedDossier | null> {
  const { data, error } = await supabase
    .from("shared_dossiers")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) {
    console.error("[dossiers] Error GET shared dossier:", error);
    return null;
  }

  // Vérifier l'expiration (Bien que RLS / Purge devrait théoriquement gérer ça, c'est une sécurité)
  if (Date.now() > new Date(data.expires_at).getTime()) {
    return null;
  }

  return {
    token: data.token,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    dossier: data.dossier_data as EstimationResult,
  };
}
