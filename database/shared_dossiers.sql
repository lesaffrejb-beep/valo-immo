-- ==========================================
-- TABLE: shared_dossiers
-- ==========================================
-- Stockage temporaire des estimations partagées avec les clients
-- Durée de vie suggérée : 48h

CREATE TABLE IF NOT EXISTS public.shared_dossiers (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour la purge rapide ou la recherche par token
CREATE INDEX IF NOT EXISTS idx_shared_dossiers_expires_at ON public.shared_dossiers (expires_at);

-- RLS (Row Level Security) minimal
ALTER TABLE public.shared_dossiers ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre à n'importe qui avec le token de lire son dossier
CREATE POLICY "Enable read access for all users"
ON public.shared_dossiers
FOR SELECT
USING (true);

-- Politique pour permettre au backend (API Route) de créer un dossier partagé
CREATE POLICY "Enable insert access for all users"
ON public.shared_dossiers
FOR INSERT
WITH CHECK (true);
