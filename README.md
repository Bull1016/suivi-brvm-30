# Bull Investment Tracker — Suivi de l'Indice BRVM 30

**Bull Investment Tracker** est une application web moderne conçue pour suivre et analyser les performances des 30 entreprises les plus dynamiques de la Bourse Régionale des Valeurs Mobilières (BRVM). L'interface adopte un style néobrutaliste à fort contraste et intègre des fonctionnalités d'analyse financière automatisée par intelligence artificielle.

---

## Fonctionnalités

### Suivi des Cotations (BRVM 30)
- Récupération automatique des cours et variations via scraping de **Sika Finance**.
- Tableau filtrable et triable par symbole, entreprise, secteur, prix et variation.
- Drapeau du pays affiché directement devant le nom de chaque entreprise.
- **Filtres avancés** : recherche textuelle, plage de prix (presets + saisie libre), filtre par secteur BRVM, filtre par pays.
- **Tri multi-colonnes** : symbole, nom, secteur, prix, variation, haut/bas de séance, score dividendes.

### Analyseur de Dividendes
- Calcul dynamique de la régularité des versements sur un cycle glissant de **5 ans** (`année actuelle - 1`).
- Score de régularité de `0/5` à `5/5` affiché dans le tableau.
- Détection automatique des **Aristocrates de Dividendes** : entreprises ayant versé ≥ 3 ans consécutifs.
- Historique complet avec graphique en barres animé dans le panneau de détail.
- Synchronisation individuelle forcée des dividendes depuis Sika Finance.

### Catégorisation Sectorielle BRVM
- 7 secteurs officiels BRVM avec badges colorés et liens directs vers la page BRVM officielle :
  - Consommation de Base · Consommation Discrétionnaire · Énergie
  - Industriels · Services Financiers · Services Publics · Télécommunications
- Compteurs dynamiques par secteur mis à jour selon les filtres actifs.

### Bulletins Officiels de la Cote (BOC)
- Scraping automatique des **Bulletins Officiels de la Cote** publiés sur `brvm.org`.
- **Analyse IA des bulletins** : le modèle Gemini extrait et synthétise indices, volumes, obligations et détachements de dividendes.
- Recherche Google Grounding pour enrichir l'analyse avec des sources en temps réel.
- Téléchargement direct du PDF d'origine depuis l'interface.

### Intelligence Artificielle
- **Descriptions d'entreprises** : générées par **Gemini** en français, mises en cache pour éviter les appels redondants.
- **Analyse des BOC** : rapport financier structuré avec sources vérifiées et croisées.

### Synchronisation & Cache
- En production Vercel : cache **Upstash Redis** (seed initial depuis `data/*.json`).
- Cron Vercel pour rafraîchir les cotations (et un lot de dividendes) selon le plan configuré.
- Synchronisation globale déclenchable manuellement depuis l'en-tête.

---

## Architecture Technique

### Stack

| Couche | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion (`motion`), Lucide React |
| **API production** | Fonctions serverless Vercel (`api/`) |
| **API locale** | Express + Vite middleware (`server.ts`) |
| **Cache** | Upstash Redis (Vercel KV) + seed JSON |
| **IA** | `@google/genai` — modèle `gemini-2.5-flash` avec Google Grounding |
| **Scraping** | Scraper Regex maison (Sika Finance + brvm.org) |

### Structure

```
src/                                 # Frontend React
lib/brvm/                            # Logique métier partagée (scrape, Redis, Gemini)
api/                                 # Handlers Vercel (mêmes chemins que le front)
data/                                # Seed JSON (cours + descriptions)
server.ts                            # Express de développement
```

### Routes API

```
GET  /api/brvm30/stocks
POST /api/brvm30/sync                      # scrape AAZ synchrone
GET  /api/brvm30/sync                      # cron (Authorization: Bearer CRON_SECRET)
POST /api/brvm30/sync-dividends/:symbol
GET  /api/brvm30/sync-dividends-cron       # cron, 2 titres par run
GET  /api/brvm30/company-description/:s/:c
GET  /api/brvm/bulletins
GET  /api/brvm/analyze-bulletin/:date?url=
```

---

## Installation et Configuration

### Prérequis
- [Node.js](https://nodejs.org/) ≥ 18
- Une clé API [Google AI Studio](https://aistudio.google.com/) (Gemini)
- Pour la persistance en production : une base [Upstash Redis](https://upstash.com/) (intégration **Vercel KV** dans le dashboard du projet)

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer les variables d'environnement
Créez un fichier `.env` à la racine en vous basant sur `.env.example` :
```env
PORT=3000
GEMINI_API_KEY=votre_cle_api_gemini_ici
BRVM_30_URL=https://www.sikafinance.com/docs/brvm-30-composition-de-l-indice-brvm-30.pdf
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
# Avec l'intégration Vercel KV, utilisez plutôt KV_REST_API_URL et KV_REST_API_TOKEN.
# KV_REST_API_READ_ONLY_TOKEN, KV_URL et REDIS_URL ne sont pas nécessaires ici.
CRON_SECRET=
```

Sans Redis, `npm run dev` fonctionne : l'état reste en mémoire le temps du process Express. Les JSON dans `data/` servent de seed.

L'application utilise `@upstash/redis` via l'API REST et doit pouvoir écrire dans Redis pour synchroniser les cours, dividendes et analyses. Configurez donc **une seule paire** de variables :

- `KV_REST_API_URL` + `KV_REST_API_TOKEN` avec l'intégration Vercel KV ; ou
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` avec les noms Upstash historiques.

`KV_REST_API_READ_ONLY_TOKEN` ne doit pas être utilisé : les routes de synchronisation effectuent des écritures. `KV_URL` et `REDIS_URL` sont des URL de connexion Redis classiques, pas les endpoints REST attendus par le client utilisé par ce projet.

### 3. Lancer en mode développement
```bash
npm run dev
```
Le serveur Express démarre sur `http://localhost:3000` et gère les API REST + Vite.

---

## Déploiement Vercel

1. Connecter le repo au projet Vercel (framework Vite, output `dist`).
2. Dans **Storage**, créer **Upstash Redis / KV** et relier le projet. L'intégration injecte généralement `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL` et `REDIS_URL` ; le projet utilise uniquement `KV_REST_API_URL` et `KV_REST_API_TOKEN` (ou les variables `UPSTASH_*` historiques).
3. Ajouter `GEMINI_API_KEY` et `CRON_SECRET` dans **Environment Variables**.
4. Déployer. Les fichiers `api/**/*.ts` deviennent des fonctions ; le front continue d'appeler `/api/...`.

### Limites Hobby
- **Cron** : 1 job par jour maximum. Le planning `*/5 * * * *` de [`vercel.json`](vercel.json) nécessite un plan **Pro**. Sur Hobby, utilisez le bouton Sync et le seed JSON.
- **Timeout** : 10 s sur Hobby, jusqu'à 60 s sur Pro (`maxDuration` déclaré à 60). Le scrape AAZ tient généralement sous 10 s ; Gemini (descriptions / BOC) peut nécessiter Pro.

Les fichiers `data/stocks_cache.json` et `data/company_descriptions.json` sont inclus dans les fonctions (`includeFiles`) comme seed, pas comme stockage après la première écriture Redis.

---

## Commandes

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement (Express + Vite) |
| `npm run lint` | Vérification statique des types (`tsc --noEmit`) |
| `npm run build` | Compile le frontend (Vite) |
| `npm run start` | Express en mode production (après `vite build`) |

---

## Données persistantes

- `data/stocks_cache.json` — Seed des cours et dividendes
- `data/company_descriptions.json` — Seed des descriptions IA
- Redis `brvm:state`, `brvm:descriptions`, `brvm:sectors`, `brvm:div-cursor` — état de production

---

## Avertissement

Les données affichées et les analyses générées par l'IA sont fournies à titre informatif uniquement. Elles ne constituent en aucun cas des conseils en investissement.
