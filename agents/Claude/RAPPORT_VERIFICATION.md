# Rapport de vérification — suivi-brvm-30

**État audité** : branche `dev`, commit `f3cdc8b` (merge PR #11), 20/09/2026.
**Point de comparaison** : audit initial sur `007eb62` (49 fichiers modifiés depuis, +4 710 / −929 lignes).
**Périmètre** : vérification des corrections annoncées dans `agents/RAPPORT_CORRECTIONS.md` + nouvel état des lieux. Les fonctionnalités (`agents/FEATURES.md`) ne sont pas commencées et ne sont pas évaluées ici.

---

## 1. Verdict

**La base est nettement meilleure, mais « tout est bon » n'est pas encore vrai.** Environ deux tiers des corrections sont bien en place et vérifiées ; trois problèmes P0 restent, dont une régression probable en production.

| Contrôle | Résultat |
|---|---|
| `npm run lint` (tsc) | ✅ 0 erreur |
| `npm test` | ✅ 5/5 (le rapport annonce 4/4) |
| `vite build` | ✅ OK — mais JS 393 → **562 kB** (gzip 119 → 172 kB) |
| Console navigateur (bureau + mobile) | ✅ aucune erreur |
| Garde-fous API (test direct du service) | ✅ symbole inconnu → 404 · pays faux → 404 · URL externe → 400 |

**Les 3 points P0 à traiter avant toute fonctionnalité :**

1. **La composition affichée n'est pas le BRVM 30 officiel** : 10 titres sur 30 sont faux (avis BRVM n°191-2026, fourni dans `brvm30.pdf`).
2. **Régression probable en production** : un Redis déjà rempli garde les anciens symboles → la garde « < 28 titres » annule *toutes* les synchros.
3. **Rate limiting mal calibré** : un seul quota partagé, compté même sur cache hit, absent sur `sync-dividends` et sur `server.ts`.

---

## 2. Méthode et limites

**Exécuté** : `npm install`, lint, tests, build ; relecture de tout le backend et du frontend ; lancement de l'app en local (1440×900 et 390×844) avec mesures Playwright ; simulation de synchro sur l'ancien état Redis ; lecture visuelle + OCR de `brvm30.pdf` ; tests directs de `companyDescription`, `analyzeBulletin`, `syncDividendsForSymbol`, `checkRateLimit` ; recherche de la validité du modèle `gemini-3.6-flash`.

**Limites** : pas de clé Gemini (analyse des bulletins et descriptions **simulées**, donc rendu Markdown vérifié mais pas la qualité IA) ; Redis, crons et Vercel non testés ; polices Google absentes du bac à sable (largeurs approximatives, hauteurs et ordre des blocs fiables) ; la course d'état des requêtes (BUG-05) est vérifiée par lecture de code, pas par test temporisé.

---

## 3. Vérification item par item

Légende : ✅ fait et vérifié · 🟡 partiel · ❌ non fait · ⚠️ fait mais crée un problème.

### Sprint 1 — Données et sécurité

| ID | Statut | Constat |
|---|---|---|
| BUG-01 | ⚠️ | Symboles renommés dans le seed (`CBIBF`, `ONTBF`, `SDSC`), badge « Non actualisé » visible (3 badges), garde `< 28`. **Mais** aucune migration de l'état Redis existant (voir NEW-02), et `ONTBF` n'est plus dans l'indice (NEW-01). |
| BUG-02 | ❌ | Seul le nom de `SHEC` a été changé. Le rapport annonce « validation de la liste officielle » : **elle n'a pas été faite** (NEW-01). |
| BUG-03 | ✅ | Tous les imports relatifs de `lib/`, `api/`, `server.ts` portent `.js` (grep vide). |
| BUG-04 | ✅ | Markdown, listes et tableau rendus (`react-markdown` + `remark-gfm`), plus de `##` ni `\|---\|` à l'écran. |
| BUG-05 | ✅ | `AbortController`, cache par `dateCode`/`symbole`, contrôle de la sélection courante avant `setState`, nettoyage des minuteurs. (Lecture de code.) |
| BUG-06 | 🟡 | ✅ symbole/pays validés (404), URL de bulletin validée contre la liste scrapée (400), cooldown de 2 min (429), rate limit sur 3 routes. ❌ Voir NEW-03 pour les trous. |

### Sprint 2 — Incohérences

| ID | Statut | Constat |
|---|---|---|
| INC-01 | 🟡 | En-tête « Cours du 28/07/2026 à 23:10 », « Hobby plan » retiré de l'UI, `metadata.json` corrigé. **README encore contradictoire** : ligne 134 dit que `vercel.json` contient `*/5 * * * *` (il contient `0 1 * * *` et `0 2 * * *`). |
| INC-02 | ✅ | `streak` réel + `dividendStatus` (`a_jour` / `interrompu` / `aucun`) ; « INTERROMPU » visible pour BOAN. |
| INC-03 | ❌ | Le type `en_attente` existe mais n'est **jamais produit** : un exercice absent casse toujours la série (`process.ts`, `if (!dividend \|\| !dividend.paid) break`). La borne `year <= 2030` est bien corrigée. |
| INC-04 | 🟡 | Libellés corrigés (« Payeurs réguliers », « Moyenne des 30 titres », « Sources consultées »). Restent : README « Aristocrates de Dividendes » (l.19) et le libellé « Composition officielle BRVM 30 », **faux tant que NEW-01 n'est pas traité**. |
| INC-05 | 🟡 | Badge « Généré par IA — peut contenir des erreurs » ✅, repli neutre ✅. Le prompt n'a pas changé (« realistic… history », sans grounding) ; 8 descriptions sur 30 pré-générées. |
| INC-06 | ✅ | Bornes sans chevauchement (≤ 2 499 / 2 500–10 000 / ≥ 10 001), compteurs croisés par facette, alerte « Min > Max » vérifiée dans le navigateur. |
| INC-07 | ✅ | Drapeaux SVG (plus aucun emoji drapeau), ligne `cotation_…` supprimée, format « FCFA » uniforme. |
| INC-08 | ✅ | État de chargement, polling toutes les 3 s pendant une synchro, minuteurs nettoyés. (Lecture de code ; voir NEW-11 pour un effet de bord du cache.) |
| INC-09 | ✅ | `touch-manipulation`, `overscroll-contain`, `animate-fade-in` présents dans le CSS compilé ; les anciennes classes ont disparu. |
| INC-10 | 🟡 | `lang="fr"`, meta description, `theme-color`, `preconnect` ✅. `index.css` charge toujours les polices par `@import url(...)` (bloquant). |

### Sprint 3 — Accessibilité et dette

| ID | Statut | Constat |
|---|---|---|
| A11Y-01 | ✅ | Vérifié dans le navigateur : `role="dialog"`, `aria-modal`, `aria-labelledby`, focus dans le tiroir, Échap ferme, `body` en `overflow: hidden` puis rétabli. (Retour du focus sur la ligne d'origine non testé.) |
| A11Y-02 | 🟡 | Liste des bulletins en `<button aria-pressed>` ✅. Lignes du tableau : `tabIndex` + `onKeyDown` mais **pas de `role`**. |
| A11Y-03 | 🟡 | `tablist`/`tab`/`aria-selected`/`aria-controls` ✅, toast `status`/`alert` ✅. Puces de filtre : **0 `aria-pressed`**, `aria-label` qui remplacent le texte visible (ex. « Filtrer: dividendes réguliers… » vs « RÉGULIER (D ≥ 3 ANS) »). |
| A11Y-04 | ❌ | Non traité (voir NEW-07). |
| TECH-01 | ✅ | `cheerio` en place ; 1 test de parsing. |
| TECH-02/04/05/09 | ✅ | `dotenv/config` en premier, TTL 90 s, log cron sans secret, `.env.example` allégé. |
| TECH-03 | ❌ | Lecture-écriture du blob `brvm:state` toujours non protégée. |
| TECH-06 | ❌ | `sync-dividends/[symbol].ts` sans `try/catch`. |
| TECH-07 | 🟡 | Nom du paquet ✅. `vite` toujours déclaré 2 fois, `autoprefixer` et `esbuild` toujours là, `User-Agent: aistudio-build` toujours dans `gemini.ts`, `tsconfig` sans `strict`. |
| TECH-08 | 🟡 | Scripts déplacés dans `scripts/` ✅ ; ils utilisent encore `gemini-3.5-flash` (l'app : `3.6-flash`). |
| TECH-10 | 🟡 | 5 tests passent, mais faibles (voir NEW-10). |
| TECH-11 | 🟡 | `Cache-Control` sur `/stocks` ✅ ; liste des bulletins toujours non cachée. |
| TECH-12 | ❌ | **Aucun composant `FilterChip` n'existe** (le rapport le cite) ; les puces sont dupliquées dans `StockFilters.tsx`. |
| TECH-13 | ❌ | Conditions d'usage Sika / brvm.org non traitées. |

### Sprint 4 — Layout (mesures réelles)

| ID | Statut | Avant → maintenant (cible) |
|---|---|---|
| UX-01 En-tête | ✅ | 265 → **105 px** (bureau) · 544 → **153 px** (mobile) — cible ≈ 100 / ≈ 120 |
| UX-02 Onglets | 🟡 | ARIA ✅, badge « IA » sans pulsation ✅. Sur mobile le 2ᵉ onglet est **coupé** (« Bulletins Officiels (B… ») ; libellés longs et emojis conservés. |
| UX-03 KPI | 🟡 | Pictogrammes retirés ✅ : 136 → 116 px (bureau). Mobile : 456 → **335 px** (cible ≈ 100), les 3 cartes restent empilées. |
| UX-04 Filtres | ❌ | **475 → 451 px** (bureau), **1 253 → 1 237 px** (mobile). Les 23 boutons sont toujours affichés en 4 rangées. Ajoutés : puces actives amovibles, « Réinitialiser tout », alerte Min > Max. Cible ≈ 90 / ≈ 120 px. |
| UX-05 Tableau | 🟡 | ✅ en-tête collant, ▲/▼, drapeaux SVG. Ligne 76 → **67 px** (cible 56 ; jusqu'à 95 px quand le nom passe sur 4 lignes). Début du tableau 1 086 → 848 px (bureau), 2 509 → 1 901 px (mobile). **0 ligne visible sans défiler** sur les deux. **Mobile : tableau de 939 px dans 354 px, prix et variation hors écran**, pas de cartes. « FCFA » répété à chaque cellule (et coupé en 2 lignes dans Haut/Bas). Badges de secteur toujours lourds (bordure + ombre + lien par ligne). |
| UX-06 Légende | ✅ | 190 → **44 px** (bureau) · 472 → **92 px** (mobile). |
| UX-07 Tiroir | ✅ | Prix en 30 px tout en haut (y = 159), stats sur une ligne, un seul tableau de dividendes, description en dernier avec badge IA, pied collant avec « Sika Finance ↗ ». **Reste** : description en 11 px. |
| UX-08 Bulletins | ✅ | Markdown lisible, carte « Pourquoi… » repliable, « Sources consultées », « Antigravity » supprimé, badge « Bulletin de cote ». Reste : **2 boutons** pour la même action en état vide ; avertissement toujours minuscule. |

---

## 4. Nouveaux problèmes

### [ ] NEW-01 · La composition n'est pas celle du BRVM 30 officiel · `P0` `M`

- **Preuve** : `brvm30.pdf` est l'**avis n°191-2026 de la BRVM, « Nouvelle composition de l'indice BRVM 30 », du 1ᵉʳ juillet 2026** (PDF image, lu visuellement et par OCR). Comparé au seed (`data/stocks_cache.json` = `DEFAULT_BRVM_30_STOCKS`) : **20 titres sur 30 concordent seulement**.
- **Dans le seed mais hors indice (10)** : `ONTBF` (Onatel), `SHEC` (Vivo Energy), `FTSC` (Filtisac) — cités comme *sortants* par l'avis — et `PALC`, `TTLS`, `SDCC`, `NTLC`, `BICC`, `BNBC`, `SLBC`.
- **Dans l'indice mais absents du seed (10)** :

| Symbole | Société (nom de l'avis) | Pays | Secteur |
|---|---|---|---|
| `BICB` | BIIC Bénin | bj | à confirmer (banque) |
| `SIVC` | Erium CI (ex-Air Liquide CI) | ci | à confirmer |
| `SEMC` | Eviosys Packaging Siem CI | ci | à confirmer |
| `NEIC` | NEI-CEDA CI | ci | à confirmer |
| `ORAC` | Orange CI | ci | Télécommunications (à confirmer) |
| `SAFC` | SAFCA CI | ci | à confirmer (finance) |
| `STAC` | SETAO CI | ci | à confirmer |
| `STBC` | SITAB CI | ci | à confirmer |
| `SCRC` | Sucrivoire CI | ci | à confirmer |
| `UNXC` | Uniwax CI | ci | à confirmer |

- **Conséquences** : le libellé « Composition officielle BRVM 30 » est faux ; « 30 / 30 », « Variation moyenne des 30 titres », « Payeurs réguliers », tous les compteurs de secteurs et de pays sont calculés sur un mauvais échantillon. Le renommage `SHEC → Vivo Energy` et `ONTB → ONTBF` porte sur des titres qui ont quitté l'indice.
- **Ce n'était pas détecté** parce que le test « cohérence seed / carte » compare le seed à lui-même, pas à la source officielle.
- **Correctif** :
  1. Créer `data/brvm30-composition.json` (`{ avis: "191-2026", date: "2026-07-01", stocks: [{symbol, name, country, sector}] }`) comme **source unique** du seed, des cartes de secteurs et des tests.
  2. Retirer les 10 sortants, ajouter les 10 entrants (secteurs à confirmer sur les fiches BRVM) ; laisser `syncDividendsBatch` compléter les dividendes et **pré-générer les descriptions** des nouveaux titres.
  3. Test : `symboles du seed == symboles de l'avis` (30/30).
  4. Afficher « Composition au 01/07/2026 (avis n°191) » depuis ce fichier, avec lien vers le PDF.
  5. La révision est **trimestrielle** : prévoir un rappel avant la prochaine (le PDF est une image, donc pas d'extraction automatique fiable). Sika liste plus de 30 titres : la synchro ne peut pas détecter seule un changement d'indice.
- **Critère** : le test de conformité passe ; l'UI affiche 30 titres identiques à l'avis.

### [ ] NEW-02 · La synchro sera annulée en production (Redis déjà rempli) · `P0` `M`

- **Preuve** : `getState()` renvoie l'état Redis tel quel s'il existe, sans le comparer au seed. Simulation avec l'ancien état (`007eb62`) et Sika renvoyant les 30 vrais tickers : **27/30 titres appariés → « Synchronisation annulée (garde < 28) »**. Avec un état neuf : 30/30.
- **Effet** : après déploiement, chaque synchro manuelle et chaque cron échoue (HTTP 500 « Moins de 28 titres appariés »). Les cours ne se mettent plus à jour et le bouton « Actualiser » n'affiche qu'une erreur. Les anciennes lignes n'ont pas non plus `dividendStatus`.
- **Correctif** :
  1. `reconcileState(stored, seed)` dans `getState()` : ajoute les symboles manquants, retire ceux qui ont quitté l'indice, applique une table d'alias (`CBIB→CBIBF`, `ONTB→ONTBF`, `SDVC→SDSC`), relance `processStockDividends`.
  2. Versionner l'état (`compositionVersion: "191-2026"`) pour ne réconcilier qu'une fois.
  3. À défaut, un script `scripts/reset-state.ts` qui supprime `brvm:state` (les prix se rechargeront à la synchro suivante).
  4. Remplacer la valeur fixe `28` par « au moins 90 % de la composition » calculé depuis le fichier de NEW-01.
- **Critère** : test unitaire avec l'ancien état en fixture → après réconciliation, 30/30 appariés.

### [ ] NEW-03 · Rate limiting : mal calibré et incomplet · `P0` `M`

- **Preuve** : 12 appels de la même IP → 10 acceptés, 2 refusés (429) ; **une seule clé par IP pour tous les endpoints**, vérifiée **avant** le cache.
- **Effet utilisateur** : chaque ouverture d'un tiroir appelle `company-description` (seules 8 descriptions sur 30 sont en cache serveur). Parcourir plus de 10 titres en une minute, ou partager une IP mobile (fréquent), donne « Impossible de charger la description » sans explication.
- **Trous** :
  - `api/brvm30/sync-dividends/[symbol].ts` : aucun quota (déclenche un scrape Sika).
  - `server.ts` (utilisé par `npm start`) : aucun quota sur `/sync` et `/sync-dividends` ; il utilise `req.socket.remoteAddress` (l'IP du proxy derrière nginx : tous les visiteurs partagent alors un seul quota).
  - `/api/brvm/bulletins` : 1 à 3 requêtes vers brvm.org à chaque appel, sans quota ni cache.
- **Correctif** : préfixer les clés par endpoint (`desc:`, `boc:`, `sync:`) ; appliquer le quota **après** le test de cache, juste avant Gemini ou le scrape ; afficher dans l'UI « Trop de requêtes, réessayez dans X s » ; ajouter les mêmes protections dans `server.ts` (`app.set("trust proxy", 1)`, `req.ip`) ; mettre la liste des bulletins en cache (Redis 1 h ou `s-maxage=300`).
- **Critère** : ouvrir 15 titres en une minute ne produit aucune erreur ; 11 appels Gemini/minute donnent un 429 lisible.

### [ ] NEW-04 · Statut « en attente » jamais calculé · `P1` `S`
Voir INC-03. Un titre qui a payé 2021-2024 mais dont l'exercice 2025 n'est pas encore publié apparaît « interrompu » (risque en début d'année, à confirmer sur les données Sika). → Distinguer « absent » de « 0 » dans `dividendsForRollingWindow`, produire `en_attente`, et démarrer la série à N-2 tant que N-1 n'est pas publié pour la majorité des titres.

### [ ] NEW-05 · Les filtres restent un mur de puces · `P1` `L`
Voir UX-04 : 451 px (bureau) et 1 237 px (mobile), 4 rangées de 23 boutons. → Une rangée de contrôles `h-11` : recherche + menus « Secteur ▾ », « Pays ▾ », « Prix ▾ » + bascule « Réguliers » ; les compteurs dans les menus ; mobile : bouton « Filtres (2) » ouvrant une feuille. Vous avez déjà les puces actives et « Réinitialiser » : elles deviennent l'affichage principal. **Critère** : ≤ 130 px sur bureau, ≤ 140 px sur mobile.

### [ ] NEW-06 · Mobile : le prix est hors écran · `P1` `M`
Voir UX-05 : tableau de 939 px dans 354 px ; on voit Symbole et Entreprise, pas le prix ni la variation, et rien n'indique qu'il faut faire défiler. → Sous 640 px, liste de cartes `p-4` (nom + symbole à gauche, prix + variation à droite, tap → tiroir) ; sur bureau, largeurs `symbole w-24`, `prix w-32`, `variation w-28`, nom sur une ligne (`truncate`), « FCFA » dans l'en-tête de colonne, secteur en point coloré + texte sans bordure. **Critère** : ≥ 5 titres avec prix visibles sans défilement horizontal sur 390 px.

### [ ] NEW-07 · Lisibilité et accessibilité tactile non traitées · `P1` `M`
Mesuré : **217 textes sur 438 (50 %) font ≤ 10 px** (inchangé) ; **55 cibles sur 68 font moins de 44 px, la plus petite 16 px** ; 10 usages de `text-[#141414]/50` (≈ 3,5:1, sous 4,5:1) et 30 de `/60` ; 82 occurrences de `text-[9px|10px|11px]` (31 dans `StockFilters.tsx`) ; description du tiroir en 11 px. → Plancher de 12 px (14 px pour le texte courant), opacité ≥ 70 %, cibles de 44 px sur mobile, `aria-pressed` sur les puces, retirer les `aria-label` qui contredisent le texte visible, `role="button"` sur les lignes.

### [ ] NEW-08 · Poids du JavaScript +43 % · `P2` `S`
393 → 562 kB (gzip 119 → 172 kB), avertissement Vite « chunk > 500 kB ». Cause probable : `react-markdown` + `remark-gfm` (chargés même si l'onglet Bulletins n'est jamais ouvert), drapeaux, analytics. → `React.lazy` pour `BulletinAnalysisView` et le rendu Markdown ; charger le composant à l'ouverture de l'onglet.

### [ ] NEW-09 · Documentation encore contradictoire · `P2` `S`
README l.134 (`*/5 * * * *` alors que `vercel.json` = 1×/jour), l.19 « Aristocrates de Dividendes », `BRVM_30_URL` par défaut pointant vers un PDF Sika qui peut ne pas refléter l'avis n°191. `brvm30.pdf` est à la racine sans être utilisé → le déplacer dans `docs/` avec une version texte, et référencer l'avis dans le README.

### [ ] NEW-10 · Tests trop faibles pour verrouiller les corrections · `P1` `M`
Les 5 tests couvrent un cas nominal de dividendes, la normalisation du pays, un parsing HTML, une URL et une cohérence seed/carte. Manquent : rupture de série, `interrompu` / `aucun` / `en_attente`, `mergeScrapedQuotes` + seuil, réconciliation d'état (NEW-02), conformité à l'avis officiel (NEW-01), quota de requêtes (NEW-03), et une fixture HTML Sika réelle.

### [ ] NEW-11 · Qualité de données et cache · `P2` `S`
- `sector` retombe silencieusement sur « Services Financiers » (`process.ts` et `App.tsx`) : un symbole inconnu est classé banque sans alerte → « Non classé » + log.
- Un titre absent de la synchro du jour garde son ancien `source: "scraped"` et voit son `lastUpdated` réinitialisé à chaque traitement : un cours périmé n'est **pas** signalé. → Ne mettre à jour `lastUpdated` que si le titre est apparié ; repasser `source` à `"fallback"` sinon.
- Le polling de `isSyncing` appelle `/api/brvm30/stocks`, servi avec `s-maxage=60` : l'état de synchro peut rester périmé 60–90 s. → `?t=Date.now()` ou `Cache-Control: no-store` sur l'appel de polling.

### [ ] NEW-12 · Hygiène restante · `P2` `S`
`vite` déclaré 2 fois, `autoprefixer` et `esbuild` inutiles (Tailwind v4), `User-Agent: aistudio-build`, `tsconfig` sans `strict`, scripts en `gemini-3.5-flash`, modèle Gemini codé en dur à 2 endroits (→ constante ou `GEMINI_MODEL`), doublon de routes entre `server.ts` et `api/`, polices en `@import` CSS (→ `<link>` dans `index.html`), TECH-03, TECH-06, TECH-12, TECH-13.

### Point Gemini — vérifié

`gemini-3.6-flash` **existe** (disponible depuis juillet 2026) et l'appel est compatible avec les règles de cette génération : pas de `temperature`, pas de préremplissage de tour modèle. Le commit intermédiaire `gemini-3.8-live` était un modèle vocal, corrigé depuis. Reste le prompt de description (« realistic… history », sans grounding) qui expose à des inventions.

---

## 5. Écarts entre `RAPPORT_CORRECTIONS.md` et l'état réel

| Affirmation du rapport | Réalité |
|---|---|
| « Validation de la liste officielle des 30 titres » | Non faite : 10 écarts sur 30 (NEW-01). |
| « Toutes les exigences du BACKLOG.md ont été appliquées » | Non : INC-03, A11Y-04, TECH-03/06/12/13 non faits ; UX-04, UX-05, UX-03 partiels. |
| « 4/4 tests Vitest » | 5 tests. |
| « Barre de filtres compacte avec `FilterChip` » | 451 px au lieu de 475 px ; aucun composant `FilterChip`. |
| « Hauteur de ligne réduite à ~56 px » | 67 px (jusqu'à 95 px). |
| « Sur mobile… le tableau s'adapte horizontalement » | Prix et variation hors écran, sans indication (NEW-06). |
| « Nettoyage du `package.json` » | Partiel (`vite` en double, paquets inutiles). |
| « Captures visuelles Playwright » | Non vérifiable depuis le dépôt (aucune capture commitée). |

---

## 6. Mesures de référence (bureau 1440×900 / mobile 390×844)

| Mesure | Initial | Actuel | Cible |
|---|---|---|---|
| Hauteur de page | 3 869 / 5 589 px | 3 176 / 4 313 px | — |
| Hauteur en-tête | 265 / 544 px | **105 / 153 px** | ≈ 100 / ≈ 120 |
| Hauteur KPI | 136 / 456 px | 116 / 335 px | ≈ 116 / ≈ 100 |
| Hauteur filtres | 475 / 1 253 px | **451 / 1 237 px** | ≈ 90 / ≈ 120 |
| Début du tableau | 1 086 / 2 509 px | 848 / 1 901 px | ≤ 450 / ≤ 600 |
| Lignes visibles sans défiler | 0 / 0 | **0 / 0** | ≥ 8 / ≥ 5 |
| Hauteur d'une ligne | 76 px | 67 px | ≈ 56 |
| Légende dividendes | 190 / 472 px | **44 / 92 px** | atteint |
| Textes ≤ 10 px | 44 % | **50 %** (217/438) | 0 % |
| Cibles < 44 px | 53 / 65 | **55 / 68** (min 16 px) | 0 sur mobile |
| JS gzip | 119 kB | 172 kB | ≤ 120 kB (lazy) |

---

## 7. Ordre de travail proposé

1. **Sprint A — Données (P0)** : NEW-01 → NEW-02 → NEW-03. Traiter NEW-01 et NEW-02 dans la même livraison (même fichier source, même migration), puis déployer en vérifiant que la première synchro donne 30/30.
2. **Sprint B — Lisibilité (P1)** : NEW-05, NEW-06, NEW-07, NEW-04, NEW-10 (les tests d'abord pour NEW-01/02/03).
3. **Sprint C — Finitions (P2)** : NEW-08, NEW-09, NEW-11, NEW-12, restes UX-02 / UX-03 / UX-08 (bouton dupliqué, avertissement 9 px).
4. **Ensuite seulement, les fonctionnalités** : FEAT-01 (favoris), FEAT-02 (rendement) et FEAT-04 (URL) reposent sur une liste de titres juste ; FEAT-06 (historique) suppose une synchro qui fonctionne (NEW-02).

**Définition de « terminé »** : test de conformité à l'avis officiel vert ; première synchro de production à 30/30 ; ≥ 8 titres (bureau) et ≥ 5 titres (mobile) visibles avec leur prix sans défiler ni scroller à l'horizontale ; aucun texte < 12 px ; aucune cible tactile < 44 px sur mobile ; navigation complète au clavier.
