import { cn } from '@/lib/cn';

/**
 * Liste de couples libellé / valeur.
 *
 * Un vrai `<dl>` et non une grille de `<div>` : le lecteur d'écran annonce
 * alors « terme, définition » et permet de sauter d'un couple au suivant, ce
 * qu'une grille anonyme ne donne pas.
 *
 * Les valeurs chiffrées passent en chasse fixe : dans une fiche, on compare
 * un montant à celui d'à côté, et deux chasses différentes cassent
 * l'alignement des unités.
 */
export function DefinitionList({
  items,
  className,
}: {
  items: Array<{ term: string; value: React.ReactNode; numeric?: boolean }>;
  className?: string;
}) {
  return (
    <dl className={cn('divide-y divide-ink-200/70', className)}>
      {items.map((item) => (
        <div key={item.term} className="flex items-baseline justify-between gap-6 px-5 py-3">
          <dt className="text-sm text-ink-500">{item.term}</dt>
          <dd
            className={cn(
              'text-right text-sm text-ink-900',
              item.numeric && 'font-mono font-medium whitespace-nowrap',
            )}
            data-numeric={item.numeric ? '' : undefined}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
