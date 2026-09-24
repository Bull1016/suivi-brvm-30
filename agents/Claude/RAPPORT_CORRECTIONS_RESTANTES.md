# État des corrections restantes — suivi-brvm-30

**État audité** : branche `dev`, commit `7e0c0bb` (21/09/2026). Fait suite à `agents/Claude/RAPPORT_VERIFICATION.md` (NEW-01 à NEW-12) et à `agents/Jules/RAPPORT_CORRECTIONS.md`.

**Vérifié à nouveau pour ce document** : lint/tests/build (✅ 0 erreur, 8/8, build OK), rendu réel à 1440×900 et 390×844 (Playwright), simulation de `reconcileState()` sur les deux anciens états Redis, comparaison ligne à ligne de `data/brvm30-composition.json` à l'avis n°191-2026, recherche web sur le rythme réel des révisions BRVM 30.

---

## 1. Ce qui est bien réglé (pas de retour en arrière)

- Composition alignée sur l'avis n°191-2026 dans `data/brvm30-composition.json`, `constants.ts`, `stocks_cache.json` et un test dédié (30/30).
- `reconcileState()` : simulé avec les deux anciens états Redis → 30 titres, puis 30/30 appariés après une synchro simulée.
- Rate limiting par préfixe d'endpoint, vérifié après le test de cache ; `sync-dividends` protégé ; bulletins mis en cache 1 h.
- Bundle JS : 562 → 395 kB (gzip 122) grâce au `React.lazy` sur la vue Markdown.
- Filtres compacts (~80 px bureau), cartes mobiles avec prix visible, textes ≤ 10 px passés de 50 % à 10 %, aucune cible tactile < 44 px.
- Tiroir : Échap ferme, focus revient sur l'élément d'origine.

## 2. Restant à corriger

### [ ] R-01 · Données des 10 nouveaux titres partiellement fabriquées · `P0` `M`
**Constat** : `BICB`, `SIVC`, `SEMC`, `NEIC`, `ORAC`, `SAFC`, `STAC`, `STBC`, `SCRC`, `UNXC` ont des prix ronds (7 500, 850, 700…), une variation à 0 et des historiques de dividendes en `11111` (a_jour) ou `00000` (aucun) sans source. `lastSyncTime` du seed est daté d'aujourd'hui alors que les 30 lignes sont en `source: "fallback"` : l'en-tête affiche une heure de synchro qui ne correspond à aucune vraie donnée.
**Pourquoi c'est grave** : en production, `reconcileState()` recopie ces valeurs dans Redis ; elles s'affichent comme si elles étaient réelles jusqu'à la première synchro réussie de chaque titre (le cron ne traite que 2 dividendes/jour, `sync-dividends-cron`).
**Correctif** :
- Remplacer les valeurs inventées par `null`/`[]` avec `source: "pending"` (nouveau statut) et un badge « Données en attente » au lieu de « Non actualisé » (qui laisse croire qu'il existe une ancienne valeur).
- Dater `lastSyncTime` à la vraie date de la dernière synchro Sika effective, ou le laisser vide si aucune n'a eu lieu.
- Avant de commit un nouveau `stocks_cache.json`, lancer une vraie synchro locale (`npm run dev` + POST `/api/brvm30/sync`) et committer le résultat réel.

### [ ] R-02 · Desktop : cliquer sur une ligne n'ouvre plus le tiroir · `P0` `S`
**Constat vérifié en navigateur** : un clic sur le centre d'une ligne ou sur le nom d'une entreprise ne fait plus rien ; seul un clic précis sur le bouton « Détails » ouvre le tiroir. Ce bouton dépasse en plus du conteneur (tableau de 1 256 px dans une zone de 1 212 px, `overflow-x: auto`), donc partiellement caché sans faire défiler.
**Correctif** : remettre `onClick`/`onKeyDown` (Entrée) sur `<tr>` avec `role="button"` et `tabIndex=0`, le bouton « Détails » devenant une action secondaire redondante (utile en lecteur d'écran). Revoir les largeurs de colonnes pour que le tableau tienne dans son conteneur sur un écran de 1440 px sans scroll horizontal.

### [ ] R-03 · `server.ts` : IP forgeable et écoute restreinte à localhost · `P1` `S`
**Constat** : `getCallerIp` lit `x-forwarded-for` avant `req.ip`, alors que `express` avec `trust proxy` calcule déjà `req.ip` correctement à partir de cet en-tête. Résultat : un client peut envoyer son propre `X-Forwarded-For` et changer arbitrairement la clé de quota. `app.listen(PORT, "127.0.0.1", ...)` rend aussi le serveur inaccessible depuis l'extérieur d'un conteneur (utile seulement si un reverse-proxy tourne sur la même machine).
**Correctif** : `getCallerIp = (req) => req.ip` (laisser Express résoudre via `trust proxy`), et rendre l'hôte configurable (`HOST = process.env.HOST || "0.0.0.0"`) pour l'usage en conteneur/VM, avec un avertissement si `trust proxy` est actif sans reverse-proxy réel devant.

### [ ] R-04 · Secteurs des 10 entrants non vérifiés contre la source officielle · `P1` `S`
Les secteurs de `BICB`, `SIVC`, `SEMC`, `NEIC`, `ORAC`, `SAFC`, `STAC`, `STBC`, `SCRC`, `UNXC` dans `brvm30-composition.json` ont été déduits, pas confirmés ligne à ligne sur brvm.org. Une fois posés, `processStockDividends` privilégie `stock.sector` avant tout secteur scrapé (`stock.sector || sectorMap[...] || ...`) : une erreur ne se corrigera jamais toute seule.
**Correctif** : comparer chaque secteur à la fiche société sur brvm.org avant la prochaine mise à jour ; envisager d'inverser la priorité (`sectorMap` scrapé avant le `sector` codé en dur) une fois `fetchBRVMSectors()` fiable pour ces nouveaux titres.

### [ ] R-05 · Statut « en_attente » n'expire jamais · `P1` `S`
`BOAN` (4/5, dividende 2025 non publié) reste étiqueté « En attente » indéfiniment et compte toujours dans « Payeurs réguliers ». Si l'exercice 2025 n'est en réalité jamais versé, le titre devrait basculer en « Interrompu » après une date limite raisonnable (ex. fin d'exercice suivant, ou un nombre de jours après le 31/12).
**Correctif** : ajouter une date de bascule dans `processStockDividends` (ex. `en_attente` → `interrompu` après le 30 juin de l'année suivante si toujours pas publié).

### [ ] R-06 · Mobile : filtres et cartes encore trop hauts · `P2` `M`
Mesuré à 390×844 : barre de filtres 288 px (cible ≤ 140 px), cartes de titres 127 px chacune (0 visible au premier écran), 2ᵉ onglet toujours tronqué (« Bulletins Officiels (B… »).
**Correctif** : menus déroulants empilés → une feuille modale « Filtres (2) » comme prévu dans `agents/Claude/BACKLOG.md` (UX-04/UX-05) ; réduire la hauteur des cartes (`p-3` au lieu de `p-4`, infos sur 2 lignes) ; tester les libellés d'onglets sur 360 px, pas seulement 390 px.

### [ ] R-07 · Reliquats mineurs · `P2` `S`
- `lib/brvm/process.ts:66` retombe encore sur `"Services Financiers"` si aucun secteur n'est trouvé (le front dit « Non classé », le backend ment silencieusement) → aligner les deux sur `"Non classé"`.
- `docs/avis-191-2026.pdf` et `docs/brvm30.pdf` sont un doublon strictement identique (même hash) → garder un seul fichier nommé par son numéro d'avis.
- `tsconfig.json` toujours sans `"strict": true`.
- `scripts/test-gemini*.js` utilisent encore `gemini-3.5-flash` alors que l'app utilise `GEMINI_MODEL` (actuellement `gemini-3.6-flash`).
- README encore optimiste sur un point : il ne précise pas que la composition doit être mise à jour manuellement à chaque révision trimestrielle (voir section 3).

---

## 3. Plan — mise à jour automatique de la composition via `.env`

### Objectif exprimé
Une variable d'environnement contient le lien vers l'avis de composition en vigueur. Au clic sur « Actualiser », l'application vérifie si ce lien correspond à ce qui a déjà été analysé (via `COMPOSITION_VERSION`) ; si le lien a changé, elle archive le nouvel avis dans `docs/` et met à jour le projet en conséquence.

### Contrainte à connaître avant de concevoir la solution
Les avis BRVM sont des **PDF scannés (image), sans texte extractible** — vérifié sur `docs/avis-191-2026.pdf` (`pdftotext` renvoie une page vide). Lire un nouvel avis suppose donc soit de l'OCR, soit un appel à un modèle avec vision (déjà utilisé côté Gemini pour les bulletins). Ce n'est pas une simple comparaison de chaînes de caractères.

Deuxième contrainte, plus bloquante : **une fonction serverless Vercel ne peut pas écrire dans le dépôt Git**. `docs/` et `data/brvm30-composition.json` sont des fichiers du dépôt ; les modifier « en production, au clic d'un bouton » n'est possible qu'en passant par l'API GitHub (créer une branche, un commit, une pull request), pas par une écriture disque classique — le système de fichiers d'une fonction Vercel est éphémère et en lecture seule hors `/tmp`. Le plan ci-dessous sépare donc **détection + mise à jour immédiate des données servies** (faisable au clic) de **mise à jour du dépôt** (nécessite une étape distincte, automatisable mais avec un vrai arbitrage de sécurité).

### 3.1 · Variable d'environnement

```bash
# .env / .env.example
BRVM_30_AVIS_URL="https://www.brvm.org/sites/default/files/avis-191-2026.pdf"
```

Distincte de `BRVM_30_URL` (qui reste le lien affiché par le bouton « Composition PDF » dans l'en-tête, à visée informative). `BRVM_30_AVIS_URL` est la source que l'application surveille et interprète.

### 3.2 · Ce qui est stocké pour détecter un changement

Ajouter à l'état persistant (`BrvmState` dans `lib/brvm/types.ts`, à côté de `compositionVersion`) :

```ts
lastAnalyzedAvisUrl?: string;   // valeur de BRVM_30_AVIS_URL au moment de la dernière analyse réussie
lastCompositionCheckAt?: string; // pour éviter de re-vérifier à chaque clic
```

**Détection = comparaison de chaîne, pas de re-téléchargement systématique.** À chaque clic sur « Actualiser » :

1. Comparer `process.env.BRVM_30_AVIS_URL` à `state.lastAnalyzedAvisUrl` stocké.
2. Si identiques → rien à faire, la synchro des cours continue normalement (aucun coût OCR ajouté à l'usage courant).
3. Si différents (ou `lastAnalyzedAvisUrl` absent) → déclencher le pipeline d'analyse (3.3), **une seule fois**, protégé par le verrou `isSyncing` déjà existant pour ne pas le lancer deux fois en parallèle.

Cela répond directement à la demande : la vérification se fait par comparaison au lien enregistré, et `COMPOSITION_VERSION` sert de deuxième garde (si l'analyse aboutit à un avis dont le numéro est déjà celui en mémoire, ne rien changer même si l'URL a changé — utile si le fichier a été renommé sans changer de contenu).

### 3.3 · Pipeline d'analyse (nouveau, quand un changement est détecté)

```
lib/brvm/composition-watch.ts

checkCompositionUpdate()
 1. Télécharger le PDF pointé par BRVM_30_AVIS_URL.
 2. Extraire, via un modèle avec vision (réutiliser le client Gemini déjà
    configuré, ou son remplaçant — voir PLAN_MIGRATION_LING.md), une réponse
    structurée stricte :
      { avis: "192-2026", date: "2026-10-01",
        stocks: [{ symbol, name, country, sector }, ... 30 entrées ] }
    avec un schéma JSON forcé (comme generateCompanyDescription), pour éviter
    un texte libre à re-parser.
 3. Valider mécaniquement la réponse avant de faire quoi que ce soit :
      - exactement 30 entrées, 30 symboles uniques
      - country ∈ {ci, sn, bf, tg, bj, ml, ne}
      - sector ∈ aux 7 secteurs BRVM_SECTORS existants
      - avis différent de COMPOSITION_VERSION actuel
    → si la validation échoue, ne rien appliquer, logger l'échec, laisser
      l'ancienne composition active (fail-safe : ne jamais casser l'app en
      production sur une lecture IA incertaine).
 4. Archiver le PDF (voir 3.4).
 5. Appliquer immédiatement aux données SERVIES (pas au dépôt Git) :
      - fusionner avec reconcileState() (déjà écrit pour ça)
      - marquer les nouveaux symboles avec source: "pending" (voir R-01),
        jamais de prix ou dividende inventé
      - stocker compositionVersion = avis extrait, lastAnalyzedAvisUrl = URL
 6. Exposer un état "à valider" dans l'UI : bannière discrète
    « Nouvelle composition détectée (avis n°192-2026) — 3 titres entrants,
    3 sortants. À confirmer. » avec un lien vers le PDF archivé. On n'écrase
    jamais silencieusement une composition sans qu'un humain la voie passer.
```

**Pourquoi une étape de validation « à confirmer » plutôt qu'une bascule automatique et invisible** : la lecture d'un PDF scanné par un modèle reste faillible (confusion d'un chiffre, d'un secteur). Une composition d'indice fausse a plus de conséquences qu'un cours de bourse ponctuellement périmé. Le compromis proposé applique quand même les nouvelles données tout de suite (l'app reste à jour), mais affiche qu'elles proviennent d'une lecture automatique tant que le dépôt Git n'a pas été mis à jour « officiellement » (3.4).

### 3.4 · Archivage : deux niveaux, pas un seul

| Niveau | Où | Automatisable au clic ? |
|---|---|---|
| Archivage durable immédiat | **Vercel Blob** (`@vercel/blob`), clé `avis/avis-192-2026.pdf` | ✅ oui — une fonction serverless peut écrire dans Blob |
| Archivage dans le dépôt (`docs/avis-192-2026.pdf`, `data/brvm30-composition.json`, bump de version) | **Git**, sur `dev` | ⚠️ seulement via l'API GitHub (voir ci-dessous) |

**Option recommandée pour démarrer (sans risque)** : le pipeline écrit dans Vercel Blob et met à jour Redis (l'app est correcte immédiatement), puis affiche la bannière « à valider » avec un lien de téléchargement du PDF archivé. Le mainteneur télécharge ce PDF, l'ajoute manuellement à `docs/`, régénère `data/brvm30-composition.json` (script `scripts/update-composition.ts`, à écrire — il peut réutiliser la même extraction structurée que l'étape 2, en local cette fois), et committe. Geste manuel, mais sûr, et qui ne demande pas de donner à une fonction publique un accès en écriture au dépôt.

**Option avancée (répond littéralement à « archiver dans docs et actualiser le projet »)** : donner au pipeline un token GitHub à portée réduite (`contents:write` sur ce seul dépôt) en variable d'environnement (`GITHUB_PAT`), et lui faire ouvrir automatiquement une **pull request** (pas un push direct sur `dev`) via l'API Contents/Git de GitHub : nouvelle branche `auto/avis-192-2026`, ajout de `docs/avis-192-2026.pdf` et mise à jour de `data/brvm30-composition.json`, description de PR listant les entrants/sortants détectés. Le mainteneur relit et merge. C'est faisable, mais c'est un vrai choix de sécurité (un secret avec droit d'écriture sur le dépôt, accessible depuis une fonction déclenchée par un clic utilisateur) — à réserver à une route interne protégée par `CRON_SECRET`, jamais à l'endpoint public `/api/brvm30/sync`.

**Recommandation** : démarrer avec l'option Blob + bannière (3.4, ligne 1), qui couvre l'essentiel (détection automatique, données à jour tout de suite, rien de cassé), et ne passer à l'auto-PR que si la mise à jour manuelle trimestrielle devient réellement une charge.

### 3.5 · Ce qui change dans `syncQuotations()`

```ts
export async function syncQuotations() {
  // ... verrous existants inchangés ...

  const compositionChanged = await checkCompositionUpdate(); // 3.2 + 3.3, no-op si rien n'a changé
  // ... suite de la synchro des cours, inchangée, sur la composition
  //     éventuellement mise à jour par checkCompositionUpdate() ci-dessus ...

  return {
    status: 200,
    body: { success: true, /* ... */, compositionUpdate: compositionChanged ? { avis, entrants, sortants } : null },
  };
}
```

Le front affiche `compositionUpdate` dans la bannière mentionnée en 3.3 si présent.

### 3.6 · Ordre de mise en œuvre

1. `lib/brvm/composition-watch.ts` : comparaison d'URL + verrou (aucune dépendance IA, testable seule).
2. Extraction structurée du PDF (dépend du choix de modèle — voir `PLAN_MIGRATION_LING.md`, section « lecture de documents » : Gemini sait déjà le faire via `urlContext`, ce qui rend cette étape immédiate à écrire avec le modèle actuel).
3. Validation mécanique (30 entrées, symboles uniques, secteurs connus) + tests unitaires avec un faux JSON d'avis.
4. Intégration Vercel Blob + bannière UI « à valider ».
5. `scripts/update-composition.ts` pour le geste manuel de mise à jour du dépôt.
6. (Optionnel, plus tard) Auto-PR via API GitHub.

### 3.7 · Ce que ça ne doit pas faire
- Ne jamais appliquer une composition extraite qui échoue à la validation mécanique.
- Ne jamais écraser `data/brvm30-composition.json` sans passage humain, tant que l'auto-PR (3.4, option avancée) n'est pas en place.
- Ne jamais lancer l'extraction PDF à chaque clic sur « Actualiser » si l'URL n'a pas changé (coût et latence inutiles).
