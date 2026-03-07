-- =========================================================================================
-- INGESTION AUTOMATISÉE ANGERS (Next.js API Cron + Supabase RPC)
-- =========================================================================================
-- Exécuter ce script dans Supabase SQL Editor après `database/schema.sql`.
-- Il crée les fonctions RPC utilisées par `/api/cron/ingest-angers-data`.

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

CREATE OR REPLACE FUNCTION ingest_angers_feature_collection(
  p_dataset TEXT,
  p_feature_collection JSONB
)
RETURNS JSONB AS $$
DECLARE
  feature JSONB;
  props JSONB;
  source_feature_id TEXT;
  upserted_count INTEGER := 0;
BEGIN
  IF p_feature_collection IS NULL OR p_feature_collection->>'type' <> 'FeatureCollection' THEN
    RAISE EXCEPTION 'GeoJSON invalid: FeatureCollection attendu';
  END IF;

  FOR feature IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_feature_collection->'features', '[]'::jsonb))
  LOOP
    props := COALESCE(feature->'properties', '{}'::jsonb);
    source_feature_id := COALESCE(
      feature->>'id',
      props->>'source_feature_id',
      props->>'id',
      p_dataset || '_' || md5(feature::text)
    );

    IF p_dataset = 'plui' THEN
      INSERT INTO geo_plui (
        source_feature_id,
        libelle_zone,
        description,
        reglement_url,
        commune,
        geom
      )
      VALUES (
        source_feature_id,
        COALESCE(props->>'libelle_zone', props->>'zone', 'NC'),
        COALESCE(props->>'description', ''),
        COALESCE(props->>'reglement_url', props->>'url', ''),
        COALESCE(props->>'commune', 'Angers'),
        to_multipolygon_4326(feature->'geometry')
      )
      ON CONFLICT (source_feature_id)
      DO UPDATE SET
        libelle_zone = EXCLUDED.libelle_zone,
        description = EXCLUDED.description,
        reglement_url = EXCLUDED.reglement_url,
        commune = EXCLUDED.commune,
        geom = EXCLUDED.geom;

    ELSIF p_dataset = 'isochrones' THEN
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
        source_feature_id,
        COALESCE(props->>'type_poi', props->>'type', 'transport'),
        COALESCE(props->>'nom_poi', props->>'nom', 'Point de mobilité'),
        COALESCE(NULLIF(props->>'temps_trajet_min', '')::INTEGER, 0),
        COALESCE(props->>'mode_transport', 'pieton'),
        COALESCE(props->>'commune', 'Angers'),
        to_multipolygon_4326(feature->'geometry')
      )
      ON CONFLICT (source_feature_id)
      DO UPDATE SET
        type_poi = EXCLUDED.type_poi,
        nom_poi = EXCLUDED.nom_poi,
        temps_trajet_min = EXCLUDED.temps_trajet_min,
        mode_transport = EXCLUDED.mode_transport,
        commune = EXCLUDED.commune,
        geom = EXCLUDED.geom;

    ELSIF p_dataset = 'nuisances' THEN
      INSERT INTO geo_nuisances (
        source_feature_id,
        type_nuisance,
        niveau_bruit_lden_min,
        niveau_bruit_lden_max,
        commune,
        geom
      )
      VALUES (
        source_feature_id,
        COALESCE(props->>'type_nuisance', props->>'type', 'bruit'),
        COALESCE(NULLIF(props->>'niveau_bruit_lden_min', '')::NUMERIC, 0),
        COALESCE(NULLIF(props->>'niveau_bruit_lden_max', '')::NUMERIC, 0),
        COALESCE(props->>'commune', 'Angers'),
        to_multipolygon_4326(feature->'geometry')
      )
      ON CONFLICT (source_feature_id)
      DO UPDATE SET
        type_nuisance = EXCLUDED.type_nuisance,
        niveau_bruit_lden_min = EXCLUDED.niveau_bruit_lden_min,
        niveau_bruit_lden_max = EXCLUDED.niveau_bruit_lden_max,
        commune = EXCLUDED.commune,
        geom = EXCLUDED.geom;

    ELSE
      RAISE EXCEPTION 'Dataset non supporté: % (attendu: plui | isochrones | nuisances)', p_dataset;
    END IF;

    upserted_count := upserted_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'dataset', p_dataset,
    'upserted_count', upserted_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION ingest_angers_feature_collection(TEXT, JSONB)
IS 'UPSERT massif GeoJSON vers geo_plui / geo_isochrones / geo_nuisances pour cron Next.js.';
