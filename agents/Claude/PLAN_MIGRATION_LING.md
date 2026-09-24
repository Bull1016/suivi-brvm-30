# Plan — remplacement de gemini-3.6-flash par Ling 3.0 Flash VL (Vercel AI Gateway)

**Vérifié le 21/09/2026** sur la page produit `https://vercel.com/ai-gateway/models/ling-3.0-flash-vl-free` et sur le code actuel de `lib/brvm/gemini.ts` (branche `dev`, commit `7e0c0bb`).

## 1. Réponse courte

**Partiellement possible, pas en remplacement direct.** L'application utilise Gemini pour deux choses de nature très différente :

| Usage | Ce qu'il exige de Gemini | Ling 3.0 Flash VL le propose-t-il ? |
|---|---|---|
| `generateCompanyDescription` (texte de présentation) | Génération de texte + sortie JSON structurée | ✅ Oui, sans perte |
| `analyzeBulletinWithGemini` (analyse d'un bulletin officiel) | **Lire un PDF distant via URL** (`urlContext`) + **recherche web pour vérifier/citer des sources** (`googleSearch`, avec métadonnées de citation) | ❌ Non, ces deux outils n'existent pas sur ce modèle via la Gateway |

**Recommandation** : migrer uniquement la génération de description vers Ling (gratuit, sans perte fonctionnelle). Garder Gemini pour l'analyse des bulletins, qui dépend d'outils propriétaires que Ling n'a pas — les reconstruire soi-même serait un chantier séparé, plus risqué pour une fonctionnalité financière (voir section 4).

## 2. Ce que confirme la fiche du modèle

- **Identifiant** : `inclusionai/ling-3.0-flash-vl-free`, éditeur InclusionAI.
- **Prix** : gratuit (`Free` / `Free`), pas de coût par token.
- **Fournisseur unique** : Novita AI. Pas de repli automatique vers un autre fournisseur si Novita est indisponible (contrairement à d'autres modèles de la Gateway qui listent plusieurs fournisseurs).
- **Fenêtre de contexte** : 256K tokens.
- **Entrées** : texte, image (URL, base64, Uint8Array), vidéo. **Pas de type d'entrée « document/PDF »** dans le tableau des limites d'entrée — un PDF doit être converti en image(s) avant envoi.
- **Sorties** : texte, avec raisonnement (`reasoning`) et appel d'outils (`tool calling`, au sens function-calling classique — l'app définit ses propres fonctions, ce n'est pas une recherche web intégrée).
- **Colonne « Web Search »** : vide pour ce modèle (un modèle voisin de la même famille, `ling-3.0-flash-fin`, l'a — mais pas celui-ci).
- **Accès** : via le package `ai` (Vercel AI SDK), clé `AI_GATEWAY_API_KEY`, ou via une URL compatible OpenAI/Anthropic en changeant le `baseURL`.
- **Date de mise en ligne** : 09/08/2026 — modèle récent, gratuit, potentiellement instable en disponibilité ou amené à changer de nom/conditions (les modèles « *-free » de la Gateway sont typiquement des offres promotionnelles, pas garanties dans la durée).

## 3. Pourquoi la description d'entreprise migre sans perte

Le code actuel (`generateCompanyDescription`) n'utilise déjà **aucun outil** — pas de recherche web, pas de lecture d'URL — seulement `generateContent` avec un `responseSchema` JSON. C'est un remplacement direct.

### 3.1 · Dépendances à ajouter

```bash
npm install ai zod
```

`ai` (Vercel AI SDK) et `zod` (pour définir le schéma de sortie, équivalent au `responseSchema` de Gemini). Ces paquets ne s'exécutent que côté serveur (routes `api/`, `server.ts`) : **aucun impact sur le bundle client** (toujours ~395 kB).

### 3.2 · Variable d'environnement

```bash
# .env / .env.example
AI_GATEWAY_API_KEY="..."          # clé créée depuis le dashboard Vercel > AI Gateway > API Keys
DESCRIPTION_MODEL="inclusionai/ling-3.0-flash-vl-free"   # override possible, comme GEMINI_MODEL aujourd'hui
```

Sur un déploiement Vercel, `AI_GATEWAY_API_KEY` peut aussi être résolue automatiquement sans clé explicite (authentification via le projet Vercel) — à vérifier dans la documentation Gateway au moment de l'implémentation ; documenter les deux cas dans `.env.example`.

### 3.3 · Nouveau module `lib/brvm/ai-description.ts`

```ts
import { generateObject } from "ai";
import { z } from "zod";

export const DESCRIPTION_MODEL =
  process.env.DESCRIPTION_MODEL || "inclusionai/ling-3.0-flash-vl-free";

const descriptionSchema = z.object({
  description: z.string().min(10),
});

export async function generateCompanyDescription(
  companyName: string,
  symbol: string,
  country: string
): Promise<string | null> {
  if (!process.env.AI_GATEWAY_API_KEY) return null;

  try {
    const { object } = await generateObject({
      model: DESCRIPTION_MODEL,
      schema: descriptionSchema,
      prompt: `Rédige une description professionnelle, réaliste et informative en français (1 à 3 paragraphes) de l'entreprise "${companyName}" (symbole : ${symbol}, pays : ${country.toUpperCase()}), cotée à la BRVM. Décris son secteur d'activité principal, son historique, ses activités et sa position sur le marché régional.`,
    });
    return object.description.trim().length > 10 ? object.description.trim() : null;
  } catch (error) {
    console.error(`Ling description generation failed for ${symbol}:`, error);
    return null;
  }
}
```

`generateObject` + un schéma Zod est l'équivalent AI SDK du `responseSchema` Gemini : la sortie est validée avant de revenir à l'appelant, même logique de repli (`finalDescription` vide → message générique) inchangée dans `service.ts`.

### 3.4 · Ce qui ne change pas

`lib/brvm/service.ts::companyDescription` reste identique (vérification du symbole, cache, rate limit avant appel IA, sauvegarde en cache) — seul l'import et l'appel interne changent. Le champ `source: "ai-generation"` déjà renvoyé au front peut devenir `source: "ai-generation:ling"` pour distinguer les descriptions générées par l'un ou l'autre modèle dans les logs/monitoring, utile en cas de rollback partiel.

### 3.5 · Garde-fou pour un modèle gratuit et à fournisseur unique

Comme il n'y a qu'un seul fournisseur (Novita) et aucune garantie de disponibilité annoncée :
- Garder le repli textuel déjà existant dans `service.ts` (`finalDescription` générique si l'appel échoue) — il couvre déjà ce cas.
- Ajouter un compteur de succès/échec en log pendant les deux premières semaines pour juger de la fiabilité réelle avant de considérer la bascule comme définitive.
- Ne pas supprimer le code Gemini pour cette fonction tout de suite : garder un bascule par variable d'environnement (`DESCRIPTION_MODEL` vide ou pointant vers un modèle Gemini → réutiliser l'ancien chemin) le temps de valider en production.

### 3.6 · Tests à adapter

`tests/unit.test.ts` ne teste actuellement pas `generateCompanyDescription` (appel réseau non testé). Ajouter un test qui mocke `ai`'s `generateObject` (via `vi.mock("ai")`) pour vérifier : schéma respecté, repli si `AI_GATEWAY_API_KEY` absente, troncature/validation du texte retourné.

## 4. Pourquoi l'analyse des bulletins ne migre pas telle quelle

`analyzeBulletinWithGemini` s'appuie sur deux capacités précises de Gemini, utilisées ensemble dans le même appel :

```ts
config: {
  tools: [{ googleSearch: {} }, { urlContext: { url: pdfUrl } }],
}
```

- **`urlContext`** : Gemini télécharge et lit lui-même le contenu à l'URL donnée — y compris un PDF scanné (image), ce qui est le cas des bulletins BRVM (confirmé : aucun texte extractible par `pdftotext`). C'est ce qui permet à l'app d'envoyer juste une URL sans jamais manipuler le PDF elle-même.
- **`googleSearch`** : recherche web utilisée par Gemini pour recouper les chiffres et produire les `groundingChunks` (sources affichées dans l'onglet Bulletins, avec titre + lien).

Ling 3.0 Flash VL (Free), via la Gateway, n'expose ni équivalent à `urlContext` ni recherche web pour ce modèle précis (colonne « Web Search » vide sur sa fiche). Le reproduire demanderait de :

1. **Télécharger et rasteriser le PDF côté serveur** (le convertir en images page par page) avant de l'envoyer en entrée vision. Sur Vercel, cela veut dire soit un binaire natif type `poppler`/`pdftoppm` (contrainte forte en environnement serverless, taille et disponibilité du binaire), soit une bibliothèque JS pure comme `pdfjs-dist` + rendu canvas (`@napi-rs/canvas` ou équivalent), plus lourde à maintenir que l'actuel `tools: [{ urlContext }]` d'une ligne.
2. **Reconstruire la recherche/vérification** : brancher une vraie recherche web (API Google Custom Search, Bing, ou le `web_search` déjà utilisé ailleurs dans cet environnement de travail mais pas disponible depuis une fonction Vercel de production) pour produire des sources citables — sans quoi l'analyse perd la traçabilité déjà signalée comme fragile dans `agents/Claude/RAPPORT_VERIFICATION.md` (INC-05 : descriptions sans grounding).
3. **Risque accru d'erreur sur des chiffres financiers** sans recoupement web : un indice, un volume ou une variation mal lus sur un PDF scanné, sans vérification croisée, est plus grave à afficher faux qu'une description d'entreprise approximative.

**Conclusion** : possible en théorie, mais c'est un chantier d'ingénierie à part entière (rasterisation PDF + pipeline de recherche), pas un changement de nom de modèle. Il mérite son propre ticket si l'objectif est de sortir complètement de Gemini, avec un budget de test spécifique sur la fiabilité des chiffres extraits.

## 5. Plan d'exécution proposé

### Phase 1 — Description d'entreprise vers Ling (faible risque)
1. `npm install ai zod`.
2. Créer une clé `AI_GATEWAY_API_KEY` (dashboard Vercel > AI Gateway), l'ajouter à `.env.example` et aux variables d'environnement Vercel (Preview + Production).
3. Écrire `lib/brvm/ai-description.ts` (section 3.3), brancher dans `service.ts`.
4. Ajouter le test unitaire mocké (section 3.6).
5. Déployer sur une branche de preview, comparer manuellement 5 à 10 descriptions générées par Ling à celles déjà en cache (issues de Gemini) pour juger de la qualité en français avant bascule en production.
6. Surveiller le taux d'échec (`console.error` déjà en place) pendant 1 à 2 semaines.

### Phase 2 — Décision sur l'analyse des bulletins (à part, pas urgent)
- Ne pas migrer tant que Ling (ou un autre modèle gratuit de la Gateway) n'expose pas une capacité équivalente à `urlContext` + recherche web pour ce cas d'usage précis — revérifier la fiche des modèles de la Gateway à chaque trimestre, la liste évolue vite (ex. `ling-3.0-flash-fin`, sorti le 27/08/2026, a déjà la recherche web gratuite pour un autre usage).
- Si l'objectif reste de sortir complètement de Gemini, ouvrir un ticket séparé pour la rasterisation PDF + pipeline de recherche, avec ses propres tests de fiabilité sur des bulletins déjà analysés (comparer aux analyses existantes en cache).

### Phase 3 — Nettoyage (une fois Phase 1 validée en production)
- Si Ling s'avère fiable : retirer le chemin Gemini de `generateCompanyDescription` (garder `GEMINI_MODEL`/`@google/genai` uniquement pour `analyzeBulletinWithGemini`).
- Mettre à jour le README (section IA) pour préciser que deux modèles distincts sont utilisés, avec leur rôle respectif.

## 6. Ce que ce changement ne doit pas faire
- Ne pas migrer l'analyse des bulletins « pour économiser », en acceptant silencieusement de perdre la lecture PDF et les sources citées — cela dégraderait une fonctionnalité déjà identifiée comme sensible.
- Ne pas supprimer le code Gemini existant avant d'avoir un historique de fiabilité sur Ling (modèle gratuit à fournisseur unique, sans SLA publié).
- Ne pas oublier que `GEMINI_MODEL` reste nécessaire pour `analyzeBulletinWithGemini` même après la Phase 1 : les deux clients (Gemini + Gateway) coexistent, ce n'est pas un remplacement total de `@google/genai`.
