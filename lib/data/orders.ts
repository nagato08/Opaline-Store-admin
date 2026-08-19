import type { BadgeTone } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import type { SessionData } from '@/lib/session';

/**
 * Vue « commandes » branchée sur `GET /admin/orders` et `GET /admin/orders/:id`.
 *
 * Le statut technique de la commande (`OrderStatus` — PENDING, CONFIRMED…)
 * ne dit pas où elle en est pour quelqu'un qui prépare un colis : une
 * commande CONFIRMED peut être payée et pas encore expédiée, ou expédiée. Ce
 * module recompose donc un statut de lecture — attente de paiement, à
 * préparer, expédiée, livrée, annulée — à partir des trois champs réels
 * (`status`, `paymentStatus`, `fulfillmentStatus`), pour la même raison que
 * l'écran d'origine : une liste triable en un coup d'œil.
 */

export type OrderStatusKey = 'awaiting-payment' | 'to-prepare' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: Record<
  OrderStatusKey,
  { label: string; short: string; tone: Exclude<BadgeTone, 'brand'>; slug: string }
> = {
  'awaiting-payment': { label: 'En attente de paiement', short: 'En attente', tone: 'neutral', slug: 'en-attente' },
  'to-prepare': { label: 'À préparer', short: 'À préparer', tone: 'warning', slug: 'a-preparer' },
  shipped: { label: 'Expédiée', short: 'Expédiées', tone: 'info', slug: 'expediee' },
  delivered: { label: 'Livrée', short: 'Livrées', tone: 'success', slug: 'livree' },
  cancelled: { label: 'Annulée', short: 'Annulées', tone: 'danger', slug: 'annulee' },
};

export function toStatusKey(value: string | string[] | undefined): OrderStatusKey | undefined {
  if (typeof value !== 'string') return undefined;
  return (Object.keys(ORDER_STATUSES) as OrderStatusKey[]).find((key) => ORDER_STATUSES[key].slug === value);
}

/** Statut technique → statut de lecture. L'annulation prime sur tout le reste. */
export function deriveStatusKey(order: Pick<ApiOrder, 'status' | 'paymentStatus' | 'fulfillmentStatus'>): OrderStatusKey {
  if (order.status === 'CANCELLED') return 'cancelled';
  if (order.fulfillmentStatus === 'DELIVERED' || order.fulfillmentStatus === 'RETURNED') return 'delivered';
  if (order.fulfillmentStatus === 'SHIPPED') return 'shipped';
  if (order.paymentStatus === 'UNPAID' || order.paymentStatus === 'FAILED') return 'awaiting-payment';
  return 'to-prepare';
}

const PAYMENT_LABELS: Record<ApiPaymentStatus, string> = {
  UNPAID: 'Virement attendu',
  AUTHORIZED: 'Paiement autorisé',
  PARTIALLY_PAID: 'Partiellement réglée',
  PAID: 'Réglée',
  PARTIALLY_REFUNDED: 'Partiellement remboursée',
  REFUNDED: 'Remboursée',
  FAILED: 'Paiement échoué',
};

export type ApiOrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
export type ApiPaymentStatus = 'UNPAID' | 'AUTHORIZED' | 'PARTIALLY_PAID' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'FAILED';
export type ApiFulfillmentStatus = 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';

type ApiOrderItem = {
  id: string;
  sku: string;
  name: string;
  variantName: string | null;
  quantity: string;
  unitPriceCents: number;
  discountCents: number;
  taxCents: number;
  ecoTaxCents: number;
  totalCents: number;
  lotNumbers: string[];
};

type ApiAddress = {
  type: 'SHIPPING' | 'BILLING';
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  postalCode: string;
  city: string;
  countryCode: string;
  phone: string | null;
};

type ApiTaxLine = { name: string; ratePercent: string; taxableCents: number; amountCents: number };

type ApiStatusHistoryEntry = { toStatus: ApiOrderStatus; reason: string | null; createdAt: string };

type ApiShipment = {
  status: string;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  carrier: { name: string } | null;
};

/** Forme commune à `GET /admin/orders` (liste) et `GET /admin/orders/:id` (fiche). */
type ApiOrder = {
  id: string;
  number: string;
  email: string;
  status: ApiOrderStatus;
  paymentStatus: ApiPaymentStatus;
  fulfillmentStatus: ApiFulfillmentStatus;
  currencyCode: string;
  pricesIncludeTax: boolean;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  ecoTaxCents: number;
  totalCents: number;
  paidCents: number;
  refundedCents: number;
  createdAt: string;
  items: ApiOrderItem[];
  addresses?: ApiAddress[];
  taxLines?: ApiTaxLine[];
  statusHistory?: ApiStatusHistoryEntry[];
  shipments?: ApiShipment[];
};

export type OrderLine = {
  id: string;
  label: string;
  sku: string;
  variantName: string | null;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  taxCents: number;
  ecoTaxCents: number;
  totalCents: number;
  lotNumbers: string[];
};

export type AdminOrder = {
  id: string;
  number: string;
  customer: string;
  email: string;
  countryCode: string | null;
  status: OrderStatusKey;
  paymentLabel: string;
  shippingLabel: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  ecoTaxCents: number;
  currencyCode: string;
  pricesIncludeTax: boolean;
  lines: OrderLine[];
  itemCount: number;
  totalCents: number;
  placedAt: string;
};

export type OrderTotals = {
  subtotalCents: number;
  discountCents: number;
  ecoTaxCents: number;
  shippingCents: number;
  taxableCents: number;
  taxCents: number;
  totalCents: number;
  taxBreakdown: Array<{ name: string; ratePercent: number; baseCents: number; taxCents: number }>;
};

export type TimelineEntry = { label: string; detail: string; at: string; done: boolean };

function shippingLabel(order: ApiOrder): string {
  const shipment = order.shipments?.[0];
  if (shipment?.carrier?.name) return shipment.carrier.name;
  return order.shippingCents > 0 ? 'Livraison standard' : 'Livraison offerte';
}

function customerName(order: ApiOrder): string {
  const shipping = order.addresses?.find((address) => address.type === 'SHIPPING');
  return shipping ? `${shipping.firstName} ${shipping.lastName}`.trim() : order.email;
}

function toOrder(order: ApiOrder): AdminOrder {
  const shipping = order.addresses?.find((address) => address.type === 'SHIPPING');

  return {
    id: order.id,
    number: order.number,
    customer: customerName(order),
    email: order.email,
    countryCode: shipping?.countryCode ?? null,
    status: deriveStatusKey(order),
    paymentLabel: PAYMENT_LABELS[order.paymentStatus],
    shippingLabel: shippingLabel(order),
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    shippingCents: order.shippingCents,
    taxCents: order.taxCents,
    ecoTaxCents: order.ecoTaxCents,
    currencyCode: order.currencyCode,
    pricesIncludeTax: order.pricesIncludeTax,
    lines: order.items.map((item) => ({
      id: item.id,
      label: item.name,
      sku: item.sku,
      variantName: item.variantName,
      quantity: Number(item.quantity),
      unitPriceCents: item.unitPriceCents,
      discountCents: item.discountCents,
      taxCents: item.taxCents,
      ecoTaxCents: item.ecoTaxCents,
      totalCents: item.totalCents,
      lotNumbers: item.lotNumbers,
    })),
    itemCount: order.items.length,
    totalCents: order.totalCents,
    placedAt: order.createdAt,
  };
}

/** Totaux : déjà calculés et figés côté API au moment de la commande, jamais recalculés ici. */
export function orderTotals(order: ApiOrder): OrderTotals {
  return {
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    ecoTaxCents: order.ecoTaxCents,
    shippingCents: order.shippingCents,
    taxableCents: (order.taxLines ?? []).reduce((sum, line) => sum + line.taxableCents, 0),
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    taxBreakdown: (order.taxLines ?? [])
      .map((line) => ({
        name: line.name,
        ratePercent: Number(line.ratePercent) / 100,
        baseCents: line.taxableCents,
        taxCents: line.amountCents,
      }))
      .sort((a, b) => a.ratePercent - b.ratePercent),
  };
}

const STATUS_STEP_LABELS: Record<ApiOrderStatus, string> = {
  PENDING: 'Commande reçue',
  CONFIRMED: 'Paiement confirmé',
  PROCESSING: 'En préparation',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

/** Journal d'une commande, reconstruit depuis son historique de transitions réel. */
export function orderTimeline(order: ApiOrder): TimelineEntry[] {
  const history = order.statusHistory ?? [];

  const created: TimelineEntry = {
    label: 'Commande reçue',
    detail: `${order.items.length} ligne${order.items.length > 1 ? 's' : ''}`,
    at: order.createdAt,
    done: true,
  };

  const transitions: TimelineEntry[] = history.map((entry) => ({
    label: STATUS_STEP_LABELS[entry.toStatus],
    detail: entry.reason ?? '—',
    at: entry.createdAt,
    done: true,
  }));

  const shipment = order.shipments?.[0];
  const shipmentEntries: TimelineEntry[] = [];
  if (shipment?.shippedAt) {
    shipmentEntries.push({
      label: 'Expédiée',
      detail: shipment.trackingNumber ? `Suivi ${shipment.trackingNumber}` : shippingLabel(order),
      at: shipment.shippedAt,
      done: true,
    });
  }
  if (shipment?.deliveredAt) {
    shipmentEntries.push({ label: 'Livrée', detail: shippingLabel(order), at: shipment.deliveredAt, done: true });
  }

  return [created, ...transitions, ...shipmentEntries];
}

export type StatusSlice = { key: OrderStatusKey; label: string; tone: Exclude<BadgeTone, 'brand'>; count: number };

export type OrderListResult = { orders: AdminOrder[]; total: number; counts: StatusSlice[] };

/**
 * Liste des commandes, avec filtre par statut de lecture et recherche texte.
 *
 * Le statut de lecture n'existe pas côté API (voir plus haut) : le filtrer
 * demande donc de récupérer un lot assez large puis de filtrer ici, plutôt
 * que de passer un `status` technique qui ne correspondrait pas à l'onglet
 * cliqué. Les compteurs des onglets viennent d'un même appel non filtré.
 */
export async function listOrders(
  session: SessionData,
  filters: { status?: OrderStatusKey; search?: string },
): Promise<OrderListResult> {
  const params = new URLSearchParams({ perPage: '100' });
  if (filters.search) params.set('search', filters.search);

  const page = await apiFetch<{ items: ApiOrder[]; meta: { total: number } }>(
    session,
    `/admin/orders?${params}`,
  );

  const all = page.items.map(toOrder);
  const counts = (Object.keys(ORDER_STATUSES) as OrderStatusKey[]).map((key) => ({
    key,
    label: ORDER_STATUSES[key].short,
    tone: ORDER_STATUSES[key].tone,
    count: all.filter((order) => order.status === key).length,
  }));

  return {
    orders: filters.status ? all.filter((order) => order.status === filters.status) : all,
    total: page.meta.total,
    counts,
  };
}

/** Commandes ayant consommé un lot donné — ce qui rend un rappel produit ciblable. */
export async function listOrdersByLot(session: SessionData, lotNumber: string): Promise<AdminOrder[]> {
  const page = await apiFetch<{ items: ApiOrder[] }>(
    session,
    `/admin/orders?${new URLSearchParams({ lotNumber, perPage: '100' })}`,
  );
  return page.items.map(toOrder);
}

/**
 * Fiche complète d'une commande, retrouvée par son numéro.
 *
 * L'API n'expose la fiche que par identifiant technique (`/admin/orders/:id`),
 * jamais par numéro — c'est `/admin/orders?search=` (déjà utilisé par la
 * liste) qui fait la résolution, en un aller-retour supplémentaire.
 */
export async function getOrderDetail(
  session: SessionData,
  number: string,
): Promise<{ order: AdminOrder; totals: OrderTotals; timeline: TimelineEntry[]; shippingAddress: ApiAddress | null } | null> {
  const page = await apiFetch<{ items: ApiOrder[] }>(
    session,
    `/admin/orders?${new URLSearchParams({ search: number, perPage: '5' })}`,
  );
  const match = page.items.find((order) => order.number === number);
  if (!match) return null;

  const detail = await apiFetch<ApiOrder>(session, `/admin/orders/${match.id}`);

  return {
    order: toOrder(detail),
    totals: orderTotals(detail),
    timeline: orderTimeline(detail),
    shippingAddress: detail.addresses?.find((address) => address.type === 'SHIPPING') ?? null,
  };
}

/**
 * Vente par téléphone ou au comptoir.
 *
 * Emprunte le même chemin qu'une commande en ligne côté API — panier invité
 * reconstitué en coulisses, mode de livraison choisi automatiquement (le
 * moins cher éligible), paiement `MANUAL`. `idempotencyKey` doit rester
 * stable sur les nouvelles tentatives d'un même envoi : un double-clic ne
 * doit pas créer deux commandes.
 */
export async function createManualOrder(
  session: SessionData,
  idempotencyKey: string,
  input: {
    email: string;
    firstName: string;
    lastName: string;
    line1: string;
    postalCode: string;
    city: string;
    countryCode: string;
    sku: string;
    quantity: number;
    customerNote?: string;
  },
): Promise<{ number: string }> {
  const result = await apiFetch<{ order: { number: string } }>(session, '/admin/checkout/manual-order', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(input),
  });

  return { number: result.order.number };
}
