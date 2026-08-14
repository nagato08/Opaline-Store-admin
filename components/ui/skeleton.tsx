import { cn } from '@/lib/cn';

/**
 * Bloc d'attente.
 *
 * Il reprend la forme de ce qui va s'afficher plutôt qu'un tournoyant centré :
 * l'œil se place avant l'arrivée des données, et la page ne saute pas au
 * moment du remplacement.
 *
 * `aria-hidden` sur chaque bloc : c'est le conteneur qui porte l'annonce, une
 * quinzaine de « chargement » à la suite noieraient le lecteur d'écran.
 */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block animate-pulse rounded bg-ink-100', className)} />;
}
