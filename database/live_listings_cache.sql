-- Migration : live_listings_cache
-- Cache géospatial pour les annonces actives scrapées (LeBonCoin, SeLoger)
-- Durée de vie : 6 heures (un cron ou trigger cleanup peut purger les entrées expirées)
-- À exécuter dans Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS public.live_listings_cache (
    id              TEXT PRIMARY KEY,
    source          TEXT NOT NULL CHECK (source IN ('leboncoin', 'seloger')),
    title           TEXT,
    url             TEXT,
    price           INTEGER NOT NULL CHECK (price > 0),
    surface_m2      NUMERIC(6, 2),
    rooms           SMALLINT,
    dpe_letter      CHAR(1) CHECK (dpe_letter IN ('A','B','C','D','E','F','G')),
    ges_letter      CHAR(1) CHECK (ges_letter IN ('A','B','C','D','E','F','G')),
    city            TEXT,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    distance_m      INTEGER,
    price_m2        INTEGER,
    published_at    DATE,
    scraped_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index géospatial (pour une future RPC PostGIS ST_DWithin)
-- Requiert que la colonne geography soit créée via ALTER TABLE si PostGIS est activé
-- CREATE INDEX IF NOT EXISTS live_listings_cache_geo_idx
--     ON public.live_listings_cache
--     USING GIST (ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography);

-- Index temporel pour le filtre d'expiration (6h)
CREATE INDEX IF NOT EXISTS live_listings_cache_scraped_at_idx
    ON public.live_listings_cache (scraped_at DESC);

-- RLS : accessible en lecture depuis le service role et l'anon (données publiques non sensibles)
ALTER TABLE public.live_listings_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access" ON public.live_listings_cache
    USING (true)
    WITH CHECK (true);

-- Fonction de nettoyage des entrées expirées (> 6h)
CREATE OR REPLACE FUNCTION public.cleanup_live_listings_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.live_listings_cache
    WHERE scraped_at < NOW() - INTERVAL '6 hours';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.live_listings_cache IS
    'Cache géospatial 6h des annonces immobilières actives (LeBonCoin/SeLoger) — module Live Scraping TrueSquare V6';
