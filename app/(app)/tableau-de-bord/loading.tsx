import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * État d'attente du tableau de bord.
 *
 * Il calque la grille de la page — quatre indicateurs, un graphique large, une
 * colonne d'alertes, deux tableaux — pour que le remplacement ne déplace
 * aucun bloc. Un squelette qui ne ressemble pas à sa page fait sursauter
 * l'écran au moment où les données arrivent.
 */
export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl"
      // Le rôle et le libellé sont portés une seule fois, ici.
      role="status"
      aria-live="polite"
      aria-label="Chargement du tableau de bord"
    >
      <header className="bg-grid -mx-4 mb-8 px-4 pb-6 lg:-mx-8 lg:px-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2.5 h-8 w-64" />
        <Skeleton className="mt-2.5 h-4 w-80" />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="min-w-0 p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-7 w-36" />
            <Skeleton className="mt-3.5 h-4 w-40" />
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="min-w-0 p-5 xl:col-span-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-4 w-72" />
          <Skeleton className="mt-5 h-64 w-full" />
        </Card>
        <Card className="min-w-0 p-5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-2 h-4 w-48" />
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="mt-4 h-12 w-full" />
          ))}
        </Card>
      </div>

      {Array.from({ length: 2 }, (_, index) => (
        <Card key={index} className="mt-6 min-w-0 p-5">
          <Skeleton className="h-5 w-48" />
          {Array.from({ length: 5 }, (_, row) => (
            <Skeleton key={row} className="mt-3.5 h-8 w-full" />
          ))}
        </Card>
      ))}

      <span className="sr-only">Chargement des indicateurs…</span>
    </div>
  );
}
