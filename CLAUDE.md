@AGENTS.md

# Comptoir — back-office

Administration d'un site e-commerce **mono-boutique** appartenant à un client
unique. Ce n'est pas une place de marché : aucune notion de vendeur, de tenant
ou de boutique multiple n'existe et il ne faut pas en introduire.

**Comptoir** est le nom du logiciel. L'enseigne du client, elle, est un simple
réglage (`store.name` côté API) : ne jamais coder en dur un nom de boutique
dans une page destinée aux visiteurs.

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 ·
Recharts · lucide-react.

## Les trois dépôts

| Dossier | Rôle | État |
|---|---|---|
| `../back_ecommerce` | API NestJS + Prisma + PostgreSQL | ~180 routes |
| `../front-ecommerce` | Boutique client | scaffold |
| `admin_ecommerce` (ici) | Back-office | système de design + tableau de bord |

**Ce dossier fait référence pour le design.** Les jetons, les polices et les
principes ci-dessous s'appliquent aussi à la boutique, qui les adapte à son
propre usage (voir « Ce qui change côté boutique »).

---

# Système de design

## Le parti pris

Un outil de travail utilisé plusieurs heures par jour, pas une vitrine.

**La couleur est fonctionnelle, jamais décorative.** Une seule couleur de
marque — le cobalt. Le vert, l'orange et le rouge sont *réservés* aux statuts :
rien d'autre dans l'interface n'a le droit de les porter. C'est cette
discipline qui permet de repérer une commande à préparer d'un coup d'œil au
bout de trois mois d'usage.

**Le fond est un blanc chaud** (`#fbfbf8`) et non le gris-bleu froid habituel
des tableaux de bord : moins fatigant sur une longue session, et il fait
ressortir les surfaces blanches des cartes.

**Le chiffre est le sujet.** Sur une carte d'indicateur, la valeur porte la
plus grande taille de la page.

## Jetons

Définis dans `app/globals.css` (`@theme`). **Ne jamais écrire une couleur en
dur dans un composant** — toujours passer par un jeton.

```
Marque      cobalt-50…900          500 = #2b4eff (actions, liens, sélection)
Neutres     ink-50…900             chauds, jamais gris-bleu
Statuts     success  #0b7a44   sur  success-soft  #e6f6ed
            warning  #b45309   sur  warning-soft  #fdf3e3
            danger   #c02a30   sur  danger-soft   #fdeceb
            info     #0369a1   sur  info-soft     #e6f3fb
Graphiques  chart-1…5           1 cobalt · 2 sarcelle · 3 corail · 4 ambre · 5 violet
Surfaces    canvas #fbfbf8 · surface #ffffff · rail #161614
Rayons      --radius-card 12px · --radius-control 8px
Ombres      --shadow-card (unique, discrète) · --shadow-pop (survol/menus)
```

Les teintes de statut ont été **assombries jusqu'à franchir 4,5:1** sur leur
fond pâle : une pastille de statut est du texte, elle doit être lisible comme
du texte. Toute nouvelle couleur passe par ce test avant d'entrer.

## Typographie

Trois familles, chacune pour une raison :

| Rôle | Police | Pourquoi |
|---|---|---|
| Titres | **Bricolage Grotesque** | contre-formes serrées, du caractère sans nuire à la lecture |
| Interface | **Public Sans** | dessinée pour l'administration américaine, donc pour les formulaires denses |
| Chiffres | **IBM Plex Mono** | sans chasse fixe, une colonne de montants se décale d'une ligne à l'autre |

`font-variant-numeric: tabular-nums` s'applique globalement aux tableaux et à
tout élément portant `data-numeric`.

**Interdits** : Inter, Roboto, Arial, polices système. Ce sont les signatures
d'une interface générée sans intention.

## Composants

`components/ui/` — primitives réutilisables :

- **`Button`** — `primary` (une seule action principale par écran), `secondary`,
  `ghost`, `danger`. Hauteur 44 px : seuil de confort tactile, respecté même
  sur desktop. Le bouton **reste actif** pendant une requête et affiche un
  indicateur ; le désactiver empêche de comprendre qu'il se passe quelque
  chose et fait perdre le focus clavier.
- **`Badge`** + **`Dot`** — pastille de statut. Toujours **couleur ET libellé** :
  la couleur seule exclut les daltoniens.
- **`Card`**, **`CardHeader`**, **`EmptyState`** — un tableau vide sans
  explication laisse croire à une panne : dire ce qui manque et proposer
  l'action qui remplit l'écran.
- **`StatCard`** — filet coloré en tête servant de code d'appartenance avec la
  série correspondante dans les graphiques. La variation porte une flèche *en
  plus* de la couleur.

## Règles de mise en œuvre

**Accessibilité — non négociable**
- Contraste 4,5:1 minimum pour tout texte, 3:1 pour les tracés de graphiques.
- Bouton-icône ⇒ `aria-label`. Icône décorative ⇒ `aria-hidden`.
- Élément de navigation actif ⇒ `aria-current="page"`, jamais la couleur seule.
- Tableau ⇒ `<caption>` (au besoin en `sr-only`) et `scope="col"`.
- Anneau de focus visible partout, jamais `outline-none` sans remplacement.
- Zoom mobile toujours autorisé.
- Icônes **lucide-react** uniquement. Jamais d'emoji comme icône.

**Mouvement**
- 150–300 ms, `transform` et `opacity` seulement, jamais `transition-all`.
- Une animation qui n'exprime pas une causalité n'a pas lieu d'être.
- `prefers-reduced-motion` respecté globalement.
- **Les graphiques ne s'animent pas à l'entrée** : sur un outil de pilotage la
  donnée doit être lisible dès la première image. Recharts anime le tracé via
  `strokeDasharray`, ce qui laisse la courbe invisible tant que l'animation
  n'a pas démarré — y compris à l'impression.

**Graphiques — trois pièges vérifiés**
1. `var(--…)` **n'est pas résolu** dans un attribut de présentation SVG. Les
   couleurs passent par `lib/palette.ts`, qui double volontairement les jetons
   CSS et doit en rester le miroir exact.
2. Le conteneur responsive doit porter `min-w-0` et `overflow-hidden`, sinon il
   conserve une largeur mesurée trop grande et déborde sur petit écran.
3. **Un graphique Recharts n'existe qu'après hydratation.** `ResponsiveContainer`
   mesure son parent dans le navigateur, et tant qu'il n'a pas mesuré il rend
   `null` : le HTML servi ne contient aucun tracé, seulement un conteneur vide.
   D'où deux conséquences. `initialDimension` doit être renseigné, sans quoi un
   délai supplémentaire s'ajoute encore après l'hydratation. Et une capture
   automatisée attrape régulièrement la page **avant** que le graphique existe —
   ce n'est pas une régression, c'est une course : vérifier la présence du tracé
   et recommencer, jamais conclure sur une seule capture.

   Au-delà d'un mois d'historique, agréger par semaine : un point par jour sur
   90 jours donne un hérisson illisible, et la sparkline des indicateurs devient
   un électrocardiogramme.

**Contenu**
- Français partout dans l'interface ; le code (variables, composants) en anglais.
- Montants formatés via `lib/format.ts` — l'API renvoie des **centimes
  entiers**, la division n'a lieu qu'à l'affichage.
- Points de suspension `…`, apostrophes courbes `’`, jamais `...` ni `'`.

**Mise en page**
- Rail fixe à partir de 1024 px, tiroir en dessous.
- Tableau large ⇒ `overflow-x-auto` sur son conteneur, jamais de débordement
  de la page.
- Vérifier à 390 px et 1440 px avant de considérer un écran terminé.

## Vérifier avant de livrer

```bash
npx tsc --noEmit && npx eslint . && npm run build
npx next start -p 3002
# capture réelle, desktop puis mobile
google-chrome --headless --disable-gpu --no-sandbox \
  --screenshot=/tmp/v.png --window-size=1440,1100 \
  --virtual-time-budget=10000 http://localhost:3002/tableau-de-bord
```

`--virtual-time-budget` est **obligatoire** : sans lui, Chrome capture à
l'événement `load`, donc avant l'hydratation, et tout composant client manque à
l'appel. Avec lui, le résultat reste une course — voir le piège 3 ci-dessus.

Un écran n'est pas terminé tant qu'il n'a pas été **regardé** en rendu réel.
Le HTML peut être valide et la page vide — c'est arrivé trois fois sur le
tableau de bord.

## État

Les dix écrans du rail existent : tableau de bord, commandes, clients,
produits, stock, promotions, campagnes, statistiques, réglages, aide.

**Tout affiche des données de démonstration.** Elles vivent dans `lib/demo/`,
seul endroit du back-office qui invente des chiffres ; le tableau en tête de
`lib/demo/index.ts` associe chaque fonction à sa route et dit si elle existe.
Les composants ne reçoivent que des props : le branchement ne touchera que ce
dossier.

**Les filtres passent par l'URL**, jamais par un état en mémoire — ils se
partagent, se mettent en favori et le bouton « précédent » y revient. Tout
paramètre est validé avant usage (`toPeriodKey`, `toStatusKey`, …) : une valeur
inconnue retombe sur la vue par défaut au lieu de faire tomber la page.

Restent à construire : la **connexion** et le **client API**, qui débloquent
tout le reste ; les fiches de détail (`/commandes/[numéro]`,
`/produits/[sku]`, `/clients/[courriel]`), aujourd'hui liées mais absentes ;
la pagination, inutile tant que les listes tiennent en une page.

---

# Ce qui change côté boutique

La boutique (`../front-ecommerce`) **hérite des jetons, des polices et des
règles d'accessibilité** ci-dessus, mais pas de la densité.

| | Back-office | Boutique |
|---|---|---|
| Densité | maximale, tableaux | aérée, respiration |
| Image | absente ou vignette | sujet principal |
| Corps de texte | 14 px | 16 px minimum |
| Couleur | fonctionnelle uniquement | peut porter l'ambiance |
| Rythme | vertical serré | sections amples |

Le cobalt reste la couleur d'action des deux côtés — c'est ce qui fait
reconnaître un même produit. Les couleurs de statut gardent leur sens strict :
un badge « Expédiée » doit être identique dans les deux interfaces.
