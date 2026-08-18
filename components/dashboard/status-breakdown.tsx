import Link from 'next/link';
import { number, share } from '@/lib/format';
import type { StatusSlice } from '@/lib/data/dashboard';

/**
 * Répartition du carnet de commandes.
 *
 * Les couleurs employées ici sont celles des statuts, dans leur usage prévu —
 * c'est le seul endroit du tableau de bord où une couleur porte du sens sans
 * être un badge. Elle ne porte jamais l'information seule : la légende
 * en dessous nomme chaque tranche et donne son compte, et c'est elle qui sert
 * d'équivalent accessible à la barre.
 */
const fills: Record<StatusSlice['tone'], string> = {
  neutral: 'bg-ink-300',
  warning: 'bg-warning',
  info: 'bg-info',
  success: 'bg-success',
  danger: 'bg-danger',
};

export function StatusBreakdown({ slices, caption }: { slices: StatusSlice[]; caption?: string }) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <div className="px-5 py-5">
      <p data-numeric className="font-mono text-[28px] leading-none font-semibold text-ink-900">
        {number(total)}
      </p>
      <p className="mt-1.5 text-sm text-ink-500">{caption ?? 'commandes sur les 30 derniers jours'}</p>

      {/* Écart de 2 px entre les tranches : sans lui, deux teintes voisines se
          touchent et la frontière devient invisible en vision daltonienne. */}
      <div aria-hidden className="mt-4 flex h-2.5 gap-0.5">
        {slices.map((slice) => (
          <span
            key={slice.label}
            className={`${fills[slice.tone]} rounded-full`}
            style={{ flexBasis: `${(slice.count / total) * 100}%` }}
          />
        ))}
      </div>

      <ul className="mt-4 space-y-0.5">
        {slices.map((slice) => (
          <li key={slice.label}>
            <Link
              href={slice.href}
              className="-mx-2 flex items-center gap-2.5 rounded-control px-2 py-1.5 transition-colors duration-150 hover:bg-ink-50"
            >
              <span aria-hidden className={`size-2 shrink-0 rounded-full ${fills[slice.tone]}`} />
              <span className="min-w-0 flex-1 truncate text-sm text-ink-700">{slice.label}</span>
              <span data-numeric className="font-mono text-sm font-medium text-ink-900">
                {number(slice.count)}
              </span>
              <span data-numeric className="w-9 shrink-0 text-right text-xs text-ink-500">
                {share(slice.count / total)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
