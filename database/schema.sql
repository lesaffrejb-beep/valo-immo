-- ==========================================
-- ARCHITECTURE TRUESQUARE V6 - SCHÉMA POSTGIS
-- ==========================================

-- 1. EXTENSIONS REQUISES
-- L'extension PostGIS est essentielle pour le calcul spatial.
CREATE EXTENSION IF NOT EXISTS postgis;

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
    dpe_classe VARCHAR(1), -- Ex: 'A', 'E', 'F'
    geom geometry(Point, 4326) -- Coordonnées GPS (WGS 84)
);

-- B. Table des zones PLUi (Plan Local d'Urbanisme intercommunal - Angers)
CREATE TABLE IF NOT EXISTS geo_plui (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    libelle_zone VARCHAR(50) NOT NULL, -- Ex: 'UA', 'UB', 'A', 'N'
    description TEXT,
    reglement_url TEXT,
    geom geometry(Polygon, 4326)
);

-- C. Table des Isochrones (Transports & Commodités)
-- Permet de stocker les zones à 5, 10, 15 minutes à pied du Tramway C ou des écoles.
CREATE TABLE IF NOT EXISTS geo_isochrones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_poi VARCHAR(50) NOT NULL, -- Ex: 'tramway_c', 'ecole_primaire'
    nom_poi VARCHAR(255),
    temps_trajet_min INT, -- Ex: 5, 10
    mode_transport VARCHAR(20), -- 'pieton', 'velo', 'voiture'
    geom geometry(Polygon, 4326)
);

-- D. Table des nuisances (Bruit - Lden)
CREATE TABLE IF NOT EXISTS geo_nuisances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_nuisance VARCHAR(50), -- Ex: 'bruit_routier', 'bruit_ferroviaire'
    niveau_bruit_lden_min INT, -- dB(A)
    niveau_bruit_lden_max INT, -- dB(A)
    geom geometry(Polygon, 4326)
);

-- 3. INDEX SPATIAUX (Crucial pour les performances)
CREATE INDEX IF NOT EXISTS idx_data_dvf_geom ON data_dvf USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_geo_plui_geom ON geo_plui USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_geo_isochrones_geom ON geo_isochrones USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_geo_nuisances_geom ON geo_nuisances USING GIST (geom);

-- 4. FONCTION DE RECHERCHE GÉOSPATIALE (RPC)
-- Cette fonction sera appelable depuis Supabase (via supabase.rpc('get_parcel_features'))
-- Elle prend une position (lat, lng) et renvoie les caractéristiques de la zone.

CREATE OR REPLACE FUNCTION get_parcel_features(lng DOUBLE PRECISION, lat DOUBLE PRECISION)
RETURNS JSON AS $$
DECLARE
    point_geom geometry(Point, 4326);
    zone_plui VARCHAR;
    is_near_tram BOOLEAN;
    nuisance_noise_max INT;
    result JSON;
BEGIN
    -- Créer le point géométrique à partir des coordonnées
    point_geom := ST_SetSRID(ST_MakePoint(lng, lat), 4326);

    -- Trouver la zone PLUi de la parcelle
    SELECT libelle_zone INTO zone_plui
    FROM geo_plui
    WHERE ST_Intersects(geom, point_geom)
    LIMIT 1;

    -- Vérifier si la parcelle est dans un isochrone Tramway (< 10 min à pied)
    SELECT EXISTS (
        SELECT 1 FROM geo_isochrones
        WHERE type_poi = 'tramway_c' AND temps_trajet_min <= 10
        AND ST_Intersects(geom, point_geom)
    ) INTO is_near_tram;

    -- Récupérer la pire nuisance sonore (si existante)
    SELECT MAX(niveau_bruit_lden_max) INTO nuisance_noise_max
    FROM geo_nuisances
    WHERE ST_Intersects(geom, point_geom);

    -- Construire le résultat en JSON pour l'API / Frontend
    result := json_build_object(
        'zone_plui', zone_plui,
        'proximite_tram_10m', COALESCE(is_near_tram, false),
        'nuisance_sonore_db', nuisance_noise_max
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Commentaires:
-- Ce fichier peut être exécuté directement dans l'éditeur SQL de Supabase.
