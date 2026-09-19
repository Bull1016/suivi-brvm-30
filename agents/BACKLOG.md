# Backlog — suivi-brvm-30

Audit de la branche `dev` (commit `007eb62`, 19/09/2026). Objectif produit : **une expérience simple et conviviale**.

**Légende** — Priorité : `P0` bloquant / données fausses · `P1` important · `P2` confort · `P3` idée.
Effort : `S` < 2 h · `M` ½–1 jour · `L` > 1 jour.

**Limites de l'audit** : Gemini non appelé (pas de clé, réponse Markdown simulée) ; Redis et crons non testés en production ; polices Google absentes du bac à sable de mesure (largeurs approximatives, hauteurs fiables) ; les points marqués « à vérifier » sont des hypothèses fortes, pas des certitudes.

---

## 0. Mesures de référence (avant → cible)

| Mesure | Avant (bureau 1440×900) | Avant (mobile 390×844) | Cible |
|---|---|---|---|
| Début du tableau (y) | 1 086 px | 2 509 px | ≤ 450 px / ≤ 600 px |
| Lignes visibles sans défiler | 0 | 0 | ≥ 8 / ≥ 5 |
| Hauteur du bloc filtres | 475 px | 1 253 px | ≈ 90 px / ≈ 120 px |
| Hauteur en-tête | 265 px | 544 px | ≈ 100 px / ≈ 120 px |
| Hauteur d'une ligne de tableau | 76 px | 76 px | ≈ 56 px / carte ≈ 72 px |
| Espace entre blocs | 32 px partout | 32 px partout | échelle 24 / 40 |
| Textes ≤ 10 px | 44 % (217/490) | idem | 0 % |
| Cibles cliquables < 44 px | 53 sur 65 | 52 sur 65 | 0 sur mobile |
| Poids du JS | 393 kB (119 kB gzip) | — | inchangé |

---

## 1. Sprint 1 — Données et sécurité (P0)

### [ ] BUG-01 · Trois titres ne sont jamais actualisés · `P0` `S`
- **Où** : `lib/brvm/constants.ts`, `data/stocks_cache.json`, `src/constants/brvmData.ts`, `lib/brvm/scrape.ts`.
- **Problème** : le seed utilise `CBIB`, `ONTB`, `SDVC` ; le marché publie `CBIBF`, `ONTBF`, `SDSC` (vérifié sur des bulletins de cote publiés). `mergeScrapedQuotes` ne les apparie jamais : ils restent en `source: "fallback"` (10 500 / 2 450 / 1 950 F figés). L'UI n'affiche jamais `source`. Le contournement `CBIBF → CBIB` existe déjà pour les secteurs (`fetchBRVMSectors`), pas pour les cours.
- **Correctif** : renommer les symboles (seed, cartes de secteurs, fallback front) ; badge « Cours non actualisé » quand `source === "fallback"` ; faire échouer la synchro (et ne pas sauvegarder) si moins de ~28 titres sont appariés.
- **Critère** : après une synchro, 30/30 titres en `source: "scraped"`.

### [ ] BUG-02 · `SHEC` = « Servair Abidjan » classé « Énergie » ; composition figée · `P0` `M`
- **Où** : `data/stocks_cache.json`, `lib/brvm/constants.ts` (`DEFAULT_BRVM_30_STOCKS`).
- **Problème** : `SHEC` est classé Énergie dans la carte sectorielle (cohérent avec Vivo Energy CI, **à vérifier**) mais porte le nom d'un autre titre (Servair Abidjan = `ABJC`, présent dans la carte, absent des 30). La liste des 30 est statique alors que l'UI affiche « Composition officielle BRVM 30 ». Orange CI (`ORAC`) est cotée mais absente du seed (**à vérifier** vs le PDF officiel).
- **Correctif** : vérifier chaque ligne (symbole, nom, pays, secteur) contre le PDF `BRVM_30_URL` ; ajouter une comparaison automatique à chaque synchro (log + alerte si écart) ; retirer `ABJC` de la carte si non utilisé.
- **Critère** : liste du seed identique au PDF officiel ; test unitaire qui compare symboles seed ↔ carte sectorielle.

### [ ] BUG-03 · Import sans `.js` dans `bulletins.ts` · `P0` `S`
- **Où** : `lib/brvm/bulletins.ts` lignes 1-2 (`./types`), `lib/brvm/constants.ts` ligne 1 (import de type, inoffensif mais à aligner).
- **Problème** : import de valeur (`SCRAPE_HEADERS`) sans extension ; avec `"type": "module"` sur Vercel, `ERR_MODULE_NOT_FOUND` très probable sur `/api/brvm/bulletins` et `analyze-bulletin`. Fonctionne en local via `tsx`.
- **Correctif** : `./types.js`. Ajouter une vérification CI (`grep`/ESLint `import/extensions`) pour éviter la récidive.
- **Critère** : les deux routes répondent 200 sur un déploiement Vercel de preview.

### [ ] BUG-04 · Analyse des bulletins affichée en Markdown brut · `P0` `S`
- **Où** : `src/components/Bulletins/BulletinAnalysisView.tsx` (`whitespace-pre-line`), `lib/brvm/gemini.ts` (prompt « markdown »).
- **Problème** : on voit `##`, `**`, `|---|`.
- **Correctif** : `react-markdown` + `remark-gfm` ; composants stylés (titres, listes, tableaux avec `overflow-x-auto`) ; pas de HTML brut.
- **Critère** : un tableau et des titres Markdown s'affichent mis en forme.

### [ ] BUG-05 · Réponses affichées au mauvais endroit (courses) · `P0` `M`
- **Où** : `src/App.tsx` — `runBulletinAnalysis`, `fetchCompanyDescription`.
- **Problème** : lancer une analyse puis choisir un autre bulletin affiche le résultat du premier sous le second (et le spinner reste actif sur le nouveau). Même risque en changeant vite de ligne.
- **Correctif** : `AbortController` par requête, ou comparer l'identifiant demandé à l'identifiant courant avant `setState` ; mémoriser les analyses dans un `Map<dateCode, …>` ; nettoyer `setInterval`/`setTimeout` au démontage.
- **Critère** : test manuel — lancer A, sélectionner B : B n'affiche jamais le contenu de A.

### [ ] BUG-06 · Endpoints publics coûteux et empoisonnables · `P0` `M`
- **Où** : `api/brvm/analyze-bulletin/[date].ts`, `api/brvm30/company-description/…`, `api/brvm30/sync.ts`, `api/brvm30/sync-dividends/[symbol].ts`, `server.ts` (doublon).
- **Problème** : aucune limite ni authentification.
  - `company-description` accepte n'importe quel symbole/pays → appel Gemini + écriture Redis.
  - `analyze-bulletin` accepte toute URL `www.brvm.org` contenant les 8 chiffres et met le résultat en cache pour tous (empoisonnement).
  - `sync` peut être déclenché en boucle.
- **Correctif** :
  - Vérifier le symbole dans `state.stocks` (404 sinon) ; vérifier que l'URL fait partie de la liste scrapée ; valider `dateCode` **avant** la lecture du cache.
  - `@upstash/ratelimit` (Upstash déjà présent) par IP sur les routes IA et sync.
  - Refuser `sync` si `lastSync` < 2 min (réponse 429 avec l'heure de la prochaine tentative possible).
  - Extraire la logique d'`analyze-bulletin` dans `service.ts` et l'appeler depuis `api/` **et** `server.ts` (fin du doublon).
- **Critère** : appel avec symbole inconnu → 404 sans appel Gemini ; 11ᵉ appel/min → 429.

---

## 2. Incohérences produit et données (P1)

### [ ] INC-01 · Fréquence de mise à jour contradictoire · `P1` `S`
README « toutes les 5 min (Pro) » ↔ `vercel.json` 1×/jour ↔ header « quotidienne (Hobby plan) » et « en temps réel » ↔ `metadata.json` « prix en temps réel ».
→ Une seule vérité, affichée comme « Cours du JJ/MM à HH:MM » (différés). Retirer « Hobby plan » de l'UI, corriger README et `metadata.json`. Vérifier en production que les crons tournent bien (le seed date du 28/07).

### [ ] INC-02 · Score dividendes trompeur · `P1` `M`
- **Où** : `lib/brvm/process.ts` (`streak = consecutiveYears >= 3 ? consecutiveYears : 0`), `StocksTable.tsx`, `StockDetailDrawer.tsx`, `DividendLegend.tsx`, README (« 0/5 à 5/5 »).
- **Problème** : ETIT a payé en 2025 → « 0/5 Non éligible », comme ORGT qui n'a jamais rien versé ; BOAN (payé 2021-2024, pas 2025) idem.
- **Correctif** : stocker `consecutiveYears` (réel) et `dividendStatus` (`a_jour` / `en_attente` / `interrompu` / `aucun`) ; afficher le vrai score ; badge « D » seulement si ≥ 3.
- **Critère** : ETIT affiche 1/5, ORGT « aucun ».

### [ ] INC-03 · Fenêtre de 5 ans et exercice non encore publié · `P1` `S` (à vérifier)
`processStockDividends` démarre à `année-1`. Si Sika ne liste l'exercice N-1 qu'après paiement, tous les titres tombent à 0 en début d'année. Un exercice absent est aujourd'hui traité comme « non versé » (`dividendsForRollingWindow`).
→ Distinguer « absent » de « 0 » ; démarrer à N-2 tant que N-1 n'est pas publié pour la majorité des titres. Remplacer `year <= 2030` (codé en dur, `scrape.ts`) par `année courante + 1`.

### [ ] INC-04 · Libellés qui promettent plus que le calcul · `P1` `S`
- « Variation moyenne — Séance consolidée de l'indice » = moyenne arithmétique des 30 variations, pas la variation de l'indice (pondéré) → « Variation moyenne des 30 titres » ou récupérer la vraie valeur.
- « Aristocrates Dividendes » (≥ 3 ans) → « Payeurs réguliers ».
- « Sources vérifiées et croisées par l'IA » → « Sources consultées ».
- Badge « Séance du Jour » affiché sur n'importe quel bulletin → seulement pour la date du jour.
- « Description officielle » → « Description générée par IA ».
- Pied de page « Antigravity Trading Agent 2.5 » → retirer ou remplacer par le vrai nom de l'app.

### [ ] INC-05 · Descriptions d'entreprises peu fiables · `P1` `M`
- **Où** : `lib/brvm/gemini.ts` (`generateCompanyDescription`), `lib/brvm/service.ts` (`companyDescription`).
- **Problème** : prompt sans grounding qui demande une histoire « realistic » (risque d'invention) ; texte de repli générique renvoyé avec `success: true` ; seules 8 descriptions sur 30 sont pré-générées (les 22 autres déclenchent Gemini à l'ouverture du tiroir).
- **Correctif** : pré-générer les 30 (script) avec grounding et sources ; repli court et neutre avec `source: "fallback"` exploité par l'UI ; badge « Généré par IA — peut contenir des erreurs ».

### [ ] INC-06 · Filtres incohérents · `P1` `S`
- « < 2 500 F » est codé `<=` ; « 2 500–10 000 » chevauche aux deux bornes.
- Compteurs secteur et pays s'ignorent (`stocksFilteredByOthers` exclut les deux).
- Min > Max → zéro résultat sans message.
→ Bornes exclusives cohérentes, compteurs par facette croisée, message d'erreur, suppression de l'état redondant `pricePreset`.

### [ ] INC-07 · Formats d'affichage · `P1` `S`
« 0 FCFA », « 305 F CFA », « 305 F » (graphique) ; ligne interne `cotation_SNTS.sn` sous chaque nom ; drapeaux emoji illisibles sous Windows.
→ Un seul `formatPrice` ; supprimer la ligne technique ; drapeaux SVG (`country-flag-icons`).

### [ ] INC-08 · États de chargement et de synchro · `P1` `M`
- Premier rendu : tableau « Aucun résultat ne correspond à vos filtres » et KPI « 0 / 30 » avant l'arrivée des données → état `loading` + squelettes.
- `isSyncing` jamais re-vérifié : bouton bloqué si la page s'ouvre pendant une synchro → polling léger tant que `isSyncing`.
- `showStatus` : un nouveau toast est fermé trop tôt par le minuteur du précédent → stocker et `clearTimeout` ; idem `dividendUpdateMsg`.
- Tiroir : bref affichage de « Impossible de charger la description » avant le début du chargement.

### [ ] INC-09 · Classes Tailwind sans effet · `P1` `S`
Vérifié dans le CSS compilé : `touch-action-manipulation` (`App.tsx:376`) → `touch-manipulation` ; `overscroll-behavior-contain` (tiroir) → `overscroll-contain` ; `animate-fade-in` (aucune keyframe) → définir l'animation dans `@theme` ; `prose prose-sm` → installer `@tailwindcss/typography` (utile pour BUG-04).

### [ ] INC-10 · Métadonnées de page · `P1` `S`
`index.html` : `lang="en"` → `fr` ; ajouter meta description, `theme-color` ; charger les polices avec `<link rel="preconnect">` + `display=swap` au lieu d'un `@import` CSS bloquant.

---

## 3. Accessibilité (P1)

### [ ] A11Y-01 · Tiroir de détail · `P1` `M`
Pas de `role="dialog"` / `aria-modal`, Échap ne ferme pas (testé), scroll du fond non bloqué, pas de focus trap ni de retour du focus.
→ `<dialog>` natif ou focus trap + Échap + `overflow: hidden` sur `body`.

### [ ] A11Y-02 · Éléments cliquables non natifs · `P1` `S`
Lignes de bulletins = `div onClick` (0 focusable) → `<button>`. Lignes du tableau : `tabIndex` sans rôle → mettre un vrai bouton/lien sur le nom.

### [ ] A11Y-03 · Libellés et rôles · `P1` `S`
- `aria-label` qui remplacent le texte visible (onglets, puces) : supprimer (le texte visible suffit).
- Onglets : `role="tablist"` / `tab` / `aria-selected`. Puces de filtre : `aria-pressed`.
- Toast : `role="alert"` **et** `aria-live="polite"` se contredisent → `role="status"` pour info/succès, `alert` pour erreur.
- Bouton icône-seul de téléchargement PDF : `aria-label`.

### [ ] A11Y-04 · Contraste et cibles · `P1` `S`
119 éléments en opacité 40-60 % (à 50 % : ≈ 3,5:1, sous 4,5:1) → texte secondaire ≥ 70 % ; texte ≥ 12 px ; cibles tactiles 44 px ; rouge/vert doublés d'une flèche ▲/▼.

---

## 4. Dette technique (P2)

- [ ] **TECH-01** `S` — Scraping par regex (`<tr>` exact) fragile → `cheerio` + fixtures HTML sauvegardées + tests (Vitest). Alerte si le nombre de lignes parsées chute.
- [ ] **TECH-02** `S` — `server.ts` : `dotenv.config()` après les imports (fonctionne car lectures d'env paresseuses, sauf `DEFAULT_BRVM30_PDF`) → `import "dotenv/config"` en premier.
- [ ] **TECH-03** `M` — `syncDividendsForSymbol` et `syncDividendsBatch` relisent/réécrivent tout `brvm:state` : deux synchros simultanées s'écrasent → une clé Redis par titre, ou verrou commun.
- [ ] **TECH-04** `S` — Verrou `SYNCING_TTL_SECONDS = 60` égal à `maxDuration` : il peut expirer pendant la synchro → TTL 90 s.
- [ ] **TECH-05** `S` — Crons : sans `CRON_SECRET`, les appels Vercel échouent en 401 silencieusement → log explicite ; `sync-dividends-cron` renvoie 200 même si tout a échoué.
- [ ] **TECH-06** `S` — Handlers sans `try/catch` (`sync.ts`, `sync-dividends/[symbol].ts`).
- [ ] **TECH-07** `S` — Nettoyage : `vite` déclaré deux fois, paquet `react-example` → `suivi-brvm-30`, `autoprefixer`/`esbuild` inutiles avec Tailwind v4, commentaire mojibake dans `vite.config.ts`, `User-Agent: aistudio-build` dans `gemini.ts`, `tsconfig` sans `strict`.
- [ ] **TECH-08** `S` — Scripts `test-*.js` et `check-content.js` à la racine : ce ne sont pas des tests (l'un utilise `gemini-3.5-flash`, l'app `gemini-2.5-flash`) → déplacer dans `scripts/` ou supprimer ; modèle Gemini dans une constante/variable d'env.
- [ ] **TECH-09** `S` — `.env.example` liste `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL`, `REDIS_URL` que le README dit de ne pas utiliser.
- [ ] **TECH-10** `M` — Aucun test : ajouter des tests unitaires sur `processStockDividends`, `parseDividendsFromHtml`, `formatDateCode`, `validateBulletinUrlForDateCode`, et un test de cohérence seed ↔ cartes.
- [ ] **TECH-11** `S` — Cache HTTP : `Cache-Control: s-maxage=60, stale-while-revalidate` sur `/api/brvm30/stocks` ; mettre la liste des bulletins en cache Redis (1 h) au lieu de scraper brvm.org à chaque ouverture d'onglet.
- [ ] **TECH-12** `S` — Extraire un composant `FilterChip` (le même bloc de classes est copié ~20 fois) et regrouper les 16 props de `StockFilters` dans un objet.
- [ ] **TECH-13** `S` — Vérifier les conditions d'usage de Sika Finance et brvm.org pour le scraping (User-Agent usurpé) ; limiter la fréquence, citer la source.

---

## 5. Layout et espacement (UX)

**Diagnostic** : deux sortes de vide. Le *vide mort* (en-tête, filigrane, pictogrammes, bandeau « Hobby plan ») prend de la place sans information ; la *densité mal placée* comprime le contenu utile (puces, chiffres) en 10 px. Chaque élément a une bordure de 2 px et une ombre dure (6/4/3/2/1 px) : tout parle au même volume. Il faut moins de chrome et plus d'air **autour des données**.

**Échelle d'espacement** (à appliquer partout) : 4 / 8 / 12 / 16 / 24 / 32 / 48. Dans un groupe 8–12 ; entre groupes 24 ; entre sections 40 (`mt-10`) ; cartes `p-6 sm:p-8`. Texte courant ≥ 14 px, légendes ≥ 12 px à ≥ 70 % d'opacité. Ombres : 4 px pour les cartes, aucune sur les puces.

### [ ] UX-01 · En-tête · `P1` `S`
- **Serré** : rien. **Vide à tort** : colonne droite (deux boutons empilés désalignés), filigrane `TrendingUp` (passe derrière le titre sur mobile), bande basse qui répète la date.
- **Changements** : une ligne sur bureau, `px-6 py-5` (≈ 100 px) ; titre `text-2xl sm:text-3xl` ; à droite « Cours du 28/07 · 23:10 » (`text-sm`, 70 %) + bouton « Actualiser » 44 px ; PDF dans un menu « … » ; supprimer le paragraphe (ou 1 ligne `text-sm`) et le filigrane. Mobile : titre `text-2xl`, sans bordure ni ombre, `pt-4 pb-3`.

### [ ] UX-02 · Onglets · `P2` `S`
- **Serré** : libellés sur 3-4 lignes sur mobile (barre de 96 px) ; emoji ; « NOUVEAU » qui pulse en permanence.
- **Changements** : « Cotations » / « Bulletins », `px-5 py-3`, icônes Lucide, `overflow-x-auto whitespace-nowrap`, `mb-6` ; « NOUVEAU » sans `animate-pulse`, retiré après la première visite.

### [ ] UX-03 · Cartes KPI · `P2` `S`
- **Vide à tort** : trois pictogrammes carrés (48 px chacun) ; flèche de tendance dupliquée dans la carte centrale ; 456 px empilées sur mobile.
- **Changements** : retirer les carrés d'icônes ; `grid-cols-3 gap-3 sm:gap-6`, `p-4 sm:p-6`, chiffre `text-2xl sm:text-3xl`, sous-titre masqué < 640 px (≈ 100 px sur mobile) ; même ombre sur les trois.

### [ ] UX-04 · Filtres (le pire bloc) · `P0` `L`
- **Serré** : 23 boutons en 4 rangées de même poids, 10 px ; « Télécommunications » orphelin ; mur de 23 lignes sur mobile. **Vide à tort** : pas de compteur de résultats, état vide sans action.
- **Changements** :
  - Une rangée `flex flex-wrap gap-3` de contrôles `h-11` : recherche `flex-1 min-w-[240px]` + menus « Secteur ▾ », « Pays ▾ », « Prix ▾ » + bascule « Réguliers ». Compteurs dans les menus.
  - Filtres actifs = puces amovibles (`gap-2 mt-3`), visibles seulement s'il y en a, avec « N résultats · Réinitialiser ».
  - Carte `p-4`, sans séparateurs internes.
  - Mobile : recherche + bouton « Filtres (2) » ouvrant une feuille en bas.
- **Critère** : 475 → ≈ 90 px (bureau), 1 253 → ≈ 120 px (mobile).

### [ ] UX-05 · Tableau · `P0` `L`
- **Serré** : colonnes fixes (`w-32 + w-44 + 3×w-36 + w-52` = 944 px sur 1 212) → Entreprise + Secteur n'ont que ≈ 268 px, noms sur 2-4 lignes, lignes de 76 px, 2 510 px pour 30 titres. Mobile : `min-w-[850px]` repousse prix et variation hors écran.
- **Vide à tort** : ligne `cotation_…` ; 14 badges bleus identiques avec bordure, ombre et icône de lien externe.
- **Changements** :
  - Retirer la ligne technique.
  - Largeurs : symbole `w-24`, prix `w-32`, variation `w-28`, dividende `w-36` ; Haut/Bas seulement ≥ `xl`.
  - Nom sur une ligne (`truncate max-w-xs`) ; cellules `px-4 py-4` (ligne ≈ 56 px) ; colonnes numériques à droite avec `pl-8` avant la suivante.
  - Secteur : point coloré 8 px + `text-xs`, sans bordure ni lien (le lien va dans le tiroir).
  - « F CFA » dans l'en-tête de colonne ; ▲/▼ dans le badge de variation ; `thead` `sticky top-0`.
  - Couleurs de secteur distinctes du vert/rouge de variation (aujourd'hui « Télécommunications » est rose, « Conso. de base » est vert).
  - Mobile < 640 px : liste de cartes `p-4` avec filet 1 px (nom + symbole à gauche, prix + variation à droite).
  - Chargement : 8 lignes-squelettes. État vide : `py-16`, message `text-base` + bouton « Réinitialiser les filtres ».
- **Critère** : ≥ 8 lignes visibles sans défiler sur bureau, prix visible sans scroll horizontal sur mobile.

### [ ] UX-06 · Légende des dividendes · `P2` `S`
- **Vide à tort** : 190 px (472 px mobile) en bas de page, mono 12 px sur deux colonnes, avec des exemples ; elle explique un badge vu 3 000 px plus haut.
- **Changements** : ⓘ sur l'en-tête de la colonne Dividende (bulle de 2 lignes) + note `text-xs mt-3` sous le tableau : « D = dividende versé sans interruption depuis au moins 3 exercices ». Supprimer les exemples.

### [ ] UX-07 · Tiroir de détail · `P1` `M`
- **Serré** : 7 blocs dans 4-5 styles de cadre, tous espacés de 24 px, rien ne domine ; description 11 px placée avant les chiffres (prix à y ≈ 275) ; tableau + graphique répètent les mêmes 5 valeurs (≈ 470 px).
- **Changements** — ordre : identité → **prix `text-3xl` + variation** → trois stats en ligne (haut / bas / dernier dividende) sans cadre, `gap-6` → dividendes (un seul tableau avec barre intégrée en 3ᵉ colonne, lignes `py-3`) → description en dernier (`text-sm leading-7 max-w-prose`, badge « Généré par IA »). Sections séparées par `border-t pt-6`, `space-y-8`, conteneur `p-6 sm:p-8`. Pied collant `p-4` : bouton « Voir sur Sika Finance ↗ » (remplace l'URL brute) + lien secondaire « Actualiser l'historique ». Voir aussi A11Y-01.

### [ ] UX-08 · Onglet Bulletins · `P1` `M`
- **Serré** : analyse 12 px dans une boîte grise bordurée elle-même dans une carte bordurée ; avertissement 9 px à 50 % ; liste avec `max-h-[480px]` (scroll imbriqué) ; sur mobile, cliquer un bulletin ne change rien de visible (analyse sous la liste).
- **Vide à tort** : carte noire « Pourquoi analyser le BOC ? » permanente ; deux boutons pour la même action.
- **Changements** : Markdown en `text-[15px] leading-7 max-w-[68ch]`, titres `mt-8 mb-3`, sans boîte grise interne ; avertissement `text-xs` à 70 % ; un seul bouton ; carte « Pourquoi… » repliable ; mobile : liste → détail plein écran avec « ← Retour » (ou `scrollIntoView`) ; bouton « Régénérer » (le cache est aujourd'hui sans expiration).

### Pourquoi l'espace généreux clarifie (rappel de conception)
- Il **groupe** : la proximité se lit comme un lien (8 px dans un groupe, 24–32 px entre groupes).
- Il **remplace les bordures** : moins de traits internes → les cadres restants redeviennent des repères.
- Il **accélère la comparaison des chiffres** : lignes aérées, chiffres alignés à droite en `tabular-nums`.
- Il **réduit la charge mentale** : 23 boutons de même poids = 23 décisions ; 4 contrôles = 4.
- Réserve : l'espace doit entourer la donnée, pas la remplacer.

---

## 6. Fonctionnalités

| ID | Fonctionnalité | Détail | Prio | Effort |
|---|---|---|---|---|
| FEAT-01 | Favoris ★ + filtre « Mes titres » | localStorage d'abord ; l'accueil devient personnel | P1 | S |
| FEAT-02 | Rendement en % | dividende ÷ cours, colonne triable, « Top rendement » ; données déjà disponibles | P1 | S |
| FEAT-03 | Mode Simple / Expert | Simple : nom, prix, variation, rendement. Expert : Haut/Bas, score, secteur | P1 | S |
| FEAT-04 | Filtres dans l'URL | `?secteur=…&pays=bj` : lien partageable (WhatsApp), bouton retour fonctionnel | P1 | S |
| FEAT-05 | Simulateur de portefeuille | quantité + prix de revient → plus-value, dividendes annuels estimés (retenue à la source paramétrable) | P2 | M |
| FEAT-06 | Historique de cours | instantané quotidien en Redis (le cron existe) → mini-courbe 1M/3M/1A dans le tiroir, variation depuis janvier | P2 | M |
| FEAT-07 | Calendrier des détachements | extrait des BOC déjà analysés | P2 | M |
| FEAT-08 | Alertes | variation > x %, détachement ; e-mail ou Telegram (API WhatsApp payante) | P3 | M–L |
| FEAT-09 | PWA hors-ligne | dernier état en cache, installable ; utile en connexion instable | P2 | M |
| FEAT-10 | Questions en français sur les BOC | « quels titres ont détaché cette semaine ? » en réutilisant les analyses en cache | P3 | M |
| FEAT-11 | Petits plus | pastille « Marché ouvert / fermé », comparateur 2–3 titres, export CSV, mode sombre, infobulles de glossaire (rendement, détachement) | P3 | S chacun |

---

## 7. Ordre de travail proposé

1. **Sprint 1 — Données et sécurité** : BUG-01 → BUG-06, puis INC-09 et INC-10 (rapides).
2. **Sprint 2 — Layout à fort impact** : UX-04 (filtres), UX-05 (tableau + cartes mobiles), UX-01 (en-tête), INC-08 (chargement), puis UX-03, UX-02, UX-06.
3. **Sprint 3 — Cohérence et accessibilité** : INC-01 → INC-07, A11Y-01 → A11Y-04, UX-07, UX-08.
4. **Sprint 4 — Valeur utilisateur** : FEAT-01 → FEAT-04, puis FEAT-06, FEAT-05, FEAT-09.
5. **En continu** : TECH-01 → TECH-13 (TECH-10 tests dès le sprint 1 pour verrouiller BUG-01/02).

**Définition de « terminé » pour le layout** : mesures de la section 0 atteintes à 1440×900 et 390×844, aucune classe Tailwind sans effet, navigation complète au clavier, contraste ≥ 4,5:1 sur tout texte.
