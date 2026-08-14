import { hoursAgo } from './random';
import type { BadgeTone } from '@/components/ui/badge';

export type OrderStatusKey =
  | 'awaiting-payment'
  | 'to-prepare'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

/**
 * Statuts de commande.
 *
 * L'ordre suit le cycle de vie réel — attente de paiement, préparation,
 * expédition, livraison — pour que toute barre ou liste construite dessus se
 * lise comme un tuyau : ce qui est à gauche finira à droite.
 *
 * Le `slug` est la valeur qui circule dans l'URL. Il est en français parce que
 * l'URL est visible par l'utilisateur, alors que la clé reste en anglais comme
 * le reste du code.
 */
export const ORDER_STATUSES: Record<
  OrderStatusKey,
  { label: string; short: string; tone: Exclude<BadgeTone, 'brand'>; slug: string }
> = {
  'awaiting-payment': {
    label: 'En attente de paiement',
    short: 'En attente',
    tone: 'neutral',
    slug: 'en-attente',
  },
  'to-prepare': { label: 'À préparer', short: 'À préparer', tone: 'warning', slug: 'a-preparer' },
  shipped: { label: 'Expédiée', short: 'Expédiées', tone: 'info', slug: 'expediee' },
  delivered: { label: 'Livrée', short: 'Livrées', tone: 'success', slug: 'livree' },
  cancelled: { label: 'Annulée', short: 'Annulées', tone: 'danger', slug: 'annulee' },
};

/** Retrouve une clé de statut depuis le paramètre d'URL, sans faire confiance à celui-ci. */
export function toStatusKey(value: string | string[] | undefined): OrderStatusKey | undefined {
  if (typeof value !== 'string') return undefined;

  return (Object.keys(ORDER_STATUSES) as OrderStatusKey[]).find(
    (key) => ORDER_STATUSES[key].slug === value,
  );
}

/**
 * Ligne de commande.
 *
 * Tous les champs sont **figés au moment de l'achat** : libellé, référence,
 * prix unitaire, taux de taxe. Modifier un produit ne doit jamais altérer une
 * commande passée, et l'affichage d'un historique ne joint donc jamais le
 * catalogue.
 */
export type OrderLine = {
  label: string;
  sku: string;
  /** Décimale : l'alimentaire se vend au poids. */
  quantity: number;
  unit: string;
  /** Prix unitaire figé, dans le régime d'affichage du pays de la commande. */
  unitPriceCents: number;
  /** Taux figé lui aussi : une hausse de TVA ne réécrit pas les factures passées. */
  taxRate: number;
  /** Remise déjà ventilée sur la ligne par le moteur de règles. */
  discountCents: number;
  /** Éco-participation, obligation légale française sur le mobilier et l'électronique. */
  ecoTaxCents: number;
  /** Lots consommés, pour qu'un rappel produit soit ciblable. */
  lotNumbers?: string[];
};

export type DemoOrder = {
  number: string;
  customer: string;
  email: string;
  /** La France affiche TTC, le Canada hors taxe : le pays change la lecture du total. */
  country: 'FR' | 'CA';
  status: OrderStatusKey;
  payment: string;
  shipping: string;
  shippingCents: number;
  lines: OrderLine[];
  itemCount: number;
  totalCents: number;
  placedAt: string;
};

/* Âge en heures, du plus récent au plus ancien. Tout est daté relativement à
   l'instant courant : une liste figée sur un jour passé se remarque tout de
   suite et discrédite le reste de l'écran. */
type OrderSeed = Omit<DemoOrder, 'placedAt' | 'itemCount' | 'totalCents'> & { ageHours: number };

const ORDERS: OrderSeed[] = [
  {
    number: 'CMD-2026-000009', customer: 'Camille Berger', email: 'camille.berger@example.fr',
    country: 'FR', status: 'to-prepare', payment: 'Virement reçu',
    shipping: 'Hors gabarit sur rendez-vous', shippingCents: 8900, ageHours: 2,
    lines: [
      { label: 'Canapé Oslo — gris', sku: 'MOB-OSL-3P-GRI', quantity: 1, unit: 'pièce', unitPriceCents: 89900, taxRate: 0.2, discountCents: 13485, ecoTaxCents: 1200 },
      { label: 'Table Rennes — chêne 180 cm', sku: 'MOB-REN-180-CHE', quantity: 1, unit: 'pièce', unitPriceCents: 54900, taxRate: 0.2, discountCents: 8235, ecoTaxCents: 900 },
      { label: 'Chaise Lund — noir', sku: 'MOB-LUN-NOI', quantity: 4, unit: 'pièces', unitPriceCents: 12900, taxRate: 0.2, discountCents: 7740, ecoTaxCents: 150 },
    ],
  },
  {
    number: 'CMD-2026-000008', customer: 'Paul Invité', email: 'paul.invite@example.fr',
    country: 'FR', status: 'to-prepare', payment: 'Virement reçu',
    shipping: 'Point relais', shippingCents: 490, ageHours: 4,
    lines: [
      { label: 'Café Arabica moulu — sachet 250 g', sku: 'ALI-CAF-ARA-250', quantity: 1.5, unit: 'kg', unitPriceCents: 890, taxRate: 0.055, discountCents: 0, ecoTaxCents: 0, lotNumbers: ['L-24-0388'] },
    ],
  },
  {
    number: 'CMD-2026-000007', customer: 'Sofia Marchand', email: 'sofia.marchand@example.fr',
    country: 'FR', status: 'shipped', payment: 'Virement reçu',
    shipping: 'Domicile 48 h', shippingCents: 690, ageHours: 19,
    lines: [
      { label: 'Casque Aurea — noir', sku: 'ELE-AUR-BT-NOI', quantity: 2, unit: 'pièces', unitPriceCents: 14960, taxRate: 0.2, discountCents: 0, ecoTaxCents: 50 },
      { label: 'Station de charge Nord — blanc', sku: 'ELE-NOR-USBC', quantity: 5, unit: 'pièces', unitPriceCents: 3490, taxRate: 0.2, discountCents: 0, ecoTaxCents: 20 },
    ],
  },
  {
    number: 'CMD-2026-000006', customer: 'Yann Delcourt', email: 'yann.delcourt@example.fr',
    country: 'FR', status: 'awaiting-payment', payment: 'Virement attendu',
    shipping: 'Point relais', shippingCents: 490, ageHours: 22,
    lines: [
      { label: 'Riz basmati bio — vrac', sku: 'ALI-RIZ-BAS-BIO', quantity: 3, unit: 'kg', unitPriceCents: 1800, taxRate: 0.055, discountCents: 0, ecoTaxCents: 0, lotNumbers: ['L-24-0392'] },
      { label: 'Confiture d’abricot — pot 370 g', sku: 'ALI-CON-ABR-370', quantity: 4, unit: 'pots', unitPriceCents: 620, taxRate: 0.055, discountCents: 500, ecoTaxCents: 0, lotNumbers: ['L-24-0405'] },
    ],
  },
  {
    number: 'CMD-2026-000005', customer: 'Inès Fontaine', email: 'ines.fontaine@example.fr',
    country: 'FR', status: 'delivered', payment: 'À la livraison',
    shipping: 'Domicile 48 h', shippingCents: 690, ageHours: 27,
    lines: [
      { label: 'Enceinte Mistral — anthracite', sku: 'ELE-MIS-BT', quantity: 2, unit: 'pièces', unitPriceCents: 7990, taxRate: 0.2, discountCents: 0, ecoTaxCents: 40 },
      { label: 'Plaid Bergen — laine grise', sku: 'MOB-BER-LAI-GRI', quantity: 1, unit: 'pièce', unitPriceCents: 6900, taxRate: 0.2, discountCents: 0, ecoTaxCents: 0 },
    ],
  },
  {
    number: 'CMD-2026-000004', customer: 'Mathieu Roy', email: 'mathieu.roy@example.ca',
    country: 'CA', status: 'shipped', payment: 'Virement reçu',
    shipping: 'Transporteur Québec', shippingCents: 2400, ageHours: 41,
    lines: [
      { label: 'Casque Aurea — noir', sku: 'ELE-AUR-BT-NOI', quantity: 4, unit: 'pièces', unitPriceCents: 14960, taxRate: 0.14975, discountCents: 0, ecoTaxCents: 0 },
      { label: 'Écouteurs Brise', sku: 'ELE-BRI-TWS', quantity: 2, unit: 'pièces', unitPriceCents: 5990, taxRate: 0.14975, discountCents: 0, ecoTaxCents: 0 },
    ],
  },
  {
    number: 'CMD-2026-000003', customer: 'Aïcha Benali', email: 'aicha.benali@example.fr',
    country: 'FR', status: 'delivered', payment: 'Virement reçu',
    shipping: 'Chaîne du froid', shippingCents: 1290, ageHours: 53,
    lines: [
      { label: 'Miel de châtaignier — pot 500 g', sku: 'ALI-MIE-CHA-500', quantity: 2.5, unit: 'kg', unitPriceCents: 1800, taxRate: 0.055, discountCents: 0, ecoTaxCents: 0, lotNumbers: ['L-24-0417'] },
      { label: 'Huile d’olive vierge — bidon 1 L', sku: 'ALI-HUI-OLI-1L', quantity: 4, unit: 'L', unitPriceCents: 1450, taxRate: 0.055, discountCents: 0, ecoTaxCents: 0, lotNumbers: ['L-24-0401'] },
      { label: 'Café Arabica moulu — sachet 250 g', sku: 'ALI-CAF-ARA-250', quantity: 2.5, unit: 'kg', unitPriceCents: 890, taxRate: 0.055, discountCents: 0, ecoTaxCents: 0, lotNumbers: ['L-24-0388'] },
    ],
  },
  {
    number: 'CMD-2026-000002', customer: 'Léa Tremblay', email: 'lea.tremblay@example.ca',
    country: 'CA', status: 'cancelled', payment: 'Remboursé',
    shipping: 'Transporteur Québec', shippingCents: 2400, ageHours: 66,
    lines: [
      { label: 'Table Rennes — chêne 180 cm', sku: 'MOB-REN-180-CHE', quantity: 1, unit: 'pièce', unitPriceCents: 54900, taxRate: 0.14975, discountCents: 0, ecoTaxCents: 0 },
    ],
  },
  {
    number: 'CMD-2026-000001', customer: 'Hugo Lambert', email: 'hugo.lambert@example.fr',
    country: 'FR', status: 'delivered', payment: 'À la livraison',
    shipping: 'Domicile 48 h', shippingCents: 690, ageHours: 74,
    lines: [
      { label: 'Lampe Arc — laiton', sku: 'MOB-ARC-LAI', quantity: 1, unit: 'pièce', unitPriceCents: 9400, taxRate: 0.2, discountCents: 2350, ecoTaxCents: 60 },
      { label: 'Confiture d’abricot — pot 370 g', sku: 'ALI-CON-ABR-370', quantity: 2, unit: 'pots', unitPriceCents: 620, taxRate: 0.055, discountCents: 0, ecoTaxCents: 0, lotNumbers: ['L-24-0405'] },
    ],
  },
  {
    number: 'CMD-2025-009998', customer: 'Nour Haddad', email: 'nour.haddad@example.fr',
    country: 'FR', status: 'delivered', payment: 'Virement reçu',
    shipping: 'Point relais', shippingCents: 490, ageHours: 91,
    lines: [
      { label: 'Huile d’olive vierge — bidon 1 L', sku: 'ALI-HUI-OLI-1L', quantity: 2, unit: 'L', unitPriceCents: 1450, taxRate: 0.055, discountCents: 0, ecoTaxCents: 0, lotNumbers: ['L-24-0401'] },
    ],
  },
  {
    number: 'CMD-2025-009997', customer: 'Émile Gagnon', email: 'emile.gagnon@example.ca',
    country: 'CA', status: 'awaiting-payment', payment: 'Virement attendu',
    shipping: 'Transporteur Québec', shippingCents: 2400, ageHours: 103,
    lines: [
      { label: 'Chaise Lund — noir', sku: 'MOB-LUN-NOI', quantity: 4, unit: 'pièces', unitPriceCents: 12900, taxRate: 0.14975, discountCents: 0, ecoTaxCents: 0 },
      { label: 'Enceinte Mistral — anthracite', sku: 'ELE-MIS-BT', quantity: 1, unit: 'pièce', unitPriceCents: 7990, taxRate: 0.14975, discountCents: 0, ecoTaxCents: 0 },
    ],
  },
  {
    number: 'CMD-2025-009996', customer: 'Clara Nguyen', email: 'clara.nguyen@example.fr',
    country: 'FR', status: 'delivered', payment: 'Virement reçu',
    shipping: 'Chaîne du froid', shippingCents: 1290, ageHours: 118,
    lines: [
      { label: 'Riz basmati bio — vrac', sku: 'ALI-RIZ-BAS-BIO', quantity: 6, unit: 'kg', unitPriceCents: 1800, taxRate: 0.055, discountCents: 0, ecoTaxCents: 0, lotNumbers: ['L-24-0392'] },
      { label: 'Miel de châtaignier — pot 500 g', sku: 'ALI-MIE-CHA-500', quantity: 1.5, unit: 'kg', unitPriceCents: 1800, taxRate: 0.055, discountCents: 0, ecoTaxCents: 0, lotNumbers: ['L-24-0417'] },
      { label: 'Confiture d’abricot — pot 370 g', sku: 'ALI-CON-ABR-370', quantity: 3, unit: 'pots', unitPriceCents: 620, taxRate: 0.055, discountCents: 0, ecoTaxCents: 0, lotNumbers: ['L-24-0405'] },
    ],
  },
];

export type OrderTotals = {
  /** Somme des lignes avant remise, dans le régime d'affichage du pays. */
  subtotalCents: number;
  discountCents: number;
  ecoTaxCents: number;
  shippingCents: number;
  /** Base hors taxe **après** remise : c'est elle qui porte la taxe. */
  taxableCents: number;
  taxCents: number;
  totalCents: number;
  /** Détail par taux, tel qu'il doit figurer sur une facture. */
  taxBreakdown: Array<{ rate: number; baseCents: number; taxCents: number }>;
};

/**
 * Totaux d'une commande.
 *
 * Deux règles gouvernent ce calcul et aucune n'est négociable :
 *
 * 1. **La remise s'applique avant la taxe.** Une remise réduit la base
 *    taxable. Calculer la taxe sur le prix plein puis retrancher donne un
 *    montant faux et une facture non conforme.
 * 2. **Le régime d'affichage dépend du pays.** La France impose l'affichage
 *    TTC — la taxe est alors *extraite* du prix ; le Canada affiche hors taxe
 *    et l'ajoute à la caisse. Ce n'est pas un réglage de la boutique.
 */
export function orderTotals(order: Pick<DemoOrder, 'country' | 'lines' | 'shippingCents'>): OrderTotals {
  const inclusive = order.country === 'FR';

  let subtotalCents = 0;
  let discountCents = 0;
  let ecoTaxCents = 0;
  const byRate = new Map<number, { baseCents: number; taxCents: number }>();

  for (const line of order.lines) {
    const gross = Math.round(line.unitPriceCents * line.quantity);
    const net = gross - line.discountCents;

    subtotalCents += gross;
    discountCents += line.discountCents;
    ecoTaxCents += Math.round(line.ecoTaxCents * line.quantity);

    // Prix TTC : la base hors taxe se déduit du net, elle ne s'y ajoute pas.
    const baseCents = inclusive ? Math.round(net / (1 + line.taxRate)) : net;
    const taxCents = inclusive ? net - baseCents : Math.round(net * line.taxRate);

    const bucket = byRate.get(line.taxRate) ?? { baseCents: 0, taxCents: 0 };
    byRate.set(line.taxRate, {
      baseCents: bucket.baseCents + baseCents,
      taxCents: bucket.taxCents + taxCents,
    });
  }

  const taxableCents = [...byRate.values()].reduce((sum, bucket) => sum + bucket.baseCents, 0);
  const taxCents = [...byRate.values()].reduce((sum, bucket) => sum + bucket.taxCents, 0);

  return {
    subtotalCents,
    discountCents,
    ecoTaxCents,
    shippingCents: order.shippingCents,
    taxableCents,
    taxCents,
    totalCents: taxableCents + taxCents + ecoTaxCents + order.shippingCents,
    taxBreakdown: [...byRate.entries()]
      .map(([rate, bucket]) => ({ rate, ...bucket }))
      .sort((a, b) => a.rate - b.rate),
  };
}

function hydrate(seed: OrderSeed, now: Date): DemoOrder {
  const { ageHours, ...order } = seed;

  return {
    ...order,
    placedAt: hoursAgo(now, ageHours),
    /* Les quantités décimales ne se comptent pas comme des unités : « 1,5 kg
       de café » est *un* article, pas un et demi. */
    itemCount: order.lines.length,
    totalCents: orderTotals(order).totalCents,
  };
}

export function orders(now: Date): DemoOrder[] {
  return ORDERS.map((seed) => hydrate(seed, now));
}

/** Une commande par son numéro ; `undefined` si le numéro n'existe pas. */
export function orderByNumber(numero: string, now: Date): DemoOrder | undefined {
  const seed = ORDERS.find((order) => order.number === numero);
  return seed ? hydrate(seed, now) : undefined;
}

/** Les commandes d'un client, de la plus récente à la plus ancienne. */
export function ordersOf(email: string, now: Date): DemoOrder[] {
  return orders(now).filter((order) => order.email === email);
}

/** Les cinq dernières, pour le tableau de bord. */
export function latestOrders(now: Date): DemoOrder[] {
  return orders(now).slice(0, 5);
}

/* ------------------------------------------------------------------------- */

export type TimelineEntry = { label: string; detail: string; at: string; done: boolean };

/**
 * Journal d'une commande.
 *
 * Reconstruit depuis le statut plutôt que stocké : les étapes franchies sont
 * celles qui précèdent le statut courant dans le cycle de vie. Une annulation
 * interrompt la chaîne — elle ne se glisse pas entre deux étapes.
 */
export function orderTimeline(order: DemoOrder): TimelineEntry[] {
  const placed = Date.parse(order.placedAt);
  const at = (hours: number) => new Date(placed + hours * 3_600_000).toISOString();
  const reached = ['awaiting-payment', 'to-prepare', 'shipped', 'delivered'].indexOf(order.status);

  const steps: TimelineEntry[] = [
    { label: 'Commande reçue', detail: `${order.lines.length} ligne${order.lines.length > 1 ? 's' : ''}, ${order.payment.toLocaleLowerCase('fr')}`, at: order.placedAt, done: true },
    { label: 'Paiement encaissé', detail: order.payment, at: at(3), done: reached >= 1 },
    { label: 'Préparée et expédiée', detail: order.shipping, at: at(26), done: reached >= 2 },
    { label: 'Livrée', detail: order.shipping, at: at(74), done: reached >= 3 },
  ];

  if (order.status === 'cancelled') {
    return [
      steps[0],
      { label: 'Commande annulée', detail: 'Remboursement émis, stock relâché', at: at(12), done: true },
    ];
  }

  return steps;
}

/* ------------------------------------------------------------------------- */

export type StatusSlice = {
  key: OrderStatusKey;
  label: string;
  tone: Exclude<BadgeTone, 'brand'>;
  count: number;
  href: string;
};

/**
 * Répartition du carnet de commandes sur 30 jours.
 *
 * Les comptes ne sont pas ceux de la liste ci-dessus, qui n'en montre que les
 * douze dernières : c'est un agrégat, et il le dit dans son libellé.
 */
const STATUS_COUNTS: Record<OrderStatusKey, number> = {
  'awaiting-payment': 6,
  'to-prepare': 14,
  shipped: 23,
  delivered: 94,
  cancelled: 6,
};

export function ordersByStatus(): StatusSlice[] {
  return (Object.keys(ORDER_STATUSES) as OrderStatusKey[]).map((key) => ({
    key,
    label: ORDER_STATUSES[key].short,
    tone: ORDER_STATUSES[key].tone,
    count: STATUS_COUNTS[key],
    href: `/commandes?statut=${ORDER_STATUSES[key].slug}`,
  }));
}
