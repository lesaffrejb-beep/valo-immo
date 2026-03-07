-- =========================================================================================
-- TUTORIEL D'INGESTION DES DONNÉES GÉOSPATIALES (ANGERS LOIRE MÉTROPOLE)
-- =========================================================================================
-- Objectif: fournir des blocs SQL immédiatement copiable/collable dans Supabase SQL Editor.
-- Prérequis: avoir exécuté `database/schema.sql`.

-- -----------------------------------------------------------------------------------------
-- 0) UTILITAIRES SQL
-- -----------------------------------------------------------------------------------------

-- Convertit n'importe quelle géométrie GeoJSON en MultiPolygon SRID 4326.
CREATE OR REPLACE FUNCTION to_multipolygon_4326(geojson_input JSONB)
RETURNS geometry(MultiPolygon, 4326) AS $$
DECLARE
  geom_4326 geometry;
BEGIN
  geom_4326 := ST_SetSRID(ST_GeomFromGeoJSON(geojson_input::text), 4326);
  IF GeometryType(geom_4326) = 'POLYGON' THEN
    RETURN ST_Multi(geom_4326)::geometry(MultiPolygon, 4326);
  END IF;
  RETURN geom_4326::geometry(MultiPolygon, 4326);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- -----------------------------------------------------------------------------------------
-- 1) UPSERT PLUI (1 feature)
-- -----------------------------------------------------------------------------------------
-- À remplir depuis n8n (HTTP -> Set -> Postgres) ou manuellement.

INSERT INTO geo_plui (
  source_feature_id,
  libelle_zone,
  description,
  reglement_url,
  commune,
  geom
)
VALUES (
  'plui_angers_0001',
  'UA',
  'Zone urbaine centre',
  'https://data.angers.fr/',
  'Angers',
  to_multipolygon_4326('{"type":"Polygon","coordinates":[[[-0.560123,47.472134],[-0.559123,47.472134],[-0.559123,47.471134],[-0.560123,47.471134],[-0.560123,47.472134]]]}')
)
ON CONFLICT (source_feature_id)
DO UPDATE SET
  libelle_zone = EXCLUDED.libelle_zone,
  description = EXCLUDED.description,
  reglement_url = EXCLUDED.reglement_url,
  commune = EXCLUDED.commune,
  geom = EXCLUDED.geom;

-- -----------------------------------------------------------------------------------------
-- 2) UPSERT ISOCHRONE (1 feature)
-- -----------------------------------------------------------------------------------------

INSERT INTO geo_isochrones (
  source_feature_id,
  type_poi,
  nom_poi,
  temps_trajet_min,
  mode_transport,
  commune,
  geom
)
VALUES (
  'iso_tram_c_5m_0001',
  'tramway_c',
  'Station Foch-Maison Bleue',
  5,
  'pieton',
  'Angers',
  to_multipolygon_4326('{"type":"Polygon","coordinates":[[[-0.550123,47.475134],[-0.549123,47.475134],[-0.549123,47.474134],[-0.550123,47.474134],[-0.550123,47.475134]]]}')
)
ON CONFLICT (source_feature_id)
DO UPDATE SET
  type_poi = EXCLUDED.type_poi,
  nom_poi = EXCLUDED.nom_poi,
  temps_trajet_min = EXCLUDED.temps_trajet_min,
  mode_transport = EXCLUDED.mode_transport,
  commune = EXCLUDED.commune,
  geom = EXCLUDED.geom;

-- -----------------------------------------------------------------------------------------
-- 3) UPSERT NUISANCE BRUIT (1 feature)
-- -----------------------------------------------------------------------------------------

INSERT INTO geo_nuisances (
  source_feature_id,
  type_nuisance,
  niveau_bruit_lden_min,
  niveau_bruit_lden_max,
  commune,
  geom
)
VALUES (
  'noise_road_65_70_0001',
  'bruit_routier',
  65,
  70,
  'Angers',
  to_multipolygon_4326('{"type":"Polygon","coordinates":[[[-0.570123,47.482134],[-0.569123,47.482134],[-0.569123,47.481134],[-0.570123,47.481134],[-0.570123,47.482134]]]}')
)
ON CONFLICT (source_feature_id)
DO UPDATE SET
  type_nuisance = EXCLUDED.type_nuisance,
  niveau_bruit_lden_min = EXCLUDED.niveau_bruit_lden_min,
  niveau_bruit_lden_max = EXCLUDED.niveau_bruit_lden_max,
  commune = EXCLUDED.commune,
  geom = EXCLUDED.geom;

-- -----------------------------------------------------------------------------------------
-- 4) Vérifications rapides (copier/coller)
-- -----------------------------------------------------------------------------------------
SELECT 'geo_plui' AS table_name, COUNT(*) AS rows_count FROM geo_plui
UNION ALL
SELECT 'geo_isochrones', COUNT(*) FROM geo_isochrones
UNION ALL
SELECT 'geo_nuisances', COUNT(*) FROM geo_nuisances;

SELECT get_parcel_features(-0.55, 47.47);

-- -----------------------------------------------------------------------------------------
-- 5) Modèle de payload n8n prêt à mapper
-- -----------------------------------------------------------------------------------------
-- Dans n8n, mappez chaque feature vers ces clés (Set Node):
-- {
--   "source_feature_id": "={{$json.id}}",
--   "libelle_zone": "={{$json.properties.libelle_zone || $json.properties.zone}}",
--   "description": "={{$json.properties.description || ''}}",
--   "reglement_url": "={{$json.properties.reglement_url || ''}}",
--   "commune": "={{$json.properties.commune || 'Angers'}}",
--   "geometry": "={{JSON.stringify($json.geometry)}}"
-- }
-- Ensuite dans Postgres Node utilisez le SQL d'UPSERT PLUI en remplaçant les valeurs par
-- :source_feature_id, :libelle_zone, etc. et to_multipolygon_4326(:geometry::jsonb)
-- =========================================================================================
