import { money, number, share } from '@/lib/format';

/**
 * Répartition en barres horizontales.
 *
 * Une seule mesure comparée entre quelques lignes : une seule teinte suffit,
 * et une couleur par ligne inventerait des catégories qui n'existent pas. La
 * valeur chiffrée est écrite en clair à côté — la barre ne sert qu'à donner le
 * rapport de force d'un coup d'œil.
 *
 * Pas de camembert : comparer des angles est plus difficile que comparer des
 * longueurs alignées sur une même base.
 */
export function SplitBars({
  rows,
  kind,
}: {
  rows: Array<{ label: string; value: number; hint?: string }>;
  /** Les montants sont des centimes, les volumes des entiers. */
  kind: 'money' | 'count';
}) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  const leader = Math.max(...rows.map((row) => row.value));

  return (
    <ul className="space-y-4 px-5 py-5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-medium text-ink-900">{row.label}</span>
            <span className="shrink-0 text-sm whitespace-nowrap">
              <span data-numeric className="font-mono font-medium text-ink-900">
                {kind === 'money' ? money(row.value) : number(row.value)}
              </span>
              <span data-numeric className="ml-2 text-xs text-ink-500">
                {share(row.value / total)}
              </span>
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <span aria-hidden className="h-1.5 w-full rounded-full bg-ink-100">
              <span
                className="block h-full rounded-full bg-cobalt-500"
                style={{ width: `${(row.value / leader) * 100}%` }}
              />
            </span>
          </div>

          {row.hint ? <p className="mt-1.5 text-xs text-ink-500">{row.hint}</p> : null}
        </li>
      ))}
    </ul>
  );
}
