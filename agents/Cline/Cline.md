### Analyse comparative : `RESUME_CORRECTIONS_APPORTEES.md` vs `RAPPORT_CORRECTIONS_RESTANTES.md`

Après confrontation exhaustive point par point du rapport des corrections demandées (`RAPPORT_CORRECTIONS_RESTANTES.md`), du résumé des corrections apportées (`RESUME_CORRECTIONS_APPORTEES.md`), et de l'historique effectif du code (`git diff 7e0c0bb..HEAD`), voici les conclusions.

---

### 1. Synthèse générale

> **Non, toutes les corrections définies dans `RAPPORT_CORRECTIONS_RESTANTES.md` ne sont pas implémentées.**
> 
> Le document `RESUME_CORRECTIONS_APPORTEES.md` résume fidèlement ce qui a été fait dans les commits récents (`82d0bc4` et `4114908`), mais **seule une partie des anomalies (environ 4 sur 7 du backlog, et 0 sur le plan d'automatisation)** a été traitée. Plusieurs chantiers majeurs restent non implémentés ou partiellement traités.

---

### 2. État d'avancement détaillé point par point

| Point | Titre / Sujet | Statut réel | Précisions |
|---|---|---|---|
| **R-01** | Données des 10 nouveaux titres partiellement fabriquées (`P0`) | � **Implémenté** | Le statut TypeScript/UI `pending` avec le badge « Données en attente » a bien été créé (`lib/brvm/types.ts`, `src/types.ts`, `StocksTable.tsx`, `StockDetailDrawer.tsx`). Les 10 titres (`BICB`, `SIVC`, etc.) dans `data/stocks_cache.json` sont maintenant marqués avec `source: "pending"` et leurs prix/dividendes sont à `null`/`[]`. |
| **R-02** | Desktop : réactiver le clic sur `<tr>` (`P0`) | 🟢 **Implémenté** | Le clic sur `<tr>` ouvrant le tiroir a été rétabli dans `StocksTable.tsx` en filtrant les contrôles interactifs imbriqués (`a`, `button`, etc.), la sémantique de table est préservée et un test unitaire dédié a été ajouté (`tests/stocks-table.test.tsx`). *(Note : l'ajustement fin des largeurs de colonnes sans scroll horizontal reste mineur)*. |
| **R-03** | `server.ts` : IP forgeable et trust proxy / host (`P1`) | 🟢 **Implémenté** | `getCallerIp` s'appuie désormais sur `req.ip`. `TRUST_PROXY` est désactivé par défaut (`0`), exige `REVERSE_PROXY=true` pour être activé avec sauts stricts, et `HOST` vaut `127.0.0.1` par défaut. Couvert par 9 tests unitaires (`tests/server-config.test.ts`). |
| **R-04** | Vérification des secteurs des 10 entrants contre brvm.org (`P1`) | � **Implémenté** | `lib/brvm/process.ts` préfère maintenant `sectorMap` avec fallback vers `stock.sector` et `DEFAULT_SYMBOL_SECTOR_MAP` (lignes 70-74), permettant la priorisation des secteurs issus de la composition officielle. |
| **R-05** | Expiration logique du statut `en_attente` (`P1`) | 🟢 **Implémenté** | Implémenté dans `lib/brvm/process.ts` avec la bascule vers `interrompu` après le 1er juillet de l'année suivante (`cutoffDate = new Date(`${lastYear + 1}-07-01T00:00:00.000Z`)`), testé dans `tests/unit.test.ts`. |
| **R-06** | Mobile : réduction de la hauteur des filtres et cartes (`P2`) | 🔴 **Non implémenté** | Aucun commit sur `StockFilters.tsx` ni `StockCard.tsx`. La modale compacte de filtres mobiles n'a pas été développée. |
| **R-07** | Reliquats mineurs (`P2`) | 🟡 **Partiel** | - Fallback `"Non classé"` dans `lib/brvm/process.ts` : 🟢 **Fait**.<br>- `"strict": true` dans `tsconfig.json` : 🟢 **Fait**.<br>- `scripts/test-gemini*.js` alignés sur `GEMINI_MODEL` : 🟢 **Fait**.<br>- Suppression du doublon `docs/brvm30.pdf` (identique à `docs/avis-191-2026.pdf`) : 🔴 **Non fait** (les deux fichiers sont toujours présents). |
| **Section 3** | Automatisation de la composition via `BRVM_30_AVIS_URL` | 🔴 **Non implémenté (code)**<br>*(Doc uniquement)* | Les variables sont documentées dans `.env.example` et le `README.md`, mais le pipeline complet (`lib/brvm/composition-watch.ts`, extraction vision de l'avis PDF, validation 30 symboles, persistance de candidate, validation UI) n'est **pas du tout codé**. |

---

### 3. Éléments clés manquants pour finaliser le rapport

1. **R-01 (Données réelles du seed)** :
   - Exécuter une vraie synchronisation locale ou nettoyer `data/stocks_cache.json` pour basculer les 10 entrants en `source: "pending"` avec prix/dividendes à `null`/`[]` tant qu'ils ne sont pas synchronisés.
2. **R-06 (Ergonomie mobile)** :
   - Rendre les filtres mobiles compacts (`StockFilters.tsx`) et alléger le padding des cartes (`StockCard.tsx`).
3. **R-07 (Nettoyage docs)** :
   - Supprimer `docs/brvm30.pdf` pour ne conserver que `docs/avis-191-2026.pdf`.
4. **Section 3 (Composition watch)** :
   - Développer le module `composition-watch.ts` si l'automatisation trimestrielle de détection d'avis est requise.