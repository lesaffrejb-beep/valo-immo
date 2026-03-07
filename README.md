# TrueSquare V6 - Estimateur Hyper-Local (Maine-et-Loire 49)

**⚠️ Stratégie de développement : Avant de penser national, l'outil est "hard focus" sur le département du Maine-et-Loire (49). Il n'y a pas besoin de charger ou de télécharger les données massives de la France entière.**

**Le moteur de valorisation premium, transparent et interactif pour les professionnels de l'immobilier du bassin Angevin.**

![TrueSquare Concept](https://img.shields.io/badge/Status-Beta_V6-brass?style=for-the-badge) ![Tech](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js) ![Styling](https://img.shields.io/badge/TailwindCSS-v3-blue?style=for-the-badge&logo=tailwindcss)

TrueSquare est une PropTech B2B qui redonne le pouvoir à l'agent immobilier. En croisant la donnée brute irréfutable de l'État (DVF, DPE) avec l'intelligence terrain de l'expert, l'application génère des dossiers d'estimation interactifs d'un niveau de détails et de prestige inédit.

## 🚀 Fonctionnalités "Big Tech Edition" (V6)

- **Transparence Absolue (DVF & DPE) :** Interrogation en temps réel des bases de données de l'État sur le territoire angevin.
- **Micro-Marché Hyper-Local (49) :** Croisement spatial (PostGIS) du PLUi d'Angers Loire Métropole et isochrones (Lignes de Tramway B/C, Ecoles, Nuisances sonores).
- **Moteur G-XGBoost & Explicabilité SHAP :** Remplacement de la médiane naïve par une prédiction ML avec "Waterfall Plot" d'explicabilité pour chaque feature.
- **Rapport d'Expertise Cinematic (Style Apple) :** Un mode présentation plein-écran luxueux figeant les paramètres pour l'export PDF "Private Banking".
- **Stress-Test Acheteur (Style PayPal) :** Simulation financière ultra-rapide (Apport, Taux, Cashflow) pour démontrer la capacité d'emprunt.
- **Scoring de Liquidité (Style Microsoft) :** Analyse de la rotation du parc immobilier pour statuer sur la tension du marché local et le délai de vente.
- **Ajustements Réglementaires & Hédonistes :** Décotes chiffrées automatiques sur la Loi Climat (Passoires DPE) et le risque Loi Alur (Absence de PPT en copropriété). L'agent sculpte également le prix en modifiant dynamiquement l'état du bien, les extérieurs et la vue.
- **Rénovation Énergétique :** Détection d'un DPE Passoire (E, F ou G) et application automatique d'une décote travaux chiffrée.
- **Micro-Marché & Isochrones (49) :** Score de quartier dynamique sur 10 (transports, écoles, commerces alimentaires) basé sur les données d'Angers Loire Métropole. Points d'appui visite prêts à pitcher en rendez-vous.

## 🛠 Stack Technique (V6 Architecture)

- **Frontend Tunnel :** Next.js 14 (App Router) + Tailwind CSS (UI Premium)
- **Backend Data & Géospatial :** Supabase (PostgreSQL + PostGIS) (DVF, PLUi, Isochrones)
- **Moteur Machine Learning :** Microservice FastAPI Python (G-XGBoost + SHAP)
- **Data Ingestion :** Workflows n8n (Aspiration GeoJSON Angers, traitement BAN)
- **Composants :** UI ultra-légère (from scratch)

## 📦 Lancement Local

```bash
git clone https://github.com/votre-nom/true-square.git
cd true-square
npm install
npm run dev
```

Rendez-vous sur [http://localhost:3000](http://localhost:3000)

## 🧠 Comment fonctionne le moteur de calcul (version humaine)

Voici le calcul expliqué simplement, pour quelqu'un d'extérieur :

1. **On trouve l'adresse exacte** avec la BAN (Base Adresse Nationale).
2. **On récupère les ventes DVF autour du bien** (rayon local) et le DPE du bien si disponible.
3. **On garde uniquement les ventes pertinentes et récentes** (biens résidentiels, prix/surface valides, et transactions des 5 dernières années).
4. **On calcule 2 prix au m²** :
   - `naïf` = prix / surface DVF brute
   - `corrigé` = prix ajusté (ex: garage retiré en forfait) / surface pondérée
5. **On prend la médiane** pour éviter qu'une vente extrême fausse tout le résultat.
6. **On calcule un score de confiance** basé sur : présence DPE, nombre de comparables, fraîcheur des ventes.

Résultat : un prix lisible, argumentable, et moins sensible aux anomalies de terrain.

## ✅ Fiabilisation mise en place

- **Filtre de fraîcheur** : les mutations trop anciennes (> 5 ans) sont exclues du moteur.
- **Garde-fous mathématiques** : arrondis robustes (`NaN` / `Infinity` neutralisés).
- **Signal qualité intégré** dans la synthèse API :
  - `stale_data` (donnée potentiellement vieillissante),
  - `sample_size_ok` (échantillon statistiquement acceptable),
  - `has_dpe` (présence de source énergétique fiable).

## 🔐 Architecture cible

L'architecture sépare strictement le backend transactionnel/data (Supabase/PostGIS) du runtime de calcul intensif (FastAPI/XGBoost), offrant :

- Scalabilité pour l'ingestion massive des DVF et PLUi.
- Performances dédiées pour la génération arborescente SHAP, impossible sur Edge Functions Vercel/Supabase.

## 🗺 Vision & Roadmap

Découvrez la philosophie du projet dans le document [L'ÂME DE TRUESQUARE](./L_AME.md) et consultez le futur de l'application dans la [ROADMAP](./ROADMAP.md).

## 🧱 Opérations Data Hyper-Locale (Angers)

- Schéma PostGIS prêt Supabase : [`database/schema.sql`](./database/schema.sql)
- Script SQL d'ingestion copy/paste : [`database/ingestion_angers_data.sql`](./database/ingestion_angers_data.sql)
- Requêtes SQL n8n paramétrables : [`database/ingestion_angers_n8n_queries.sql`](./database/ingestion_angers_n8n_queries.sql)
- Workflow n8n template : [`workflows/n8n/angers_geo_ingestion_template.json`](./workflows/n8n/angers_geo_ingestion_template.json)
- Runbook humain (Supabase + n8n) : [`docs/operations/INGESTION_ANGERS_SUPABASE_N8N.md`](./docs/operations/INGESTION_ANGERS_SUPABASE_N8N.md)
- Revue critique architecture/exécution : [`docs/ARCHITECTURE_EXECUTION_REVIEW.md`](./docs/ARCHITECTURE_EXECUTION_REVIEW.md)

## 🧭 Philosophie Produit (version Directeur d'Agence)

TrueSquare suit une philosophie simple : **moins de bruit, plus de décisions**.

- **Approche Apple (clarté premium)** : une interface qui retire la complexité inutile, met en avant les signaux clés, et transforme un calcul en décision immédiate.
- **Approche Airbnb (confiance par la transparence)** : l'utilisateur voit les preuves (comparables, filtres, qualité data), contrôle les exclusions, et comprend instantanément le “pourquoi” du prix.
- **Approche terrain immobilier** : chaque fonctionnalité doit améliorer au moins un des 3 leviers agence :
  1. prise de mandat,
  2. vitesse de conversion,
  3. pilotage du portefeuille.

En pratique : TrueSquare n'est pas un gadget d'estimation. C'est un **système d'aide au closing** pour agents et directeurs.

## 🧠 Lecture pour Humains ET LLMs

### Entrées métier

- Adresse BAN (géocodage)
- Transactions DVF
- DPE (quand disponible)

### Sorties métier

- Prix/m² médian corrigé
- Indice de confiance
- Warnings qualité
- Dossier partageable (expiration)
- Pipeline directeur (portefeuille statuts)

### Nouveau module livré : Score de Quartier (Isochrone)

**Pourquoi c'est stratégique (vision Directeur d'Agence)**

- **Urgence marché :** les vendeurs et acquéreurs arbitrent aujourd'hui la valeur sur le confort de vie réel (mobilité, écoles, commerces), pas seulement sur le m².
- **Impact business :** l'agent arrive en visite avec des preuves concrètes de desserte pour accélérer la décision et réduire les objections.
- **Différenciation :** discours instantané “data + terrain” rare chez les estimateurs classiques centrés uniquement sur l'historique DVF.

**Ce qui a été implémenté**

- Calcul backend d'un `global_score` /10 via Overpass (OpenStreetMap) sur un rayon piéton de 1 200 m.
- Sous-scores lisibles par catégorie : `transport`, `schools`, `food` (0–10) + densité à 5 et 10 minutes à pied + distance du point le plus proche.
- “Top amenities” (5 POI les plus proches) pour préparer un argumentaire de visite concret.
- Exposition du score directement dans la réponse `/api/estimate` pour garantir la cohérence front/back.
- Carte de restitution UI dédiée dans le flux principal de résultats (sans surcharge), avec fallback élégant si la source est indisponible.

### Surfaces fonctionnelles principales

- `src/app/page.tsx` : expérience agent (recherche + estimation).
- `src/components/SyntheseCard.tsx` : moteur d'argumentaire visuel premium.
- `src/components/DossierActions.tsx` : actions CRM (sauvegarde + partage + envoi portefeuille).
- `src/app/agence/page.tsx` : cockpit directeur (KPIs + suivi statuts).
- `src/app/api/portfolio/*` : API portefeuille agence (GET/POST/PATCH).
- `src/lib/portfolio.ts` : persistance JSON locale du portefeuille.
- `src/lib/neighborhood.ts` : moteur isochrone quartier (Overpass OSM, scoring 0–10).
- `src/components/NeighborhoodScoreCard.tsx` : bloc UI “Score de Quartier” intégré à l'expérience agent.

### Règle d'or d'évolution

Toute nouvelle fonctionnalité doit répondre à :

1. **Urgence terrain** (utilisable en rendez-vous dès maintenant),
2. **Impact business** (mandat, conversion, productivité),
3. **Différenciation** (preuve, transparence, expérience premium).
