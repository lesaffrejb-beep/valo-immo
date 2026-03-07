# Ingestion géospatiale Angers (Supabase + Next.js Cron) — Guide exécutable

> Décision produit: **on retire n8n du runbook principal** pour simplifier l'ops et rester aligné avec la stack du projet.

Ce document est le mode opératoire **humain + LLM friendly** pour charger automatiquement les datasets hyper-locaux d'Angers dans Supabase/PostGIS.

## 1) Ce qui est déjà fait dans le repo

- Schéma SQL consolidé (tables, index, RPC géospatiale) : `database/schema.sql`.
- Script SQL d'exemple (helpers + fausses données de test) : `database/ingestion_angers_data.sql`.
- Script SQL production pour cron API : `database/ingestion_angers_cron.sql`.
- API Route cron sécurisée : `src/app/api/cron/ingest-angers-data/route.ts`.
- Planification Vercel Cron hebdomadaire : `vercel.json`.

## 2) Intervention humaine obligatoire (Supabase)

### Étape A — Créer la structure PostGIS
1. Ouvrir **Supabase SQL Editor**.
2. Coller le contenu de `database/schema.sql`.
3. Exécuter.
4. Vérifier que `geo_plui`, `geo_isochrones`, `geo_nuisances` existent.

### Étape B — Installer la fonction d'ingestion RPC (copier/coller)
1. Toujours dans SQL Editor, coller `database/ingestion_angers_cron.sql`.
2. Exécuter.
3. Vérifier la création de `ingest_angers_feature_collection`.

### Étape C — (Optionnel) Charger des données de test
1. Coller `database/ingestion_angers_data.sql`.
2. Exécuter.
3. Contrôler les `SELECT` de vérification en bas du script.

## 3) Intervention humaine obligatoire (Variables d'environnement)

Définir ces variables sur Vercel (ou environnement serveur):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `ANGERS_PLUI_GEOJSON_URL`
- `ANGERS_ISOCHRONES_GEOJSON_URL`
- `ANGERS_NUISANCES_GEOJSON_URL`

> L'API route accepte `Authorization: Bearer <CRON_SECRET>` ou `x-cron-secret: <CRON_SECRET>`.

## 4) Planification

La planification hebdomadaire est déclarée dans `vercel.json`:

- chemin: `/api/cron/ingest-angers-data`
- fréquence: `0 4 * * 1` (lundi 04:00 UTC)

Tu peux déclencher manuellement avec curl :

```bash
curl -X POST "https://<ton-domaine>/api/cron/ingest-angers-data" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 5) Pourquoi cette organisation

- **Moins de surface opérationnelle**: pas de n8n à maintenir.
- **Idempotence**: chaque ingestion est en `ON CONFLICT` côté SQL.
- **Source de vérité unique**: le mapping dataset vit dans la fonction SQL Supabase.
- **Observabilité simple**: la route renvoie un rapport dataset par dataset (`ok`, `skipped`, `error`).

## 6) Contrôles de qualité recommandés

- Couverture géographique: vérifier que les géométries tombent bien sur le 49.
- Sanity checks: `COUNT(*)`, `ST_IsValid(geom)`, et test RPC `get_parcel_features`.
- Monitoring cron: inspecter la réponse JSON de la route (upserted_count par dataset).

## 7) Limites connues

- Le mapping exact des champs dépend des propriétés retournées par l'Open Data Angers.
- Les jeux de données doivent être des GeoJSON `FeatureCollection`.
- Les politiques RLS doivent rester compatibles avec l'usage service-role côté serveur.
