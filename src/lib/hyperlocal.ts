import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { GeoContext } from "@/lib/types";

function getServerSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const key = serviceRoleKey || anonKey;
  if (!supabaseUrl || !key) {
    return null;
  }

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function fetchParcelFeatures(params: { lng: number; lat: number }): Promise<GeoContext | null> {
  const client = getServerSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client.rpc("get_parcel_features", {
    lng: params.lng,
    lat: params.lat,
  });

  if (error || !data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;

  return {
    zone_plui: typeof payload.zone_plui === "string" ? payload.zone_plui : null,
    proximite_tram_10m: Boolean(payload.proximite_tram_10m),
    nuisance_sonore_db: typeof payload.nuisance_sonore_db === "number" ? payload.nuisance_sonore_db : null,
    in_angers_dataset: Boolean(payload.in_angers_dataset),
  };
}
