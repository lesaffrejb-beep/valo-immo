# TrueSquare - Expertise Foncière B2B

Bienvenue sur le dépôt officiel de **TrueSquare** (projet Valo-Immo), le moteur d'estimation immobilière nouvelle génération conçu pour les professionnels (agents immobiliers, chasseurs, experts fonciers, CGP).

Ce projet s'appuie sur le croisement algorithmique temps réel des données officielles de l'État (DVF et DPE) pour offrir une estimation d'une précision inégalée, habillée d'une interface de qualité premium.

---

## 🎯 Vision Produit & UX (Très Important pour les contributeurs / LLMs)

L'application s'adresse à **10 personas B2B distincts** (allant de l'agent sur le terrain sur son smartphone, à l'expert dans son bureau sur grand écran). Le produit doit être **Simple, Efficace et Clair**.

Pour concilier ces besoins extrêmes, le design repose sur le principe de **Divulgation Progressive (Progressive Disclosure)** :

1. **Niveau 1 (Fast-Track) :** Recherche ultra-rapide (Adresse, Surface, Type). Affichage immédiat d'un prix moyen avec carte. (Cible : Terrain, Assistante).
2. **Niveau 2 (Affiner) :** Modificateurs visuels (DPE, état, étage) permettant au prix de s'ajuster en temps réel devant le client. (Cible : Négociateur).
3. **Niveau 3 (Data Mode) :** Accès transparent aux données brutes DVF pour prouver le calcul. (Cible : Expert, Chasseur).
4. **Niveau 4 (Livrable) :** Génération d'un rapport PDF premium. (Cible : Mandataire, CGP).

### 🎨 Design System & Esthétique

- **Niveau d'exigence :** Dribbble / Awwwards vibes 2025-2026.
- **Palette :** Professionnelle, claire et premium (Navy, White, nuances de gris, gradients subtils).
- **Interactions :** Micro-animations soignées (framer-motion / transitions pures), feedback immédiat.
- **Règle absolue :** Aucune couleur ou espacement "en dur" (hardcodé). Utilisez toujours les CSS variables / tokens Tailwind.

> 🤖 **POUR LES FUTURS LLM :** Avant toute modification UI, vous **devez** prendre connaissance des instructions définies ci-dessus et respecter l'architecture en place. Lisez le Design System et ne rajoutez pas de classes utilitaires sauvages si un token existe.

---

## 🏗️ Architecture Technique

TrueSquare est construit sur une stack moderne, optimisée pour la vitesse et la scalabilité Serverless :

- **Framework :** Next.js 16 (App Router)
- **Frontend :** React 19, Tailwind CSS v4, composants Shadcn UI, Lucide Icons.
- **Backend (BFF) :** Route Handlers Next.js avec validation stricte via **Zod**.
- **Data Fetching :** Data Caching natif Next.js (cache TTL 24h) pour éviter le *Rate Limiting* des APIs gouvernementales (Cerema / Ademe) et contrer les attaques DoS.
- **Tests :** Vitest pour la couverture des modèles financiers.

---

## 🚀 Le Moteur de Calcul (`calculation-engine.ts`)

Le cœur métier de TrueSquare réside dans son algorithme d'analyse transactionnelle certifié :

1. Les APIs frontend interrogent la **BAN (Base Adresse Nationale)** pour le géocodage.
2. Le Backend interroge en parallèle l'API Cerema (DVF) sur un rayon défini et l'API Ademe (DPE) via l'identifiant BAN.
3. L'algorithme exclut le prix forfaitaire des annexes (ex: 15 000 € par garage).
4. Le calcul de la surface pondérée donne systématiquement l'avantage à la **Surface Habitable du DPE** si ce dernier est récent, contrecarrant les variations cadastre vs terrain.
5. Une synthèse robuste (Médiane Naïve vs Consolidée, Indice de confiance algorithmique) est restituée au Front-End via des API sécurisées.

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
- **Prévention d'attaque DoS** : Un proxy de cache serveur retient les résultats DVF/DPE pendant 24h, protégeant nos propres serveurs de timeout.
- **Lazy Loading (UX)** : La map, les graphes et panneaux de résultats complexes utilisent le Chunk Splitting (`next/dynamic`) pour alléger la Landing Page critique.
- **Qualité** : Pour tester mathématiquement le moteur métier (zéro régression) :

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
