import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * État d'attente d'une page faite de panneaux — réglages, aide.
 *
 * Ces pages n'ont pas de tableau : leur trame est une pile de cartes titrées
 * contenant des lignes libellé / valeur.
 */
export function PanelSkeleton({
  label,
  panels = 3,
  lines = 4,
}: {
  label: string;
  panels?: number;
  lines?: number;
}) {
  return (
    <div
      className="mx-auto w-full max-w-4xl"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <header className="bg-grid -mx-4 mb-6 px-4 pb-6 lg:-mx-8 lg:px-8">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2.5 h-4 w-full max-w-2xl" />
      </header>

      <div className="space-y-6">
        {Array.from({ length: panels }, (_, panel) => (
          <Card key={panel} className="min-w-0">
            <div className="border-b border-ink-200/70 px-5 py-4">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
            <div className="divide-y divide-ink-200/70">
              {Array.from({ length: lines }, (_, line) => (
                <div key={line} className="flex items-center justify-between gap-6 px-5 py-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
