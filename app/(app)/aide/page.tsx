import { LifeBuoy, Mail } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/button';

export const metadata = { title: 'Aide — Comptoir' };

/**
 * Raccourcis clavier.
 *
 * `<kbd>` et non un `<span>` stylé : c'est l'élément prévu pour une touche, et
 * un lecteur d'écran l'annonce comme telle.
 */
const SHORTCUTS = [
  { keys: ['⌘', 'K'], action: 'Ouvrir la recherche globale' },
  { keys: ['⌘', '⇧', 'P'], action: 'Aller à une page' },
  { keys: ['/'], action: 'Filtrer la liste affichée' },
  { keys: ['Échap'], action: 'Fermer un panneau ou un menu' },
];

/**
 * Glossaire.
 *
 * Ces mots viennent du métier et non de l'informatique : ils apparaissent dans
 * l'interface, donc ils doivent être expliqués là où on les lit.
 */
const GLOSSARY = [
  {
    term: 'FEFO',
    definition:
      'First Expired, First Out. Le lot dont la date limite tombe le plus tôt part le premier, quel que soit son ordre d’arrivée en stock.',
  },
  {
    term: 'Disponible',
    definition:
      'La quantité physique moins ce que les commandes payées ont déjà immobilisé. C’est ce nombre qui décide d’une rupture, pas ce qu’il y a en rayon.',
  },
  {
    term: 'Éco-participation',
    definition:
      'Contribution légale française sur le mobilier et l’électronique. Elle s’affiche à part du prix et n’est jamais fondue dedans.',
  },
  {
    term: 'Numéro de lot',
    definition:
      'La seule clé qui relie une commande passée à une marchandise physique. C’est elle qui rend un rappel produit ciblable.',
  },
  {
    term: 'Commande figée',
    definition:
      'Une commande conserve les libellés, prix, taxes et adresses du jour où elle a été passée. Modifier un produit ne change jamais une commande déjà enregistrée.',
  },
  {
    term: 'Affichage TTC ou hors taxe',
    definition:
      'La France impose l’affichage toutes taxes comprises, le Canada affiche hors taxe et ajoute TPS/TVQ à la caisse. Cela dépend du pays de livraison, pas d’un réglage de la boutique.',
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Aide"
        description="Les raccourcis qui font gagner du temps et le vocabulaire employé dans l’interface."
      />

      <div className="max-w-4xl space-y-6">
        <Card className="min-w-0">
          <CardHeader
            title="Raccourcis clavier"
            description="Sur un outil utilisé toute la journée, ne pas quitter le clavier fait gagner un temps réel"
          />
          <dl className="divide-y divide-ink-200/70">
            {SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.action}
                className="flex items-center justify-between gap-6 px-5 py-3.5"
              >
                <dt className="text-sm text-ink-700">{shortcut.action}</dt>
                <dd className="flex shrink-0 items-center gap-1">
                  {shortcut.keys.map((key) => (
                    <kbd
                      key={key}
                      className="rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 font-mono text-[11px] text-ink-600"
                    >
                      {key}
                    </kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="min-w-0">
          <CardHeader
            title="Glossaire"
            description="Les termes métier tels qu’ils sont employés dans les écrans"
          />
          <dl className="divide-y divide-ink-200/70">
            {GLOSSARY.map((entry) => (
              <div key={entry.term} className="px-5 py-4">
                <dt className="text-sm font-semibold text-ink-900">{entry.term}</dt>
                <dd className="mt-1 text-sm text-ink-600">{entry.definition}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Une question sans réponse ici ?" description="" />
          <div className="flex flex-wrap items-center gap-4 px-5 py-5">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-full bg-cobalt-50 text-cobalt-600"
            >
              <LifeBuoy className="size-5" />
            </span>
            <p className="min-w-0 flex-1 text-sm text-ink-600">
              Décrivez ce que vous tentiez de faire et ce que l’écran a affiché. S’il y a un
              message d’erreur avec une référence, recopiez-la : elle mène directement à la
              trace côté serveur.
            </p>
            <LinkButton href="mailto:support@example.fr" variant="secondary" size="sm">
              <Mail aria-hidden className="size-4" />
              Écrire au support
            </LinkButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
