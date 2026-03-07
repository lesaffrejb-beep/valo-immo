-- Requêtes paramétrables pour n8n (Postgres node)
-- Important: exécuter `database/schema.sql` puis `database/ingestion_angers_data.sql` avant.

-- 1) UPSERT PLUI
-- Params attendus: :source_feature_id, :libelle_zone, :description, :reglement_url, :commune, :geometry_json
INSERT INTO geo_plui (
  source_feature_id,
  libelle_zone,
  description,
  reglement_url,
  commune,
  geom
)
VALUES (
  :source_feature_id,
  :libelle_zone,
  :description,
  :reglement_url,
  :commune,
  to_multipolygon_4326(:geometry_json::jsonb)
)
ON CONFLICT (source_feature_id)
DO UPDATE SET
  libelle_zone = EXCLUDED.libelle_zone,
  description = EXCLUDED.description,
  reglement_url = EXCLUDED.reglement_url,
  commune = EXCLUDED.commune,
  geom = EXCLUDED.geom;

-- 2) UPSERT ISOCHRONES
-- Params attendus: :source_feature_id, :type_poi, :nom_poi, :temps_trajet_min, :mode_transport, :commune, :geometry_json
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
  :source_feature_id,
  :type_poi,
  :nom_poi,
  :temps_trajet_min,
  :mode_transport,
  :commune,
  to_multipolygon_4326(:geometry_json::jsonb)
)
ON CONFLICT (source_feature_id)
DO UPDATE SET
  type_poi = EXCLUDED.type_poi,
  nom_poi = EXCLUDED.nom_poi,
  temps_trajet_min = EXCLUDED.temps_trajet_min,
  mode_transport = EXCLUDED.mode_transport,
  commune = EXCLUDED.commune,
  geom = EXCLUDED.geom;

-- 3) UPSERT NUISANCES
-- Params attendus: :source_feature_id, :type_nuisance, :niveau_bruit_lden_min, :niveau_bruit_lden_max, :commune, :geometry_json
INSERT INTO geo_nuisances (
  source_feature_id,
  type_nuisance,
  niveau_bruit_lden_min,
  niveau_bruit_lden_max,
  commune,
  geom
)
VALUES (
  :source_feature_id,
  :type_nuisance,
  :niveau_bruit_lden_min,
  :niveau_bruit_lden_max,
  :commune,
  to_multipolygon_4326(:geometry_json::jsonb)
)
ON CONFLICT (source_feature_id)
DO UPDATE SET
  type_nuisance = EXCLUDED.type_nuisance,
  niveau_bruit_lden_min = EXCLUDED.niveau_bruit_lden_min,
  niveau_bruit_lden_max = EXCLUDED.niveau_bruit_lden_max,
  commune = EXCLUDED.commune,
  geom = EXCLUDED.geom;
