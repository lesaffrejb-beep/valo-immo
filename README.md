# TrueSquare V6 - Estimateur Immobilier Hyper-Local (Maine-et-Loire 49)

**⚠️ FOCUS STRATÉGIQUE (LLM & Human Context) :**
L'application est **strictement "hard focus" sur le département du Maine-et-Loire (49)**, et particulièrement Angers Loire Métropole.
La philosophie est d'assimiler massivement des "signaux faibles" géospatiaux locaux (tramway, nuisances, PLUi) ignorés par les concurrents nationaux. Il n'y a **aucun intérêt** à charger les données entières de la France ni à appliquer des modèles génériques. Le but est de créer le Terminal Bloomberg de l'immobilier résidentiel angevin.

![TrueSquare Concept](https://img.shields.io/badge/Status-Beta_V6-brass?style=for-the-badge) ![Tech](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js) ![Styling](https://img.shields.io/badge/TailwindCSS-v3-blue?style=for-the-badge&logo=tailwindcss) ![Database](https://img.shields.io/badge/Supabase-PostGIS-green?style=for-the-badge&logo=supabase)

TrueSquare est une PropTech B2B de neuro-vente premium qui redonne le pouvoir à l'agent immobilier. En croisant la donnée brute irréfutable de l'État (DVF, DPE) avec la géographie hyper-locale (PostGIS) et l'intelligence terrain de l'expert, l'application génère des dossiers d'estimation interactifs d'un niveau de détails et de prestige inédit pour garantir la captation du mandat exclusif.

---

## 🚀 Fonctionnalités "Big Tech Edition" (V6)

- **Transparence Absolue (DVF & DPE) :** Interrogation en temps réel des bases de l'État sur le territoire angevin. Exclusions d'outliers style "Airbnb" contrôlées par l'agent.
- **Rapport d'Expertise Cinematic (Style Apple) :** Mode présentation plein-écran ultra-luxueux. UI minimaliste figeant les paramètres pour un export PDF digne du "Private Banking".
- **Micro-Marché Hyper-Local (Isochrones) :** Évaluation dynamique d'un `global_score` /10 du quartier. Analyse spatiale de proximité stricte (Overpass OSM / PostGIS) pour les écoles, commerces, et calcul de distance aux Tramways B/C, fournissant des "points d'appui" verbaux immédiats pour la visite.
- **Stress-Test Acheteur (Style PayPal) :** Simulation financière instantanée (Apport, Taux, Cashflow, Loyers) pour prouver l'attractivité d'un bien en rendement ou démontrer la fiabilité d'un acquéreur potentiel.
- **Scoring de Liquidité (Style Microsoft) :** Analyse de la rotation du parc immobilier local (nombre de mutations par zone) pour estimer visuellement la tension du marché et projeter le délai de vente.
- **Intelligence Réglementaire & Environnementale :**
  - Décotes chiffrées automatiques sur la Loi Climat (Passoires DPE F/G implique décote rénovation).
  - Évaluation d'impact géospatial (Lden Nuisances sonores, zones PLUi restrictives).
- **Moteur G-XGBoost & Explicabilité SHAP :** Transition d'une médiane pure vers du Machine Learning prédictif. Le "Waterfall Plot" permet d'expliquer au vendeur *pourquoi* son bien vaut tel prix, brique par brique.

---

## 🛠 Architecture & Stack Technique

L'architecture est fondamentalement scindée entre la restitution front-end hyper rapide et l'ingestion/interrogation géospatiale lourde en back-end.

- **Frontend Tunnel (Vercel) :** Next.js 14 (App Router) + Tailwind CSS + Radix UI. Interfaces pensées "composants" et interactives, maximisant le framerate et minimisant la friction (Méthode de l'escalier).
- **Backend Data & Géospatial (Supabase) :** PostgreSQL étendu avec **PostGIS**. C'est le cœur du réacteur hyper-local. Les tables stockent les DVF, les emprises du PLUi Angers, les isochrones de transport et les cartes de bruit.
- **Ingestion Automatisée (Cron API) :** Les GeoJSON massifs open-data d'Angers sont ingérés automatiquement (idempotence `ON CONFLICT`) via une API Route Next.js invoquant la fonction RPC native Supabase `ingest_angers_feature_collection`. Zéro dépendance à n8n.
- **Service ML Appliqué (Python) :** Microservice FastAPI gérant l'inférence G-XGBoost et renvoyant les vecteurs SHAP, appelé via l'API Next.js.

---

## 🗺️ Qualité et Robustesse Supabase (Pour LLMs & Devs)

Le backend Supabase du projet est certifié **Production-Ready** pour des volumes locaux conséquents. L'architecture SQL inclut :

1. **Extensions natives activées** : `postgis` pour les intersections spatiales, `pgcrypto` pour le hashing/UUIDs.
2. **Typage Géométrique Strict** : Utilisation de `geometry(MultiPolygon, 4326)` et `geometry(Point, 4326)` pour garantir des requêtes ST_Intersects ultra-performantes.
3. **Indexation spatiale (GIST)** : Présente sur toutes les tables de géodonnées (`data_dvf`, `geo_plui`, `geo_isochrones`, `geo_nuisances`), garantissant de faibles temps de latence au requêtage API.
4. **Logique Métier Encapsulée (RPC)** : Le point d'entrée API principal consomme la fonction RPC `get_parcel_features(lng, lat)`, évitant l'envoi de requêtes SQL complexes depuis le client et garantissant un temps de réponse bas.
5. **Fiabilisation des ingestions** : L'API Cron Next.js attaque Supabase via Service Role, validant en transactionnel des `FeatureCollection` complets, assurant l'idempotence des géométries mises à jour.

> Les scripts liés à la base se trouvent dans `database/schema.sql` (création) et `database/ingestion_angers_cron.sql` (fonctions d'ingestion).

---

## 📦 Runbook Local

```bash
# 1. Cloner et installer
git clone https://github.com/votre-nom/true-square.git
cd true-square
npm install

# 2. Variable d'environnement (ex: Supabase keys)
cp .env.example .env.local

# 3. Lancement
npm run dev
```

Rendez-vous sur [http://localhost:3000](http://localhost:3000)

*(Assurez-vous que votre base Supabase soit provisionnée avec les scripts du dossier `database/`).*

---

## 🧭 Philosophie Produit (Le Manuel du Directeur d'Agence)

TrueSquare suit une ligne directrice impitoyable : **moins de bruit, plus de décisions**.

- **L'Approche Apple (Premium & Clarté) :** Une UI qui retire la charge cognitive. Finis les tableaux Excel incompressibles ; la data d'État est retraitée en signaux lisibles.
- **L'Approche Airbnb (Confiance Transparente) :** L'agent montre la data brute, contrôle les filtres de fraîcheur, inclut/exclut en direct face au vendeur. Le "pourquoi" du prix est incontestable.
- **Impact Terrain B2B :** Chaque brique développée a pour finalité :
  1. Gagner l'exclusivité du mandat en sidérant le prospect.
  2. Justifier une baisse de prix de présentation en se référant aux anomalies locales (nuisances, décote DPE).
  3. Fournir à l'agent des punchlines (points d'intérêt à 5min) factuelles.

---

## 🛣️ Roadmap & Vision

Les fonctionnalités prévues sont classées par priorité de chiffre d'affaires potentiel pour les agences :

- Intégration des annonces actives concurrentes par Web-Scraping (Comparaison Vendu vs À Vendre).
- Micro-Pricing des copropriétés : Ajustement fin des décotes ascenseurs/étages/extérieurs.
- CRM et Cockpit Directeur V2 : Statistiques fines de conversion par négociateur, persistance et liens éphémères de rapports (création d'urgence).

*Consultez [`ROADMAP.md`](./ROADMAP.md) pour la priorisation exhaustive des tâches et [`docs/ARCHITECTURE_HYPER_LOCALE.md`](./docs/ARCHITECTURE_HYPER_LOCALE.md) pour l'approche mathématique.*

---

## 🗂 Règle d'or de Contribution

Pour tout développeur ou LLM opérant sur ce repo :

1. Aucune donnée au niveau national n'est pertinente, tout doit servir **le marché local (49)**.
2. Chaque nouvel équipement visuel doit respecter le **Design System** et rester minimaliste, utilisant strictement Tailwind.
3. Les bases fondamentales restent et resteront la **BAN**, la base **DVF**, la base **DPE** (ADEME) et les data ouvertes de la Mairie (Data Angers).
