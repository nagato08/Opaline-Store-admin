import Link from 'next/link';
import { cn } from '@/lib/cn';
import { PERIODS, type PeriodKey } from '@/lib/data/dashboard';

/**
 * Sélecteur de période.
 *
 * Ce sont des liens et non des boutons : la période choisie vit dans l'URL,
 * donc elle se met en favori, se partage, et le bouton « précédent » du
 * navigateur revient dessus. Un état gardé en mémoire ferait perdre les trois.
 *
 * `scroll={false}` : changer de période remplace des chiffres à leur place, ce
 * n'est pas un changement de page — remonter en haut serait déroutant.
 */
export function PeriodPicker({
  current,
  basePath,
}: {
  current: PeriodKey;
  basePath: string;
}) {
  return (
    <nav aria-label="Période affichée">
      <ul className="flex items-center gap-0.5 rounded-control bg-ink-100 p-0.5">
        {Object.entries(PERIODS).map(([key, period]) => {
          const active = key === current;

          return (
            <li key={key}>
              <Link
                href={`${basePath}?periode=${key}`}
                scroll={false}
                // L'état actif ne peut pas reposer sur le seul contraste de
                // fond : il est aussi annoncé.
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-9 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap',
                  'transition-colors duration-150',
                  active
                    ? 'bg-surface text-ink-900 shadow-card'
                    : 'text-ink-600 hover:text-ink-900',
                )}
              >
                {period.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
