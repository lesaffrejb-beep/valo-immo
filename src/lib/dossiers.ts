import { randomUUID } from "crypto";
import type { EstimationResult } from "@/lib/types";

export interface SharedDossier {
  token: string;
  createdAt: string;
  expiresAt: string;
  dossier: EstimationResult;
}

const store = new Map<string, SharedDossier>();

export function createSharedDossier(dossier: EstimationResult, ttlHours: number) {
  const safeTtl = Number.isFinite(ttlHours) ? Math.min(168, Math.max(1, Math.round(ttlHours))) : 72;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + safeTtl * 60 * 60 * 1000);

  const shared: SharedDossier = {
    token: randomUUID(),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    dossier,
  };

  store.set(shared.token, shared);
  return shared;
}

export function getSharedDossier(token: string) {
  const shared = store.get(token);
  if (!shared) return null;

  if (Date.now() > new Date(shared.expiresAt).getTime()) {
    store.delete(token);
    return null;
  }

  return shared;
}
