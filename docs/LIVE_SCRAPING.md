# Live Scraping — Documentation Technique TrueSquare V6

> **État actuel : En veille** (`LIVE_SCRAPING_ENABLED = false` dans `src/lib/live-market.ts`).
> La clé ZenRows est déjà configurée. Pour activer : changer le flag à `true`.

---

## Objectif

Confronter le DVF (passé) avec les annonces immobilières **actives en temps réel** sur LeBonCoin et SeLoger. Permet aux agents de démontrer la concurrence directe et de calibrer le prix de présentation.

---

## Architecture 3 couches

```
fetchLiveMarketSnapshot()
    │
    ├─ [Layer 0] Flag LIVE_SCRAPING_ENABLED ?
    │       └─ Non → FALLBACK direct (données démo, is_demo: true)
    │
    ├─ [Layer 1] Cache Supabase (table live_listings_cache, TTL 6h)
    │       └─ Si >= 2 listings dans le rayon → retourne le cache
    │
    ├─ [Layer 2] ZenRows API (ZENROWS_API_KEY dans .env.local)
    │       └─ Appel LeBonCoin via ZenRows + parsing HTML avec cheerio
    │       └─ Persist dans live_listings_cache (async)
    │
    └─ [Layer 3] FALLBACK statique (5 annonces enrichies DPE/GES)
                 → is_demo: true dans le snapshot
```

---

## Fichiers concernés

| Fichier | Rôle |
|---|---|
| `src/lib/live-market.ts` | Moteur principal (3 couches) |
| `src/components/LiveMarketCard.tsx` | UI (teaser V2 ou données réelles) |
| `src/app/api/live-market/route.ts` | Route GET `/api/live-market?lat=&lon=&radius=` |
| `database/live_listings_cache.sql` | Migration Supabase |
| `.env.local` | Clés API (gitignoré) |

---

## Supabase — Table `live_listings_cache`

Migration déjà créée et exécutée : [`database/live_listings_cache.sql`](../database/live_listings_cache.sql)

```sql
-- Résumé de la structure
CREATE TABLE live_listings_cache (
  id              TEXT PRIMARY KEY,
  source          TEXT NOT NULL,   -- 'leboncoin' | 'seloger'
  price           INTEGER NOT NULL,
  surface_m2      NUMERIC,
  dpe_letter      CHAR(1),
  latitude, longitude DOUBLE PRECISION,
  scraped_at      TIMESTAMPTZ DEFAULT NOW()
  -- ...voir fichier SQL complet
);
-- Nettoyage auto > 6h : fonction cleanup_live_listings_cache()
```

**URL projet :** `https://wkrwptsrnlfeguscmpqo.supabase.co`

---

## Variables d'environnement

```bash
# .env.local (gitignoré — ne jamais committer)
ZENROWS_API_KEY=f029...47  # Clé ZenRows (trial)
NEXT_PUBLIC_SUPABASE_URL=https://wkrwptsrnlfeguscmpqo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> **Sécurité :** `.env*` est dans `.gitignore`. Les clés ne seront jamais poussées sur GitHub.

---

## Réactivation (quand prêt à facturer)

1. Dans `src/lib/live-market.ts`, changer :

   ```typescript
   const LIVE_SCRAPING_ENABLED = false;
   // → true
   ```

2. S'assurer que `ZENROWS_API_KEY` est valide (passer en plan payant ZenRows si nécessaire)
3. Vérifier que la table Supabase `live_listings_cache` est accessible
4. Changer le badge V2 dans `LiveMarketCard.tsx` : variable `LIVE_TEASER_MODE = false`

---

## Parsing HTML LeBonCoin (implémenté dans `fetchFromZenRows`)

Les sélecteurs CSS utilisés (`data-qa-id="aditem_container"`, etc.) sont ceux observés en mars 2026. LeBonCoin peut faire de l'A/B testing — si 0 annonces sont extraites, le système bascule sur le fallback automatiquement (log console informatif).

**Données extraites :** titre, prix, surface (m²), pièces, ville, URL, image.

> **DPE/GES** : non disponibles depuis la page de liste LeBonCoin. Il faudrait crawler chaque annonce individuellement (coût ZenRows élevé). Alternative : intégrer l'API ADEME DPE par adresse de l'annonce.

---

## Modèle économique suggéré (B2B SaaS)

- **Free / Trial :** teaser flou V2 → incite à upgrader
- **Pro (9-29€/mois) :** données réelles ZenRows + cache Supabase
- **Enterprise :** ajout SeLoger, analyse tendance 30j, alertes nouvelles annonces
