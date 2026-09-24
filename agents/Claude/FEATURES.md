# Fonctionnalités — suivi-brvm-30

Catalogue des fonctionnalités produit à planifier et à suivre. Les identifiants `FEAT` sont référencés depuis le [BACKLOG.md](BACKLOG.md), qui contient l'audit et l'ordre de travail général.

**Légende** — Priorité : `P0` bloquant / données fausses · `P1` important · `P2` confort · `P3` idée.
Effort : `S` < 2 h · `M` ½–1 jour · `L` > 1 jour.

## Catalogue

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

automatiser la récupération des BOC, extraire les données de chaque séance, calculer les variations/volumes/liquidités et générer un **rapport quotidien BRVM**
