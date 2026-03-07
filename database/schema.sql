-- ==========================================
-- ARCHITECTURE TRUESQUARE V6 - SCHÉMA POSTGIS
-- ==========================================

-- 1. EXTENSIONS REQUISES
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. TABLES DE DONNÉES GÉOSPATIALES

-- A. Table des ventes immobilières (DVF)
CREATE TABLE IF NOT EXISTS data_dvf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_mutation VARCHAR(50) NOT NULL,
    date_mutation DATE NOT NULL,
    valeur_fonciere NUMERIC(15, 2),
    adresse_numero VARCHAR(10),
    adresse_suffixe VARCHAR(10),
    adresse_nom_voie VARCHAR(255),
    code_postal VARCHAR(5),
    nom_commune VARCHAR(255),
    code_departement VARCHAR(3),
    id_parcelle VARCHAR(20),
    type_local VARCHAR(50),
    surface_reelle_bati INT,
    nombre_pieces_principales INT,
    surface_terrain INT,
    dpe_classe VARCHAR(1),
    geom geometry(Point, 4326)
);

-- B. Table des zones PLUi (Plan Local d'Urbanisme intercommunal - Angers)
CREATE TABLE IF NOT EXISTS geo_plui (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_feature_id TEXT NOT NULL,
    libelle_zone VARCHAR(50) NOT NULL,
    description TEXT,
    reglement_url TEXT,
    commune VARCHAR(100),
    geom geometry(MultiPolygon, 4326) NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- C. Table des Isochrones (Transports & Commodités)
CREATE TABLE IF NOT EXISTS geo_isochrones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_feature_id TEXT NOT NULL,
    type_poi VARCHAR(50) NOT NULL,
    nom_poi VARCHAR(255),
    temps_trajet_min INT NOT NULL,
    mode_transport VARCHAR(20) NOT NULL,
    commune VARCHAR(100),
    geom geometry(MultiPolygon, 4326) NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT geo_isochrones_temps_check CHECK (temps_trajet_min > 0)
);

-- D. Table des nuisances (Bruit - Lden)
CREATE TABLE IF NOT EXISTS geo_nuisances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_feature_id TEXT NOT NULL,
    type_nuisance VARCHAR(50),
    niveau_bruit_lden_min INT,
    niveau_bruit_lden_max INT,
    commune VARCHAR(100),
    geom geometry(MultiPolygon, 4326) NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CONTRAINTES D'UNICITÉ (UPSERT)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_geo_plui_source ON geo_plui (source_feature_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_geo_isochrones_source ON geo_isochrones (source_feature_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_geo_nuisances_source ON geo_nuisances (source_feature_id);

-- 4. INDEX SPATIAUX ET CLASSIQUES
CREATE INDEX IF NOT EXISTS idx_data_dvf_geom ON data_dvf USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_data_dvf_code_postal ON data_dvf (code_postal);
CREATE INDEX IF NOT EXISTS idx_data_dvf_type_local ON data_dvf (type_local);
CREATE INDEX IF NOT EXISTS idx_data_dvf_dpe_classe ON data_dvf (dpe_classe);
CREATE INDEX IF NOT EXISTS idx_geo_plui_geom ON geo_plui USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_geo_isochrones_geom ON geo_isochrones USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_geo_nuisances_geom ON geo_nuisances USING GIST (geom);

-- 5. TRIGGER updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_geo_plui_updated_at ON geo_plui;
CREATE TRIGGER trg_geo_plui_updated_at
BEFORE UPDATE ON geo_plui
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_geo_isochrones_updated_at ON geo_isochrones;
CREATE TRIGGER trg_geo_isochrones_updated_at
BEFORE UPDATE ON geo_isochrones
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_geo_nuisances_updated_at ON geo_nuisances;
CREATE TRIGGER trg_geo_nuisances_updated_at
BEFORE UPDATE ON geo_nuisances
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 6. FONCTION DE RECHERCHE GÉOSPATIALE (RPC)
CREATE OR REPLACE FUNCTION get_parcel_features(lng DOUBLE PRECISION, lat DOUBLE PRECISION)
RETURNS JSON AS $$
DECLARE
    point_geom geometry(Point, 4326);
    zone_plui VARCHAR;
    is_near_tram BOOLEAN;
    nuisance_noise_max INT;
    result JSON;
BEGIN
    point_geom := ST_SetSRID(ST_MakePoint(lng, lat), 4326);

    SELECT p.libelle_zone INTO zone_plui
    FROM geo_plui p
    WHERE ST_Intersects(p.geom, point_geom)
    LIMIT 1;

    SELECT EXISTS (
        SELECT 1
        FROM geo_isochrones i
        WHERE i.type_poi IN ('tramway_b', 'tramway_c', 'tram_stop')
          AND i.temps_trajet_min <= 10
          AND ST_Intersects(i.geom, point_geom)
    ) INTO is_near_tram;

    SELECT MAX(n.niveau_bruit_lden_max) INTO nuisance_noise_max
    FROM geo_nuisances n
    WHERE ST_Intersects(n.geom, point_geom);

    result := json_build_object(
        'zone_plui', zone_plui,
        'proximite_tram_10m', COALESCE(is_near_tram, false),
        'nuisance_sonore_db', nuisance_noise_max,
        'in_angers_dataset', zone_plui IS NOT NULL OR nuisance_noise_max IS NOT NULL
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_parcel_features IS
'Retourne un contexte hyper-local (PLUi, proximité tram, nuisance bruit) pour un point WGS84.';
