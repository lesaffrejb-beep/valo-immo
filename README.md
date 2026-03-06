# TrueSquare - Expertise Foncière B2B

Bienvenue sur le dépôt officiel de **TrueSquare**, le moteur d'estimation immobilière nouvelle génération conçu pour les agents immobiliers, notaires et experts fonciers. Ce projet s'appuie sur le croisement algorithmique temps réel des données officielles de l'État (DVF et DPE).

---

## 🏗️ Architecture

TrueSquare est construit sur une stack moderne, optimisée pour la vitesse, la scalabilité Serverless et un rendu premium (Dribbble/Awwwards class) :

- **Framework :** Next.js 16 (App Router)
- **Frontend :** React 19, Tailwind CSS v4, composants Shadcn UI, Lucide Icons.
- **Backend (BFF) :** Route Handlers Next.js avec validation stricte via **Zod**.
- **Data Fetching :** Data Caching natif Next.js (cache TTL 24h) pour éviter le *Rate Limiting* des APIs gouvernementales (Cerema / Ademe).
- **Tests :** Vitest pour la couverture des modèles financiers.

---

## 🚀 Le Moteur de Calcul (`calculation-engine.ts`)

Le cœur métier de TrueSquare réside dans son algorithme d'analyse transactionnelle certifié :

1. Les APIs frontend interrogent la **BAN (Base Adresse Nationale)** pour le géocodage.
2. Le Backend interroge en parallèle l'API Cerema (DVF) sur un rayon défini et l'API Ademe (DPE) via l'identifiant BAN.
3. L'algorithme exclut le prix forfaitaire des annexes (ex: 15 000 € par garage).
4. Le calcul de la surface pondérée donne systématiquement l'avantage à la **Surface Habitable du DPE** si ce dernier est récent, contrecarrant les variations cadastre vs terrain.
5. Une synthèse robuste (Médiane Naïve vs Consolidée, Indice de confiance algorithmique) est restituée au Front-End.

---

## 🛠️ Installation et Lancement Local

**Prérequis:** `Node.js >= 20` et `npm` (ou `pnpm` / `yarn`).

```bash
# 1. Cloner le repo
git clone <url-du-repo> valo-immo
cd valo-immo

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement (Port 3000)
npm run dev
```

---

## 🛡️ Sécurité & Fiabilité

Suite au dernier audit de due diligence, les standards B2B suivants sont appliqués :

- **Validation absolue des payloads** via `zod` (`/api/dvf`, `/api/dpe`, `/api/estimate`, `/api/geocode`).
- **Prévention d'attaque DoS** : Un proxy de cache serveur retient les résultats DVF/DPE pendant 24h, protégeant nos propres serveurs de timeout intempestifs.
- **Lazy Loading (UX)** : La map, les graphes et panneaux de résultats complexes utilisent le Chunk Splitting (`next/dynamic`) pour alléger la Landing Page critique (TBT/LCP minimalisés).
- **Tests Qualité** : Les mathématiques de pondération ne subiront jamais de régression. Pour tester le moteur métier :

  ```bash
  npx vitest run
  ```

---

## 📦 Déploiement Vercel

Le projet est calibré pour être déployé "Zero-config" sur Vercel :

1. Liez votre compte GitHub à Vercel.
2. Sélectionnez le projet `valo-immo`.
3. Cliquez sur **Deploy**.

> *Note : Aucune base de données locale n'est requise. Toute la puissance réside dans l'agrégation "Edge" des données d'État.*
