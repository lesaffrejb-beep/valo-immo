# ROADMAP TRUESQUARE

L'ambition de TrueSquare est de s'imposer comme le **terminal Bloomberg de l'immobilier résidentiel**.
Le socle V6 "L'Expertise Interactive" (API DVF/DPE, Score de Quartier, Présentation Premium, Simulateurs Finance & Liquidité, Ingestion Angers automatisée) étant validé et en production, voici la priorisation de la feuille de route pour les prochaines itérations.

---

## 🎯 Priorité 1 : Immédiate & Haute Valeur (Prospection & Pricing Fin)

### 1. Scraping / API Annonces Concurrentes ("Ce qui est à vendre")

- *Besoin :* Le DVF regarde le PASSÉ (les ventes actées). Il faut regarder LE PRÉSENT (les biens sur le marché).
- *Feature :* Afficher les biens similaires actuellement en vente sur les portails (LeBonCoin, SeLoger) dans la `SyntheseCard`. Cela permet à l'agent de démontrer la réalité de la concurrence directe (prix de présentation vs prix de transaction) pour ajuster au mieux le prix de commercialisation.

### 2. Valorisation Avancée des Appartements (Micro-Modificateurs)

- *Besoin :* Le marché des appartements obéit à des règles de copropriété et d'étage spécifiques que le DVF brut peine à capturer finement.
- *Feature :* Filtrage strict par type de local (Appartement vs Maison). Analyse comparative au sein du *même immeuble* via la parcelle cadastrale. Ajout de pondérations dynamiques interactives dans l'UI pour l'étage (ex: RDC = -10%, dernier étage = +10%) et la présence ou non d'un ascenseur.

---

## 🚀 Priorité 2 : Rétention & Expérience Client (CRM & Conversion)

### 3. CRM, Sauvegarde de Dossiers & Expérience "Urgence"

- *Besoin :* L'agent doit conserver son travail, suivre son pipeline et créer un sentiment d'exclusivité avec son client.
- *Feature :* Persistance robuste d'une *SyntheseCard* dans Supabase. Génération d'un lien web partageable avec une date d'expiration (ex: 48h) pour créer un sentiment d'urgence chez le vendeur/acheteur, accélérant ainsi la prise de décision.

### 4. Génération Automatique du Plan de Financement (Export Courtier)

- *Besoin :* Accélérer la sécurisation financière de l'acquéreur en allant plus loin que la simple simulation visuelle PayPal-style.
- *Feature :* Fonctionnalité d'export direct d'un PDF de synthèse financière ou intégration Open Banking. L'acheteur obtient un "Passeport Financement" généré par l'agent, transférable immédiatement en banque ou à un courtier, faisant gagner de précieuses semaines sur le délai de promesse de vente.

---

## 🔮 Priorité 3 : Vision Long-Terme (L'Écosystème Exhaustif)

### 5. Cockpit Directeur d'Agence Avancé (Vues Multiples)

- *Besoin :* Piloter finement l'activité commerciale d'une agence ou d'un réseau sur le secteur Angevin.
- *Feature :* Élargir le MVP du tableau de bord actuel avec des vues multi-agences, des filtres temporels dynamiques, et des benchmarks de performance par négociateur (Taux de conversion Estimation → Mandat Exclusif).

### 6. Module de Chiffrage de Travaux Prédictifs

- *Besoin :* Lever le frein majeur de la rénovation énergétique (notamment sur les passoires F/G) avec des devis crédibles.
- *Feature :* Déploiement d'un sous-modèle de Machine Learning entraîné sur des bases de factures réelles d'artisans et maîtres d'œuvre locaux (49). L'outil chiffrerait automatiquement les travaux poste par poste (Isolation, Menuiserie, PAC) avec un degré de précision supérieur aux simples forfaits au m² actuels.
