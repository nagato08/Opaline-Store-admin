import Link from 'next/link';
import { Badge, Dot } from '@/components/ui/badge';
import { dayMonth, number, untilDay } from '@/lib/format';
import type { BadgeTone } from '@/components/ui/badge';
import type { ExpiringLot } from '@/lib/demo';

/**
 * Lots consommables arrivant à échéance.
 *
 * La boutique vend de l'alimentaire : un lot périmé n'est pas une ligne de
 * stock en moins, c'est une marchandise à retirer de la vente et, en cas de
 * rappel, des clients à joindre. D'où le numéro de lot en clair — c'est la
 * seule clé qui relie une commande passée à une marchandise physique.
 *
 * Les quantités sont décimales : l'alimentaire se vend au poids.
 */
function urgency(expiresAt: string, now: Date): { tone: BadgeTone; label: string } {
  const midnight = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((midnight(new Date(expiresAt)) - midnight(now)) / 86_400_000);

  return {
    // Deux jours : le délai en dessous duquel un retrait ne peut plus être
    // planifié tranquillement dans la journée de travail.
    tone: days <= 2 ? 'danger' : days <= 5 ? 'warning' : 'info',
    label: untilDay(expiresAt, now),
  };
}

export function ExpiringLots({ lots, now }: { lots: ExpiringLot[]; now: Date }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 text-sm">
        <caption className="sr-only">
          Lots dont la date limite tombe dans les sept jours, du plus urgent au moins urgent
        </caption>
        <thead>
          <tr className="border-b border-ink-200/70 text-left">
            <th scope="col" className="px-5 py-3 font-medium text-ink-500">
              Lot
            </th>
            <th scope="col" className="px-5 py-3 font-medium text-ink-500">
              Produit
            </th>
            <th scope="col" className="px-5 py-3 font-medium text-ink-500">
              Échéance
            </th>
            <th scope="col" className="px-5 py-3 font-medium text-ink-500">
              Date limite
            </th>
            <th scope="col" className="px-5 py-3 text-right font-medium text-ink-500">
              Quantité restante
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200/70">
          {lots.map((lot) => {
            const { tone, label } = urgency(lot.expiresAt, now);

            return (
              <tr key={lot.lotNumber} className="transition-colors duration-150 hover:bg-ink-50">
                <td className="px-5 py-3.5">
                  <Link
                    href={`/stock/lots/${lot.lotNumber}`}
                    className="font-mono text-[13px] font-medium text-cobalt-600 hover:underline"
                    translate="no"
                  >
                    {lot.lotNumber}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-ink-800">{lot.product}</td>
                <td className="px-5 py-3.5">
                  <Badge tone={tone}>
                    <Dot />
                    {label}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-ink-500">
                  {dayMonth(lot.expiresAt)}
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <span data-numeric className="font-mono font-medium text-ink-900">
                    {number(lot.quantity)}
                  </span>{' '}
                  <span className="text-ink-500">{lot.unit}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
