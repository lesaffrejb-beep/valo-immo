# ROADMAP TRUESQUARE

L'ambition de TrueSquare est de s'imposer comme le **terminal Bloomberg de l'immobilier résidentiel**.
Le socle V6 "L'Expertise Interactive" (API DVF/DPE, Score de Quartier, Présentation Premium, Simulateurs Finance & Liquidité, Ingestion Angers automatisée) étant validé et en production, voici la priorisation de la feuille de route pour les prochaines itérations.

---

## ✅ Livré en Production

### 1. CRM, Sauvegarde de Dossiers & Expérience "Urgence" (Option C)

- *Besoin :* L'agent doit conserver son travail, suivre son pipeline et créer un sentiment d'exclusivité avec son client.
- *Feature :* Persistance robuste d'une *SyntheseCard* dans Supabase (table `shared_dossiers`). Génération d'un lien web partageable `/partage/[token]` avec une date d'expiration fixée à 48h. L'interface affiche un compte à rebours dynamique pour créer un sentiment d'urgence chez le vendeur/acheteur, accélérant ainsi la prise de décision.

### Live Scraping Concurrents V1.0-beta — Marché actif en temps réel

- *Architecture :* 3 couches — Cache Supabase (6h) → ZenRows (scraping réel si clé API configurée) → Fallback statique enrichi (DPE/GES/délai).
- *UI :* `LiveMarketCard` avec badges DPE colorés, delta DVF vs marché actif, script RDV dynamique, bouton refresh asynchrone.
- *API :* Route dédiée `GET /api/live-market?lat=&lon=&radius=` avec cache HTTP 1h.
- *TODO pour activer le vrai scraping :* ajouter `ZENROWS_API_KEY` dans `.env.local`.

---

## 🎯 Priorité 1 : Immédiate & Haute Valeur (Prospection & Pricing Fin)

### 1. Valorisation Avancée des Appartements (Micro-Modificateurs)

- *Besoin :* Le marché des appartements obéit à des règles de copropriété et d'étage spécifiques que le DVF brut peine à capturer finement.
- *Feature :* Filtrage strict par type de local (Appartement vs Maison). Analyse comparative au sein du *même immeuble* via la parcelle cadastrale. Ajout de pondérations dynamiques interactives dans l'UI pour l'étage (ex: RDC = -10%, dernier étage = +10%) et la présence ou non d'un ascenseur.

---

## 🚀 Priorité 2 : Rétention & Expérience Client (CRM & Conversion)

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
