# Ingestion géospatiale Angers (Supabase + n8n) — Guide exécutable

Ce document est le mode opératoire **humain + LLM friendly** pour charger les datasets hyper-locaux d'Angers dans Supabase/PostGIS.

## 1) Ce qui est déjà fait dans le repo

- Schéma SQL consolidé (tables, index, RPC géospatiale) : `database/schema.sql`.
- Script d'ingestion copiable-collable (UPSERT + helpers GeoJSON) : `database/ingestion_angers_data.sql`.
- Template de workflow n8n : `workflows/n8n/angers_geo_ingestion_template.json`.
- Requêtes SQL n8n prêtes à coller (par table) : `database/ingestion_angers_n8n_queries.sql`.
- Consommation applicative côté API : `src/lib/hyperlocal.ts` + enrichissement de `/api/estimate`.

## 2) Intervention humaine obligatoire (Supabase)

### Étape A — Créer la structure PostGIS
1. Ouvrir **Supabase SQL Editor**.
2. Coller le contenu de `database/schema.sql`.
3. Exécuter.
4. Vérifier que `geo_plui`, `geo_isochrones`, `geo_nuisances` existent.

### Étape B — Charger des premiers jeux de test
1. Toujours dans SQL Editor, coller `database/ingestion_angers_data.sql`.
2. Exécuter.
3. Contrôler la sortie des `SELECT` de vérification à la fin du script.

### Étape C — Configurer les variables côté app
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (recommandé côté serveur pour RPC sans blocage RLS)

> Sans ces variables, l'app garde un fonctionnement dégradé (fallback non bloquant).

## 3) Intervention humaine obligatoire (n8n)

1. Importer `workflows/n8n/angers_geo_ingestion_template.json` dans n8n.
2. Créer la credential `Supabase Postgres` (host/db/user/password de Supabase).
3. Dans le node **Set Config**, renseigner `dataset` et `table_target`.
4. Pour `geo_isochrones` et `geo_nuisances`, dupliquer le bloc d'upsert en reprenant les requêtes de `database/ingestion_angers_n8n_queries.sql`.
5. Lancer manuellement (dataset par dataset), vérifier les volumes, puis passer en cron (ex: mensuel).

## 4) Pourquoi cette organisation

- Évite les copies SQL incohérentes (colonnes alignées avec le schéma réel).
- Rend les imports idempotents via `ON CONFLICT`.
- Prépare le passage à une ingestion industrialisée sans recoder le cœur.
- Permet un fallback applicatif propre si Supabase n'est pas configuré.

## 5) Contrôles de qualité recommandés

- Couverture géographique : vérifier que les géométries tombent bien sur le 49.
- Sanity checks : `COUNT(*)`, `ST_IsValid(geom)`, et test RPC `get_parcel_features`.
- Monitoring n8n : % de lignes upsert, erreurs SQL, temps d'exécution.

## 6) Limites connues

- Le mapping exact des champs dépend du dataset Angers choisi (les noms de propriétés peuvent varier).
- Le template n8n est volontairement générique et doit être ajusté au dataset réel.
- Les politiques RLS doivent être validées selon le mode d'accès choisi (anon vs service role).


## 7) Datasets cibles conseillés (à valider dans data.angers.fr)

- Zoning PLUi (polygones de zonage) -> `geo_plui`
- Accessibilité transports / tram / pôles de mobilité (isochrones/polygones) -> `geo_isochrones`
- Cartographie stratégique du bruit Lden (polygones) -> `geo_nuisances`

> Les noms exacts de datasets peuvent évoluer; valider chaque slug avant planification n8n.
