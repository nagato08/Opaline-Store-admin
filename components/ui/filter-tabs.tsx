import Link from 'next/link';
import { cn } from '@/lib/cn';
import { number } from '@/lib/format';

export type FilterTab = {
  /** Valeur du paramètre d'URL ; `undefined` pour l'onglet « tout ». */
  value?: string;
  label: string;
  count?: number;
};

/**
 * Onglets de filtrage.
 *
 * Comme le sélecteur de période, ce sont des liens : le filtre appliqué est
 * dans l'URL, donc partageable et réversible par le bouton « précédent ». Un
 * état gardé en mémoire obligerait à refiltrer après chaque aller-retour vers
 * une fiche.
 *
 * Le compte est affiché sur chaque onglet : sans lui, il faut cliquer pour
 * savoir si l'onglet est vide, et on clique donc partout.
 */
export function FilterTabs({
  tabs,
  current,
  param,
  basePath,
}: {
  tabs: FilterTab[];
  current?: string;
  /** Nom du paramètre d'URL, en français comme le reste des URL visibles. */
  param: string;
  basePath: string;
}) {
  return (
    <nav aria-label="Filtrer la liste" className="-mx-1 overflow-x-auto pb-px">
      <ul className="flex min-w-max items-center gap-1 px-1">
        {tabs.map((tab) => {
          const active = tab.value === current;

          return (
            <li key={tab.label}>
              <Link
                href={tab.value ? `${basePath}?${param}=${tab.value}` : basePath}
                scroll={false}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-control px-3 text-sm font-medium',
                  'whitespace-nowrap transition-colors duration-150',
                  active
                    ? 'bg-ink-900 text-white'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )}
              >
                {tab.label}
                {tab.count !== undefined ? (
                  <span
                    data-numeric
                    className={cn(
                      'font-mono text-xs',
                      active ? 'text-ink-300' : 'text-ink-400',
                    )}
                  >
                    {number(tab.count)}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
