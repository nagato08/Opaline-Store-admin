import { dayMonth } from '@/lib/format';
import { lastDays, seeded } from './random';
import type { RevenuePoint } from '@/components/dashboard/revenue-chart';

/**
 * Périodes proposées par le sélecteur.
 *
 * Les variations ne se déduisent pas de la série affichée — elles comparent à
 * la période précédente, qui n'est pas tracée — et restent donc fournies telles
 * quelles, période par période.
 */
export const PERIODS = {
  '7j': {
    days: 7,
    bucketDays: 1,
    short: '7 jours',
    label: '7 derniers jours',
    grain: 'jour par jour',
    compare: 'vs 7 jours précédents',
    conversion: 0.028,
    deltas: { ca: 0.124, orders: 0.081, basket: 0.039, conversion: -0.006 },
  },
  '30j': {
    days: 30,
    bucketDays: 1,
    short: '30 jours',
    label: '30 derniers jours',
    grain: 'jour par jour',
    compare: 'vs 30 jours précédents',
    conversion: 0.026,
    deltas: { ca: 0.068, orders: 0.052, basket: 0.015, conversion: 0.002 },
  },
  '90j': {
    // Au-delà d'un mois, un point par jour n'est plus une courbe mais un
    // hérisson : le regroupement par semaine rend la tendance visible, qui est
    // la seule chose qu'on lit sur trois mois.
    days: 91,
    bucketDays: 7,
    short: '90 jours',
    label: '13 dernières semaines',
    grain: 'semaine par semaine',
    compare: 'vs 90 jours précédents',
    conversion: 0.024,
    deltas: { ca: 0.211, orders: 0.187, basket: 0.02, conversion: 0.004 },
  },
} as const;

export type PeriodKey = keyof typeof PERIODS;

/** Un paramètre d'URL est une donnée non fiable : le valider avant de s'en servir. */
export function toPeriodKey(value: string | string[] | undefined): PeriodKey {
  return typeof value === 'string' && value in PERIODS ? (value as PeriodKey) : '7j';
}

/** Rythme hebdomadaire, de dimanche à samedi. Moyenne exactement 1. */
const WEEKDAY_WEIGHT = [1.05, 0.86, 0.92, 0.98, 1.02, 1.12, 1.05];

const DAILY_CA_CENTS = 285000;

export function revenueSeries(now: Date, days: number, bucketDays = 1): RevenuePoint[] {
  const random = seeded(days * 7919);

  const daily = lastDays(days, now).map((day) => {
    const caCents = Math.round(
      DAILY_CA_CENTS * WEEKDAY_WEIGHT[day.getDay()] * (0.85 + random() * 0.3),
    );
    // Le nombre de commandes découle du panier moyen, jamais l'inverse : deux
    // séries tirées séparément finiraient par se contredire.
    const basketCents = 13000 + random() * 3000;

    return { day, caCents, commandes: Math.max(1, Math.round(caCents / basketCents)) };
  });

  if (bucketDays === 1) {
    return daily.map((point) => ({
      date: dayMonth(point.day),
      caCents: point.caCents,
      commandes: point.commandes,
    }));
  }

  /* Le découpage part de la fin : c'est la période la plus récente qui doit
     tomber juste, un paquet incomplet est acceptable à gauche du graphique,
     jamais à droite où se lit la tendance. */
  const buckets: RevenuePoint[] = [];

  for (let end = daily.length; end > 0; end -= bucketDays) {
    const bucket = daily.slice(Math.max(0, end - bucketDays), end);

    buckets.unshift({
      date: dayMonth(bucket[0].day),
      caCents: bucket.reduce((sum, point) => sum + point.caCents, 0),
      commandes: bucket.reduce((sum, point) => sum + point.commandes, 0),
    });
  }

  return buckets;
}

/**
 * Taux de conversion jour par jour.
 *
 * Tiré à part et non déduit du nombre de commandes : la conversion dépend du
 * trafic, que l'API ne renvoie pas encore. La calquer sur les commandes
 * donnerait deux cartes portant exactement la même courbe, ce qui se voit.
 */
export function conversionSeries(points: number, base: number): number[] {
  const random = seeded(points * 104729);

  return Array.from({ length: points }, () => base * (0.88 + random() * 0.24) * 100);
}
