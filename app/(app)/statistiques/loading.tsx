import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl"
      role="status"
      aria-live="polite"
      aria-label="Chargement des statistiques"
    >
      <header className="bg-grid -mx-4 mb-6 px-4 pb-6 lg:-mx-8 lg:px-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2.5 h-4 w-full max-w-2xl" />
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

      <Card className="mt-6 min-w-0 p-5">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-2 h-4 w-64" />
        {/* Même hauteur que le graphique réel : sans elle, les trois panneaux
            du bas remontent puis redescendent au moment du remplacement. */}
        <Skeleton className="mt-5 h-72 w-full" />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="min-w-0 p-5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-4 w-44" />
            {Array.from({ length: 3 }, (_, row) => (
              <div key={row} className="mt-5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}
