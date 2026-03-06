# ROADMAP TRUESQUARE

L'ambition de TrueSquare est de s'imposer comme le **terminal Bloomberg de l'immobilier résidentiel**.
Voici la vision à court, moyen et long terme de l'évolution du produit.

---

## 🟢 Actuel : V6 "L'Expertise Interactive" (Complété)

Le socle est posé. L'outil récupère la data froide de l'État et la transforme en outil de neuro-vente.

- [x] Connexion API DVF et DPE (Sources Gouvernementales fiables)
- [x] Moteur de calcul Médian avec "Indice de Confiance"
- [x] Mécanique "Airbnb" : Exclusion des Outliers DVF en temps réel
- [x] Mécanique "Apple" : Mode Présentation plein-écran Premium / Export PDF
- [x] Mécanique "PayPal" : Stress-test de Financement (Mensualité, Cashflow, Loyer)
- [x] Mécanique "Microsoft" : Évaluation de la Liquidité du Marché (Rotation des biens)
- [x] Décote automatique Passoire Thermique (Calcul de Rénovation Énergétique)
- [x] Benchmark Frais de Notaire (Ancien vs VEFA)
- [x] Le "Closer" : Stratégie de Commercialisation (Simulateur d'honoraires, Net Vendeur & FAI Optimisé SeLoger)

---

## 🟡 Court-Terme : "Enrichissement Data & Prospection"

Consolider la donnée pour donner encore plus d'armes à l'agent avant sa visite.

### 1. Scraping / API Annonces Concurrentes ("Ce qui est à vendre")

- *Besoin :* Le DVF regarde le PASSÉ. Il faut regarder LE PRÉSENT.
- *Feature :* Afficher les biens similaires actuellement en vente sur les portails (LeBonCoin, SeLoger) dans le même rayon pour analyser la concurrence directe.

### 2. Cadastre Visuel Intégré (Complété)

- *Besoin :* Renforcer le côté "Expert Foncier".
- *Feature :* Une carte interactive (Vue Satellite / Plan) affichant le bien estimé et plaçant de manière géolocalisée l'ensemble des transactions de l'échantillon DVF, avec filtres interactifs.

### 3. Fiabilisation du moteur de calcul (Complété)

- *Besoin :* Éviter les erreurs de chiffres et rendre l'analyse défendable face à un client exigeant.
- *Feature :* Filtre automatique des transactions trop anciennes (5 ans), garde-fous mathématiques sur les arrondis, et indicateurs de qualité (`stale_data`, `sample_size_ok`, `has_dpe`) pour signaler la robustesse de chaque estimation.

### 4. CRM & Sauvegarde de Dossiers

- *Besoin :* L'agent veut conserver son travail.
- *Feature :* Possibilité de sauvegarder une *SyntheseCard* dans un compte utilisateur, générer un lien partageable avec expiration (pour créer un sentiment d'urgence chez l'acheteur).

---

## 🟠 Moyen-Terme : "IA & Génération de Discours"

Transformer l'outil d'analyse en un partenaire de persuasion.

### 1. L'Argumentaire Dynamique ("Briefing Négociateur") (Complété)

- *Besoin :* Tous les agents ne savent pas pitcher la data.
- *Feature :* Un moteur d'analyse de données (DPE, Liquidité, Décotes) qui lit la `SyntheseCard` et génère un script de négociation (3 bullet points percutants) sur-mesure pour convaincre de signer le mandat. Réservé à l'affichage de l'agent (invisible sur l'export PDF client).

### 2. Génération automatique du plan de financement

- *Besoin :* Aller plus loin que le simulateur PayPal.
- *Feature :* Connexion Open Banking ou génération d'un PDF que l'acheteur peut directement donner à son courtier pour gagner 2 semaines sur le délai de promesse de vente.

---

## 🔴 Long-Terme : "L'Ecosystème End-to-End"

Faire de TrueSquare l'outil central (L'OS de l'Agent).

### 1. Module "Estimation Travaux Avancée"

- Algorithme poussé estimant le coût des travaux pièce par pièce via machine learning sur des factures réelles de maîtres d'œuvre, avec intégration d'artisans locaux.

### 2. Outil de Gestion de Portefeuille (Directeur d'Agence)

- Vue dashboard (Microsoft PowerBI style) pour un directeur d'agence qui suit l'agressivité de ses agents : "Combien d'estimations TrueSquare ont converti en mandats exclusifs ce mois-ci ?"
