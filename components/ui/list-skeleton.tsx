import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * État d'attente d'une page de liste.
 *
 * Les six listes du back-office ont la même trame — en-tête, onglets de
 * filtre, champ de recherche, tableau — et partagent donc un seul squelette
 * paramétré. Le nombre de colonnes et de lignes vient de l'appelant : un
 * squelette à quatre colonnes devant un tableau qui en a six fait sauter
 * l'écran au moment du remplacement, ce qu'un squelette est censé éviter.
 */
export function ListSkeleton({
  label,
  columns,
  rows = 8,
  tabs = 4,
}: {
  /** Ce qui est en train de charger, annoncé aux lecteurs d'écran. */
  label: string;
  columns: number;
  rows?: number;
  tabs?: number;
}) {
  return (
    <div
      className="mx-auto w-full max-w-7xl"
      // Le rôle et le libellé sont portés une seule fois, ici : une quinzaine
      // de blocs annoncés séparément noieraient le lecteur d'écran.
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <header className="bg-grid -mx-4 mb-6 px-4 pb-6 lg:-mx-8 lg:px-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2.5 h-4 w-full max-w-2xl" />
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {Array.from({ length: tabs }, (_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-9 w-full rounded-control sm:w-72" />
      </div>

      <Card className="min-w-0 overflow-hidden">
        <div className="border-b border-ink-200/70 px-5 py-3">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="divide-y divide-ink-200/70">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex items-center gap-5 px-5 py-4">
              {Array.from({ length: columns }, (_, column) => (
                <Skeleton
                  key={column}
                  /* La première colonne porte un libellé, les suivantes une
                     valeur : leur donner la même largeur produit une grille
                     régulière qui ne ressemble à aucun tableau réel. */
                  className={column === 0 ? 'h-4 flex-2' : 'h-4 flex-1'}
                />
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
