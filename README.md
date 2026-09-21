# Bull Investment Tracker — Suivi de l'Indice BRVM 30

**Bull Investment Tracker** est une application web moderne conçue pour suivre et analyser les performances des 30 entreprises de l'indice officiel **BRVM 30** (conformément à l'**Avis BRVM n°191-2026** du 1er juillet 2026, disponible dans `docs/avis-191-2026.pdf`). L'interface adopte un style néobrutaliste à fort contraste et intègre des fonctionnalités d'analyse financière automatisée par intelligence artificielle.

---

## Fonctionnalités

### Suivi des Cotations (BRVM 30)
- Récupération et synchronisation des cours et variations via scraping structuré (**Cheerio**) de **Sika Finance**.
- Composition officielle de 30 titres alignée sur l'**Avis n°191-2026** (30 symboles réconciliés, source de référence dans `data/brvm30-composition.json`).
- Tableau filtrable, responsive et triable par symbole, entreprise, secteur, prix et variation.
- Drapeau SVG du pays affiché devant le nom de chaque entreprise (🇸🇳, 🇨🇮, 🇧🇫, 🇧🇯, 🇹🇬, 🇲🇱, 🇳🇪).
- **Barre de filtres compacte & Puces actives** : recherche textuelle, listes déroulantes (secteur, pays, plage de prix) et puces amovibles avec bouton « Réinitialiser tout ».
- **Interface Mobile Responsive** : affichage en cartes d'actions sur mobile sans défilement horizontal forcé.

### Analyseur de Dividendes
- Calcul dynamique de la régularité des versements sur un cycle glissant de **5 ans** (`année actuelle - 1`).
- Distinction claire des statuts : `a_jour` (à jour), `en_attente` (publication en attente), `interrompu`, `aucun`.
- Score de régularité (`0/5` à `5/5`) et mention **Payeur Régulier (D ≥ 3 ans)** pour les entreprises à fort historique.
- Synchronisation individuelle des dividendes depuis Sika Finance.

### Catégorisation Sectorielle BRVM
- 7 secteurs officiels BRVM avec badges et liens vers la page BRVM officielle :
  - Consommation de Base · Consommation Discrétionnaire · Énergie
  - Industriels · Services Financiers · Services Publics · Télécommunications
- Compteurs dynamiques par secteur mis à jour selon les filtres actifs.

### Bulletins Officiels de la Cote (BOC)
- Scraping automatique des **Bulletins Officiels de la Cote** publiés sur `brvm.org` (mis en cache).
- **Analyse IA des bulletins** : le modèle Gemini extrait et synthétise indices, volumes, obligations et détachements de dividendes.
- Recherche Google Grounding pour enrichir l'analyse avec des sources en temps réel.

### Intelligence Artificielle & Sécurité
- **Descriptions d'entreprises** : générées par **Gemini** (`gemini-3.6-flash`), mises en cache.
- **Sécurisation des API & Rate Limiting** : limitation par IP et par endpoint (`sync:`, `desc:`, `boc:`, `divs:`), déclenchée uniquement en cas de besoin d'appel réseau/IA.

---

## Architecture Technique

### Stack

| Couche | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion (`motion`), Lucide React |
| **API production** | Fonctions serverless Vercel (`api/`) |
| **API locale** | Express + Vite middleware (`server.ts`) |
| **Cache & Persistance** | Upstash Redis (Vercel KV) + Seed JSON réconcilié |
| **IA** | `@google/genai` — modèle `gemini-3.6-flash` |
| **Scraping** | Cheerio HTML parser + scraping structuré |

### Structure

```
docs/                                # Documents officiels (brvm30.pdf / avis-191-2026.pdf)
data/                                # Configuration de référence (brvm30-composition.json, seed)
lib/brvm/                            # Logique métier (scrape, Redis, Gemini, process)
src/                                 # Interface React + composants
api/                                 # Handlers Vercel Serverless
server.ts                            # Serveur Express de développement & production
```

---

## Installation et Configuration

### Prérequis
- [Node.js](https://nodejs.org/) ≥ 20.18.1
- Clé API [Google AI Studio](https://aistudio.google.com/) (`GEMINI_API_KEY`)

### 1. Installer les dépendances
```bash
npm install
```

### 2. Variables d'environnement
Créez un fichier `.env` :
```env
PORT=3000
GEMINI_API_KEY=votre_cle_api_gemini_ici
BRVM_30_URL=https://www.sikafinance.com/docs/brvm-30-composition-de-l-indice-brvm-30.pdf
KV_REST_API_URL=
KV_REST_API_TOKEN=
CRON_SECRET=
```

### 3. Lancer en développement
```bash
npm run dev
```

---

## Déploiement Vercel & Crons

Conformément à [`vercel.json`](vercel.json), deux tâches cron quotidiennes sont configurées :
- `0 1 * * *` (`/api/brvm30/sync`) : Synchronisation quotidienne des cotations.
- `0 2 * * *` (`/api/brvm30/sync-dividends-cron`) : Synchronisation quotidienne d'un lot de dividendes.

---

## Commandes

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement (Express + Vite) |
| `npm run lint` | Type-check TypeScript (`tsc --noEmit`) |
| `npm test` | Suite de tests unitaires Vitest |
| `npm run build` | Compilation frontend Vite |
| `npm run start` | Serveur de production Express |

---

## Avertissement

Les données affichées et les analyses générées par l'IA sont fournies à titre informatif uniquement.
