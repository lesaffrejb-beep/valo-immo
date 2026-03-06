# Personas & Retours Utilisateurs (Directeurs d'Agences Immobilières)

Ce document recense 10 profils fictifs d'experts de l'immobilier. Pour chacun, nous détaillons leur personnalité, les questions qu'ils se posent en utilisant *TrueSquare*, et les "frictions" (défauts) qu'ils ont relevées dans le parcours utilisateur, afin d'y apporter des corrections.

---

## 1. Jean-Marc (55 ans), Le "Vieux de la Vieille"

**Profil :** Directeur d'agence indépendante depuis 25 ans. Habitué au papier, au feeling et à sa connaissance millimétrée du secteur.
**Personnalité :** Sceptique face à la "Tech", très pragmatique. Il ne jure que par l'état physique du bien.
**Questions fréquentes :**

- « Comment votre machine peut-elle savoir si le bien a été refait à neuf ou si la toiture fuit ? »
- « D'où sortez-vous ce prix au m² exactement ? »
**Défaut UX relevé :** Manque d'explication claire sur les limites de l'algorithme. Il a l'impression que la machine prétend "tout savoir".
**Solution implémentée :** Ajout d'une mention *"Estimation statistique non contractuelle"* bien visible dans le footer, et une carte "Limites" ou FAQ pour expliquer que l'algorithme ne remplace pas la visite physique.

## 2. Sarah (34 ans), La "Data-Driven"

**Profil :** Directrice d'une agence franchisée orientée volume et data. Utilise de nombreux logiciels (Yanport, PriceHubble...).
**Personnalité :** Analytique, exigeante, rapide. Veut des preuves et des sources sourcées.
**Questions fréquentes :**

- « Quelle est la latence de mise à jour des données DVF ? »
- « Les surfaces croisées DPE/DVF sont-elles filtrées des valeurs aberrantes (outliers) ? »
**Défaut UX relevé :** Les sources (DVF/DPE) sont listées, mais elle cherche les liens directs vers les datasets gouvernementaux pour vérifier.
**Solution implémentée :** Liens cliquables vers *data.gouv.fr* et *data.ademe.fr* dans le footer.

## 3. Laurent (42 ans), Le Chasseur de Mandats

**Profil :** Mandataire freelance (IAD/Capifrance) hyper agressif commercialement. Il utilise l'outil devant le client lors du R1 (rendez-vous 1).
**Personnalité :** Souriant mais pressé. L'outil doit valoriser son discours et rassurer le vendeur.
**Questions fréquentes :**

- « Puis-je imprimer le PDF de la synthèse pour le laisser au client sur sa table de salon ? »
- « Comment expliquer à un client que son bien vaut moins que ce qu'il pense ? »
**Défaut UX relevé :** Il tape le texte de l'adresse à la va-vite et se trompe souvent, devoir tout effacer à la main le frustre.
**Solution implémentée :** Ajout d'une croix de suppression ("Clear") dans la `SearchBar` pour vider rapidement le champ.

## 4. Béatrice (60 ans), L'Expert Près les Tribunaux

**Profil :** Experte judiciaire en évaluation immobilière. Intervient lors de successions, divorces, litiges complexes.
**Personnalité :** Très rigoureuse, procédurière. Le diable est dans les détails juridiques.
**Questions fréquentes :**

- « Que se passe-t-il lorsque l'adresse ne correspond pas à la parcelle cadastrale exacte ? »
- « Excluez-vous bien les ventes de lots isolés (caves, parkings vides) de vos moyennes ? »
**Défaut UX relevé :** Pas d'information sur la période temporelle prise en compte (ex: Ventes des 5 dernières années ?).
**Solution implémentée :** Ajout d'une question dans la FAQ de la page d'accueil explicitant les filtres de nettoyage appliqués à DVF.

## 5. Malik (29 ans), Le Tech-Savvy Négo

**Profil :** Négociateur branché réseaux sociaux, utilise l'iPad en rendez-vous, poste ses visites sur TikTok.
**Personnalité :** Impatient, très sensible au design ("Awwwards level") et à la fluidité.
**Questions fréquentes :**

- « Est-ce que l'interface a un Dark Mode ? »
- « Puis-je partager le lien de l'estimation directement sur WhatsApp ? »
**Défaut UX relevé :** L'animation de recherche paraît parfois un peu "lente" ou "statique" si le réseau est mauvais, sans lui donner de vrai feedback d'attente (skeleton loader insuffisant).
**Solution implémentée :** Refonte des skeletons de chargement pour les rendre plus vivants (animations pulsées premium).

## 6. Véronique (48 ans), Directrice Réseau Luxe (Coldwell Banker)

**Profil :** Spécialisée dans les biens d'exception (hôtels particuliers, penthouses).
**Personnalité :** Discrète, pointilleuse sur la forme, attend de l'élégance et de la confidentialité.
**Questions fréquentes :**

- « L'algorithme est-il pertinent pour des biens atypiques (hors normes) où il n'y a pas de comparables ? »
**Défaut UX relevé :** L'absence d'indication si le bien se situe hors du modèle statistique classique.
**Solution implémentée :** FAQ explicite sur les limites du modèle pour le "haut de gamme" et les biens exceptionnels qui manquent de profondeur statistique (DVF insuffisant).

## 7. Olivier (38 ans), Le Rentier / Investisseur "Marchand de Biens"

**Profil :** S'en moque de l'aspect affectif. Il ne regarde que la renta, la décote, la plue-value.
**Personnalité :** Mathématique, cynique, adore "casser les prix" avec des arguments data.
**Questions fréquentes :**

- « Puis-je voir la liste brute des dernières ventes pour identifier un lot acheté à la casse ? »
- « Avez-vous la classe énergétique (DPE) pour voir si je peux le négocier ? »
**Défaut UX relevé :** L'interface affiche peu la décote DPE (le lien avec les futures obligations légales de rénovation n'est pas explicite).
**Solution implémentée :** (Phase ultérieure) Intégrer la décote énergétique sur le `SyntheseCard`. Actuellement : mise en valeur du DPE réel via une icône dédiée dans les résultats.

## 8. Chloé (25 ans), L'Assistante Commerciale

**Profil :** C'est elle qui saisit à longueur de journée les fiches, vérifie les adresses avant de préparer les dossiers d'estimation.
**Personnalité :** Surmenée, exécute beaucoup de tâches répétitives. Elle veut un outil sans clic inutile.
**Questions fréquentes :**

- « Que se passe-t-il si j'oublie le code postal, ça trouve quand même ? »
**Défaut UX relevé :** Lors d'une erreur (ex: "Adresse non trouvée"), le message d'erreur était trop vague.
**Solution implémentée :** Rendre les messages d'erreur plus explicites : rouge doux (destructive) mais un texte indiquant quoi faire ("Vérifiez le nom de la rue et retentez...").

## 9. Stéphane (51 ans), Le Provincial "Secteur Rural"

**Profil :** Gère des corps de ferme et des grandes maisons en milieu très peu dense.
**Personnalité :** Jovial, très bavard, connaît tous les maires du coin.
**Questions fréquentes :**

- « Comment votre outil estime-t-il quand la dernière vente remonte à 2012 dans le village ? »
**Défaut UX relevé :** L'outil lui affiche un "loading" infini ou un crash sur les communes sans volume DVF.
**Solution implémentée :** Ajout dans l'API d'un filet de sécurité, et dans le Front, un retour UX spécifique ("Volume de données insuffisant sur cette commune pour une moyenne locale précise").

## 10. Nathalie (45 ans), La Directrice Juridique d'un Réseau

**Profil :** Obsédée par la conformité RGPD et la Loi Hoguet.
**Personnalité :** Carrée, rigide. Rien ne doit laisser penser qu'il y a un engagement juridique.
**Questions fréquentes :**

- « Où sont vos mentions légales ? Conservez-vous nos adresses pour les revendre ? »
**Défaut UX relevé :** Manque d'avertissement clairs "Ceci n'est pas un avis de valeur officiel".
**Solution implémentée :** Ajout de la mention `"Estimation statistique non contractuelle - Ne vaut pas expertise"` en majuscules dans le Footer. Ce bloc est fixe et omniprésent.
