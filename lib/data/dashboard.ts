import type { RevenuePoint } from '@/components/dashboard/revenue-chart';
import { apiFetch } from '@/lib/api';
import type { SessionData } from '@/lib/session';
import { dayMonth } from '@/lib/format';

/**
 * Vue « tableau de bord », branchée sur `GET /admin/dashboard`.
 *
 * Deux règles héritées du service s'appliquent encore ici, côté affichage :
 * les commandes annulées ne comptent pas, et les montants de devises ou de
 * régimes de taxe différents ne s'additionnent jamais dans un seul total.
 * Sans trafic tracké, il n'y a pas de taux de conversion réel — la carte
 * correspondante du tableau de bord de démonstration n'a donc pas
 * d'équivalent ici, plutôt que d'inventer un chiffre.
 */

export const PERIODS = {
  '7j': { days: 7, short: '7 jours', label: '7 derniers jours', compare: 'vs 7 jours précédents' },
  '30j': { days: 30, short: '30 jours', label: '30 derniers jours', compare: 'vs 30 jours précédents' },
  '90j': { days: 90, short: '90 jours', label: '90 derniers jours', compare: 'vs 90 jours précédents' },
} as const;

export type PeriodKey = keyof typeof PERIODS;

export function toPeriodKey(value: string | string[] | undefined): PeriodKey {
  return typeof value === 'string' && value in PERIODS ? (value as PeriodKey) : '7j';
}

type ApiOrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

const STATUS_LABELS: Record<ApiOrderStatus, { label: string; tone: 'neutral' | 'warning' | 'info' | 'success' | 'danger' }> = {
  PENDING: { label: 'En attente de paiement', tone: 'neutral' },
  CONFIRMED: { label: 'Confirmées', tone: 'info' },
  PROCESSING: { label: 'En préparation', tone: 'warning' },
  COMPLETED: { label: 'Terminées', tone: 'success' },
  CANCELLED: { label: 'Annulées', tone: 'danger' },
};

export type StatusSlice = {
  label: string;
  tone: 'neutral' | 'warning' | 'info' | 'success' | 'danger';
  count: number;
  href: string;
};

export type TopProduct = { name: string; sku: string; quantity: number; unit: string; revenueCents: number };

type ApiOverview = {
  revenue: {
    totalCents: number;
    orderCount: number;
    averageCents: number;
    revenueChange: number | null;
    orderChange: number | null;
  };
  byTaxRegime: Array<{ currencyCode: string; regime: 'TTC' | 'HT'; totalCents: number; orderCount: number }>;
  byStatus: Array<{ status: ApiOrderStatus; count: number }>;
  series: Array<{ date: string; totalCents: number; orderCount: number }>;
  topProducts: Array<{ sku: string; name: string; revenueCents: number; quantity: number }>;
};

export type Overview = {
  days: number;
  revenue: ApiOverview['revenue'];
  /** Le régime le plus significatif — jamais une somme mêlant devises et régimes. */
  primaryRegime: ApiOverview['byTaxRegime'][number] | null;
  otherRegimes: ApiOverview['byTaxRegime'];
  byStatus: StatusSlice[];
  series: RevenuePoint[];
  topProducts: TopProduct[];
};

export async function getOverview(session: SessionData, days: number): Promise<Overview> {
  const data = await apiFetch<ApiOverview>(session, `/admin/dashboard?days=${days}`);

  const sortedRegimes = [...data.byTaxRegime].sort((a, b) => b.totalCents - a.totalCents);
  const [primaryRegime = null, ...otherRegimes] = sortedRegimes;

  return {
    days,
    revenue: data.revenue,
    primaryRegime,
    otherRegimes,
    byStatus: data.byStatus.map((slice) => ({
      label: STATUS_LABELS[slice.status].label,
      tone: STATUS_LABELS[slice.status].tone,
      count: slice.count,
      href: '/commandes',
    })),
    series: data.series.map((point) => ({
      date: dayMonth(point.date),
      caCents: point.totalCents,
      commandes: point.orderCount,
    })),
    topProducts: data.topProducts.map((product) => ({
      name: product.name,
      sku: product.sku,
      quantity: product.quantity,
      // L'API ne renvoie pas l'unité de vente sur cet agrégat : une quantité
      // entière est très probablement comptée à la pièce, une quantité
      // décimale vendue au poids — cohérent avec le reste du catalogue.
      unit: Number.isInteger(product.quantity) ? 'pièces' : 'kg',
      revenueCents: product.revenueCents,
    })),
  };
}

type ApiBreakdowns = {
  byCategory: Array<{ name: string; totalCents: number }>;
  byCountry: Array<{ countryCode: string; currencyCode: string; totalCents: number; orderCount: number }>;
  byCarrier: Array<{ name: string; orderCount: number }>;
};

export type Breakdowns = ApiBreakdowns;

/**
 * Trois angles pour l'écran « Statistiques », chacun avec sa limite assumée :
 * la catégorie est restreinte à l'euro (pas de mélange de devises), le pays
 * garde sa devise à côté (pas de somme entre régimes), le transporteur ne
 * compte que les commandes déjà expédiées.
 */
export async function getBreakdowns(session: SessionData, days: number): Promise<Breakdowns> {
  return apiFetch<ApiBreakdowns>(session, `/admin/dashboard/breakdowns?days=${days}`);
}
