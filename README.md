# 🐂 Bull Investment Tracker — Suivi de l'Indice BRVM 30

**Bull Investment Tracker** est une application web moderne conçue pour suivre et analyser en temps réel les performances des 30 entreprises les plus dynamiques de la Bourse Régionale des Valeurs Mobilières (BRVM). L'interface adopte un style néobrutaliste à fort contraste et intègre des fonctionnalités d'analyse financière automatisée par intelligence artificielle.

---

## 🚀 Fonctionnalités

### 📊 Suivi des Cotations (BRVM 30)
- Récupération automatique des cours et variations via scraping de **Sika Finance**.
- Tableau filtrable et triable par symbole, entreprise, secteur, prix et variation.
- Drapeau du pays affiché directement devant le nom de chaque entreprise.
- **Filtres avancés** : recherche textuelle, plage de prix (presets + saisie libre), filtre par secteur BRVM, filtre par pays.
- **Tri multi-colonnes** : symbole, nom, secteur, prix, variation, haut/bas de séance, score dividendes.

### 💰 Analyseur de Dividendes
- Calcul dynamique de la régularité des versements sur un cycle glissant de **5 ans** (`année actuelle - 1`).
- Score de régularité de `0/5` à `5/5` affiché dans le tableau.
- Détection automatique des **Aristocrates de Dividendes** : entreprises ayant versé ≥ 3 ans consécutifs.
- Historique complet avec graphique en barres animé dans le panneau de détail.
- Synchronisation individuelle forcée des dividendes depuis Sika Finance.

### 🏭 Catégorisation Sectorielle BRVM
- 7 secteurs officiels BRVM avec badges colorés et liens directs vers la page BRVM officielle :
  - 🌾 Consommation de Base · 🛍️ Consommation Discrétionnaire · ⚡ Énergie
  - 🏭 Industriels · 🏦 Services Financiers · 💧 Services Publics · 📡 Télécommunications
- Compteurs dynamiques par secteur mis à jour selon les filtres actifs.

### 📰 Bulletins Officiels de la Cote (BOC)
- Scraping automatique des **Bulletins Officiels de la Cote** publiés sur `brvm.org`.
- **Analyse IA des bulletins** : le modèle Gemini extrait et synthétise indices, volumes, obligations et détachements de dividendes.
- Recherche Google Grounding pour enrichir l'analyse avec des sources en temps réel.
- Téléchargement direct du PDF d'origine depuis l'interface.

### 🤖 Intelligence Artificielle
- **Descriptions d'entreprises** : générées par **Gemini** en français, mises en cache pour éviter les appels redondants.
- **Analyse des BOC** : rapport financier structuré avec sources vérifiées et croisées.

### 🔄 Synchronisation & Cache
- Mise à jour automatique toutes les **5 minutes** en arrière-plan.
- Cache persistant sur disque pour des temps de réponse instantanés au démarrage.
- Synchronisation globale déclenchable manuellement depuis l'en-tête.

---

## 🏗️ Architecture Technique

### Stack

| Couche | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion (`motion`), Lucide React |
| **Backend** | Express (Node.js), TypeScript via `tsx` |
| **IA** | `@google/genai` — modèle `gemini-2.5-flash` avec Google Grounding |
| **Scraping** | Scraper Regex maison (Sika Finance + brvm.org) |

### Structure des composants frontend

```
src/
├── App.tsx                          # Orchestrateur principal (états + logique)
├── types.ts                         # Types partagés (StockData, BRVMResponse…)
├── constants/
│   └── brvmData.ts                  # SECTOR_CONFIG, COUNTRIES_MAP, fallbacks secteurs
├── utils/
│   └── formatters.ts                # formatPrice(), formatDate()
└── components/
    ├── StatusBanner.tsx             # Toast de notification (succès / erreur / info)
    ├── Header.tsx                   # En-tête avec boutons Sync et lien PDF
    ├── NavigationTabs.tsx           # Onglets Cotations / Bulletins BOC
    ├── BentoMetrics.tsx             # 3 cartes KPI (actions, variation, dividendes)
    ├── StockFilters.tsx             # Barre de filtres complète
    ├── StocksTable.tsx              # Tableau principal des 30 actions
    ├── DividendLegend.tsx           # Légende des règles d'éligibilité
    ├── StockDetailDrawer.tsx        # Panneau latéral de détail par action
    └── Bulletins/
        ├── BulletinsSidebar.tsx     # Liste des bulletins BOC
        └── BulletinAnalysisView.tsx # Affichage de l'analyse Gemini
```

### Architecture serveur

```
server.ts
├── GET  /api/brvm30/stocks                    # Données du cache
├── POST /api/brvm30/sync                      # Déclenche la synchro complète
├── POST /api/brvm30/sync-dividends/:symbol    # Synchro dividendes par action
├── GET  /api/brvm30/company-description/:s/:c # Description IA de l'entreprise
├── GET  /api/brvm/bulletins                   # Liste des BOC depuis brvm.org
└── GET  /api/brvm/analyze-bulletin/:date      # Analyse Gemini d'un bulletin PDF
```

---

## ⚙️ Installation et Configuration

### Prérequis
- [Node.js](https://nodejs.org/) ≥ 18
- Une clé API [Google AI Studio](https://aistudio.google.com/) (Gemini)

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
# APP_URL=http://localhost:3000  # Optionnel (Cloud Run)
```

### 3. Lancer en mode développement
```bash
npm run dev
```
Le serveur Express démarre sur `http://localhost:3000` et gère à la fois les API REST, les tâches de fond et le serveur Vite en développement.

---

## 📦 Commandes

| Commande | Description |
|---|---|
| `npm run dev` | Démarre le serveur de développement (backend + Vite) |
| `npm run lint` | Vérification statique des types (`tsc --noEmit`) |
| `npm run build` | Compile le frontend (Vite) et le serveur (esbuild) |
| `npm run start` | Lance le serveur de production compilé |

---

## 📁 Données persistantes

- `data/stocks_cache.json` — Cache des cours et dividendes scrappés
- `data/company_descriptions.json` — Descriptions IA des entreprises (mises en cache)

---

## ⚠️ Avertissement

Les données affichées et les analyses générées par l'IA sont fournies à titre informatif uniquement. Elles ne constituent en aucun cas des conseils en investissement.
