# TrueSquare V6

**Le moteur de valorisation premium, transparent et interactif pour les professionnels de l'immobilier.**

![TrueSquare Concept](https://img.shields.io/badge/Status-Beta_V6-brass?style=for-the-badge) ![Tech](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js) ![Styling](https://img.shields.io/badge/TailwindCSS-v3-blue?style=for-the-badge&logo=tailwindcss)

TrueSquare est une PropTech B2B qui redonne le pouvoir à l'agent immobilier. En croisant la donnée brute irréfutable de l'État (DVF, DPE) avec l'intelligence terrain de l'expert, l'application génère des dossiers d'estimation interactifs d'un niveau de détails et de prestige inédit.

## 🚀 Fonctionnalités "Big Tech Edition" (V6)

- **Transparence Absolue (DVF & DPE) :** Interrogation en temps réel des bases de données de l'État.
- **Mode Outliers (Style Airbnb) :** Exclusion interactive des anomalies statistiques (ventes en famille, erreurs) pour une médiane pure, recalculée en live.
- **Rapport d'Expertise Cinematic (Style Apple) :** Un mode présentation plein-écran luxueux figeant les paramètres pour l'export PDF "Private Banking".
- **Stress-Test Acheteur (Style PayPal) :** Simulation financière ultra-rapide (Apport, Taux, Cashflow) pour démontrer la capacité d'emprunt et le rendement brut locatif.
- **Scoring de Liquidité (Style Microsoft) :** Analyse de la rotation du parc immobilier pour statuer sur la tension du marché local et le délai de vente.
- **Ajustements Hédonistes :** L'agent sculpte le prix en modifiant dynamiquement l'état du bien, les extérieurs et la vue.
- **Rénovation Énergétique :** Détection d'un DPE Passoire (E, F ou G) et application automatique d'une décote travaux chiffrée.
- **Micro-Marché & Isochrones :** Analyse de la proximité des commodités (écoles, transports) et calcul des pondérations d'étage pour les appartements (À venir).

## 🛠 Stack Technique

- **Framework :** Next.js 14 (App Router)
- **Langage :** TypeScript
- **Styling :** Tailwind CSS + Variables CSS complexes (Thème Premium clair: Ivoire, Laiton/Brass, Navy)
- **Composants :** UI ultra-légère (from scratch)
- **Data (API) :** API data.gouv.fr

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

## 🔐 Ce qu'on pourra ajouter ensuite (backend)

Pour aller encore plus loin sur la fiabilité et la protection de la logique métier :

- Déporter 100% du moteur côté backend (API privée + signatures de version de calcul).
- Ajouter des **tests de non-régression métier** (fixtures réelles d'adresses + résultats attendus figés).
- Journaliser les variations de résultats entre versions de moteur (audit).
- Ajouter une stratégie de **fallback multi-source DVF** (si un endpoint est indisponible).
- Exposer une "fiche de preuve" par estimation (sources, date de fraîcheur, règles appliquées).

## 🗺 Vision & Roadmap

Découvrez la philosophie du projet dans le document [L'ÂME DE TRUESQUARE](./L_AME.md) et consultez le futur de l'application dans la [ROADMAP](./ROADMAP.md).
