# 🐂 Bull Investment Tracker — Suivi de l'Indice BRVM 30

**Bull Investment Tracker** est une application web moderne conçue pour suivre et analyser en temps réel les performances des 30 entreprises les plus dynamiques de la Bourse Régionale des Valeurs Mobilières (BRVM). L'application propose une interface soignée de style néobrutaliste à fort contraste, tout en intégrant des fonctionnalités d'analyse financière automatisée et d'intelligence artificielle.

---

## 🚀 Fonctionnalités Clés

- 📊 **Suivi en temps réel de l'indice BRVM 30** : Récupération automatique et scraping via Regex ultra-fiable des cours de bourse et variations depuis Sika Finance.
- 💰 **Analyseur de Dividendes intelligent** :
  - Calcul dynamique de la régularité des versements sur un cycle glissant de 5 ans (`année actuelle - 1`).
  - Attribution automatique d'un score de régularité (de `0/5` à `5/5`).
  - Détection et affichage dynamique des "Aristocrates de Dividendes" (versements ininterrompus depuis $\ge 3$ ans).
- 🤖 **Descriptions d'entreprises par l'IA** : Intégration de **Gemini 3.5 Flash** pour générer et mettre en cache des descriptions professionnelles et complètes en français de chaque entreprise.
- 🔄 **Mise à jour automatique et Cache résilient** :
  - Synchronisation en arrière-plan toutes les 5 minutes.
  - Persistence locale des données via un système de cache pour garantir des temps de réponse instantanés.
  - Possibilité de forcer la synchronisation globale ou par action individuelle.
- 🎨 **Design Néobrutaliste unique** : Look épuré avec des bordures épaisses, des ombres marquées, des contrastes élevés, des badges pays explicites et une fluidité totale des animations grâce à `motion`.

---

## 🛠️ Architecture Technique

L'application est bâtie sur une stack moderne :
- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion (motion), Lucide React.
- **Backend** : Express (Node.js), TypeScript compiler (`tsx`).
- **IA** : SDK Google Gen AI (`@google/genai`) avec le modèle `gemini-3.5-flash`.
- **Scraping** : Scraper Regex robuste et léger pour extraire les données de Sika Finance de manière performante et sans surcharger le client.

---

## ⚙️ Configuration et Installation

### Prérequis
- [Node.js](https://nodejs.org/) (Version $\ge 18$ recommandée)
- Un compte [Google AI Studio](https://aistudio.google.com/) pour obtenir une clé API Gemini.

### Étape 1 : Cloner le projet et installer les dépendances
```bash
npm install
```

### Étape 2 : Configurer les variables d'environnement
Créez un fichier `.env` à la racine du projet en vous basant sur `.env.example` :
```env
PORT=5000
GEMINI_API_KEY=votre_cle_api_gemini_ici
BRVM_30_URL=https://www.sikafinance.com/docs/brvm-30-composition-de-l-indice-brvm-30.pdf
# APP_URL=http://localhost:5000  # Optionnel : utilisé par AI Studio pour les déploiements Cloud Run
```

### Étape 3 : Lancer l'application en mode développement
```bash
npm run dev
```
L'application démarre le serveur de développement Express qui orchestre à la fois les API REST, les tâches de synchronisation en tâche de fond et le serveur de build/Vite.

---

## 📦 Commandes Disponibles

- `npm run dev` : Démarre le serveur backend et l'environnement de développement.
- `npm run lint` : Effectue une vérification statique des types via TypeScript (`tsc --noEmit`).
- `npm run build` : Compile l'application frontend avec Vite et bundlerise le serveur Node avec `esbuild`.
- `npm run start` : Exécute le serveur de production compilé.
