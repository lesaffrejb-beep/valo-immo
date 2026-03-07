-- =========================================================================================
-- TUTORIEL D'INGESTION DES DONNÉES GÉOSPATIALES (ANGERS LOIRE MÉTROPOLE)
-- =========================================================================================
-- 
-- UTILISATION :
-- Ces requêtes servent de base pour alimenter les tables PostGIS (geo_plui, geo_isochrones, geo_nuisances) 
-- créées dans `schema.sql`. Elles sont destinées à être copiées-collées dans l'Éditeur SQL de Supabase,
-- ou à être appelées par vos workflows n8n via un nœud "Postgres" ou l'API REST de Supabase.
-- 
-- RAPPEL DU CONTEXTE "HYPER-LOCAL 49" :
-- Étant donné la stratégie locale de TrueSquare V6, vous ne chargerez ici QUE les données du Maine-et-Loire.
-- Vous pouvez sourcer ces données depuis le portail Open Data d'Angers Loire Métropole :
-- https://data.angers.fr/
--
-- =========================================================================================


-- -----------------------------------------------------------------------------------------
-- 1. EXEMPLE : INGESTION D'UN ZONAGE PLUi (Plan Local d'Urbanisme Intercommunal)
-- -----------------------------------------------------------------------------------------
-- Procédure si vous insérez manuellement un bout de GeoJSON ou si un workflow n8n boucle sur les entités.
-- n8n mapping suggéré :
-- zone_name = {{$json.properties.libelle}}
-- geom = {{$json.geometry}}

INSERT INTO geo_plui (zone_name, description, geom)
VALUES (
    'Ubc', -- Exemple : Zone urbaine mixte
    'Zone urbaine mixte à vocation d''habitat, d''activités et de commerces',
    -- On convertit le GeoJSON (texte strict) en géométrie PostGIS SRID 4326 (WGS 84)
    ST_SetSRID(ST_GeomFromGeoJSON('{
        "type": "Polygon",
        "coordinates": [
            [
                [-0.560123, 47.472134],
                [-0.559123, 47.472134],
                [-0.559123, 47.471134],
                [-0.560123, 47.471134],
                [-0.560123, 47.472134]
            ]
        ]
    }'), 4326)
);


-- -----------------------------------------------------------------------------------------
-- 2. EXEMPLE : INGESTION D'ISOCHRONES (Tramway, Écoles)
-- -----------------------------------------------------------------------------------------
-- Ici, on stocke la zone d'accessibilité à 5-10min à pied d'un point d'intérêt.
-- Ces données augmentent le Score de Quartier (Neighborhood Score) en temps réel.

INSERT INTO geo_isochrones (poi_type, travel_time_mins, transport_mode, geom)
VALUES (
    'tram_stop', 
    5, -- 5 minutes
    'walking', -- à pied
    ST_SetSRID(ST_GeomFromGeoJSON('{
        "type": "Polygon",
        "coordinates": [
            [
                [-0.550123, 47.475134],
                [-0.549123, 47.475134],
                [-0.549123, 47.474134],
                [-0.550123, 47.474134],
                [-0.550123, 47.475134]
            ]
        ]
    }'), 4326)
);


-- -----------------------------------------------------------------------------------------
-- 3. EXEMPLE : INGESTION CARTE DU BRUIT (Nuisances)
-- -----------------------------------------------------------------------------------------
-- Pour identifier les parcelles impactées par des décibels > 65dB (Lden) sur Angers.

INSERT INTO geo_nuisances (source_type, noise_level_db, geom)
VALUES (
    'road', -- Type de trafic (routier)
    '65-70', -- Tranche de décibels
    ST_SetSRID(ST_GeomFromGeoJSON('{
        "type": "Polygon",
        "coordinates": [
            [
                [-0.570123, 47.482134],
                [-0.569123, 47.482134],
                [-0.569123, 47.481134],
                [-0.570123, 47.481134],
                [-0.570123, 47.482134]
            ]
        ]
    }'), 4326)
);


-- =========================================================================================
-- OPTIONNEL : BULK INSERT (UPSERT) VIA API N8N (SUPABASE BULK ENDPOINT)
-- =========================================================================================
-- Plutôt que de faire 10 000 requêtes INSERT, la meilleure pratique avec n8n est d'utiliser 
-- le endpoint REST de Supabase en appelant directement l'API d'insertion multiple :
--
-- MÉTHODE : POST
-- URL : https://[votre_projet].supabase.co/rest/v1/geo_plui
-- HEADERS :
--   apikey: [votre_anon_key ou service_role_key]
--   Authorization: Bearer [votre_anon_key ou service_role_key]
--   Content-Type: application/json
--   Prefer: return=minimal
--
-- BODY JSON (Array d'objets) :
-- [
--   { "zone_name": "Ubc", "description": "...", "geom": "...(ici utiliser ST_AsGeoJSON si besoin en select, mais pour l'insert pur en REST, Supabase PostGIS accepte le format WKT (Well-Known Text) ou directement le GeoJSON comme Feature si on setup un trigger/cast spécifique)" },
--   { ... }
-- ]
-- NOTE IMPORTANTE: Par API REST native, Supabase attend du GeoJSON sous forme d'un objet JSON si la colonne est géométrique, ou du WKT string ('POLYGON((...))'). Le WKT est souvent plus facile à générer côté n8n.
-- =========================================================================================
