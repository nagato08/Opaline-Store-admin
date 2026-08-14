import type { Category } from './catalog';

export type Split = { label: string; valueCents: number; hint: string };

/**
 * Répartition du chiffre d'affaires par catégorie.
 *
 * Les parts sont stables d'une période à l'autre — c'est une structure de
 * ventes, pas une série temporelle : elle ne bouge pas d'un jour au suivant.
 * Seul le montant total suit la période.
 */
const CATEGORY_SHARE: Array<{ label: Category; share: number; hint: string }> = [
  { label: 'Mobilier', share: 0.58, hint: 'Panier élevé, faible volume' },
  { label: 'Électronique', share: 0.27, hint: 'Volume régulier' },
  { label: 'Alimentaire', share: 0.15, hint: 'Réachat fréquent' },
];

export function revenueByCategory(totalCents: number): Split[] {
  return CATEGORY_SHARE.map((row) => ({
    label: row.label,
    valueCents: Math.round(totalCents * row.share),
    hint: row.hint,
  }));
}

/**
 * Répartition par pays.
 *
 * Elle mérite sa propre lecture : la France affiche TTC, le Canada hors taxe
 * et ajoute TPS/TVQ à la caisse. Deux montants côte à côte ne se comparent
 * donc pas directement, et le rappel est porté par le libellé.
 */
const COUNTRY_SHARE = [
  { label: 'France', share: 0.79, hint: 'Montants TTC' },
  { label: 'Canada', share: 0.21, hint: 'Montants hors taxe' },
];

export function revenueByCountry(totalCents: number): Split[] {
  return COUNTRY_SHARE.map((row) => ({
    label: row.label,
    valueCents: Math.round(totalCents * row.share),
    hint: row.hint,
  }));
}

/** Modes de livraison, par volume de commandes sur la période. */
export function shippingSplit(orderCount: number): Array<{ label: string; count: number; hint: string }> {
  return [
    { label: 'Point relais', count: Math.round(orderCount * 0.41), hint: 'Le moins cher' },
    { label: 'Domicile 48 h', count: Math.round(orderCount * 0.32), hint: '' },
    { label: 'Transporteur Québec', count: Math.round(orderCount * 0.14), hint: 'Canada uniquement' },
    { label: 'Chaîne du froid', count: Math.round(orderCount * 0.09), hint: 'Alimentaire frais' },
    { label: 'Hors gabarit', count: Math.round(orderCount * 0.04), hint: 'Sur rendez-vous' },
  ];
}
