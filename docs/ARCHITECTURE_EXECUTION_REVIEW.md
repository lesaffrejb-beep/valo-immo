# Revue critique d'exécution — Architecture hyper-locale (Maine-et-Loire)

## Lecture critique de l'état actuel

### Forces déjà en place
- Pipeline estimation opérationnel (BAN + DVF + DPE + moteur de synthèse).
- UX orientée agent avec modules différenciants (liquidité, stress-test, argumentaire).
- Première brique neighborhood scoring déjà déployée (Overpass/OSM).

### Faiblesses observées avant cette mise à jour
- Incohérence SQL: script d'ingestion utilisait des noms de colonnes non alignés avec le schéma (`zone_name`, `poi_type`, etc.).
- Architecture hyper-locale partiellement décrite mais pas entièrement « exécutable » pour une équipe ops.
- Absence de dossier central regroupant scripts copy/paste + workflow n8n prêt à importer.
- Faible explicitation des interventions humaines nécessaires (Supabase, n8n, variables d'environnement).

## Ce qui a été corrigé dans ce cycle

1. **Alignement schéma/ingestion**
   - Schéma consolidé avec contraintes d'unicité et UPSERT-ready.
   - Script ingestion SQL réécrit pour matcher strictement les tables.

2. **Branchement applicatif hyper-local**
   - Ajout d'un client serveur RPC (`get_parcel_features`) pour consommer les signaux PostGIS.
   - Intégration dans la route `/api/estimate` sans casser le fallback existant.

3. **Industrialisation documentaire**
   - Guide opératoire étape par étape (Supabase + n8n).
   - Workflow n8n template importable pour ingestion Angers.

## Prochaines priorités (ordre recommandé)

1. **Source of Truth géospatial**
   - Basculer le score neighborhood principal sur Supabase/PostGIS pour sortir de la dépendance Overpass.
2. **Feature store ML**
   - Persister les features géospatiales dérivées pour entraîner/réentraîner le modèle XGBoost.
3. **Observabilité data**
   - Ajouter dashboards de fraîcheur/qualité (n8n + Supabase + taux d'échec par dataset).
4. **Sécurité/RLS**
   - Formaliser les policies RLS pour RPC lecture et ingestion service role.

## Définition de “Done architecture” (pragmatique)
- [ ] Ingestion planifiée et monitorée en production (n8n cron + alerting).
- [ ] Tables géospatiales complètes pour Angers Loire Métropole.
- [ ] RPC `get_parcel_features` testée sur échantillon d'adresses réelles.
- [ ] API `/estimate` renvoie systématiquement `geo_context` quand les données existent.
- [ ] Documentation runbook validée par un humain non-dev (opération réussie sans aide).


## Correctifs complémentaires (itération suivante)

- Durcissement du schéma: `source_feature_id` passé en `NOT NULL` pour garantir l'idempotence effective des UPSERT.
- Ajout d'un fichier SQL dédié aux requêtes n8n par table (`database/ingestion_angers_n8n_queries.sql`) pour éviter les requêtes dynamiques fragiles.
- Simplification du template n8n pour un flux plus lisible et moins sujet aux erreurs de mapping.
