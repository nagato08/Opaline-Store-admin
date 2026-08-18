import { apiFetch, ApiError } from '@/lib/api';
import type { SessionData } from '@/lib/session';
import {
  deriveStatusKey,
  type ApiFulfillmentStatus,
  type ApiOrderStatus,
  type ApiPaymentStatus,
  type OrderStatusKey,
} from './orders';

/**
 * Vue « clients », branchée sur `GET /admin/customers` et `/admin/customers/:email`.
 *
 * Une commande peut être passée sans compte : la clientèle ne se résume donc
 * pas à la table `User`, et le courriel — présent sur toute commande — sert
 * de clé plutôt que l'identifiant de compte.
 */

export type CustomerKind = 'account' | 'guest';

export const CUSTOMER_KINDS: Record<CustomerKind, { label: string; slug: string }> = {
  account: { label: 'Avec compte', slug: 'compte' },
  guest: { label: 'Sans compte', slug: 'invite' },
};

export function toCustomerKind(value: string | string[] | undefined): CustomerKind | undefined {
  if (typeof value !== 'string') return undefined;
  return (Object.keys(CUSTOMER_KINDS) as CustomerKind[]).find((key) => CUSTOMER_KINDS[key].slug === value);
}

type ApiCustomerSummary = {
  kind: CustomerKind;
  userId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  orderCount: number;
  spentCents: number;
  lastOrderAt: string | null;
};

type ApiAddress = {
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  postalCode: string;
  city: string;
  countryCode: string;
  isDefaultShipping?: boolean;
};

type ApiConsent = {
  type: 'COOKIES_ANALYTICS' | 'COOKIES_MARKETING' | 'NEWSLETTER' | 'TERMS';
  isGranted: boolean;
  createdAt: string;
};

type ApiCustomerOrder = {
  id: string;
  number: string;
  status: ApiOrderStatus;
  paymentStatus: ApiPaymentStatus;
  fulfillmentStatus: ApiFulfillmentStatus;
  totalCents: number;
  currencyCode: string;
  pricesIncludeTax: boolean;
  createdAt: string;
  addresses: ApiAddress[];
};

type ApiCustomerDetail = {
  kind: CustomerKind;
  email: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    addresses: ApiAddress[];
    consents: ApiConsent[];
    loyaltyAccount: { points: number; tier: string } | null;
  } | null;
  orders: ApiCustomerOrder[];
  stats: { orderCount: number; spentCents: number; lastOrderAt: string | null };
};

export type Customer = {
  kind: CustomerKind;
  email: string;
  name: string;
  orderCount: number;
  spentCents: number;
  lastOrderAt: string | null;
};

export type CustomerOrder = {
  number: string;
  status: OrderStatusKey;
  totalCents: number;
  currencyCode: string;
  pricesIncludeTax: boolean;
  placedAt: string;
};

export type CustomerDetail = Customer & {
  address: ApiAddress | null;
  averageCents: number;
  loyaltyPoints: number;
  consents: { newsletter: boolean; marketingCookies: boolean };
  orders: CustomerOrder[];
};

function customerName(summary: Pick<ApiCustomerSummary, 'firstName' | 'lastName' | 'email'>): string {
  const name = [summary.firstName, summary.lastName].filter(Boolean).join(' ');
  return name || summary.email;
}

export type CustomerListResult = { customers: Customer[]; total: number };

export async function listCustomers(
  session: SessionData,
  filters: { kind?: CustomerKind; search?: string },
): Promise<CustomerListResult> {
  const params = new URLSearchParams({ perPage: '100' });
  if (filters.kind) params.set('kind', filters.kind);
  if (filters.search) params.set('search', filters.search);

  const page = await apiFetch<{ items: ApiCustomerSummary[]; meta: { total: number } }>(
    session,
    `/admin/customers?${params}`,
  );

  return {
    customers: page.items.map((item) => ({
      kind: item.kind,
      email: item.email,
      name: customerName(item),
      orderCount: item.orderCount,
      spentCents: item.spentCents,
      lastOrderAt: item.lastOrderAt,
    })),
    total: page.meta.total,
  };
}

/** Fiche client ; `null` si le courriel ne correspond à aucune commande ni compte. */
export async function getCustomer(session: SessionData, email: string): Promise<CustomerDetail | null> {
  let detail: ApiCustomerDetail;

  try {
    detail = await apiFetch<ApiCustomerDetail>(session, `/admin/customers/${encodeURIComponent(email)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }

  const latestConsent = (type: ApiConsent['type']) =>
    detail.user?.consents.find((consent) => consent.type === type)?.isGranted ?? false;

  const address =
    detail.user?.addresses.find((candidate) => candidate.isDefaultShipping) ??
    detail.user?.addresses[0] ??
    detail.orders[0]?.addresses[0] ??
    null;

  return {
    kind: detail.kind,
    email: detail.email,
    name: customerName({ firstName: detail.user?.firstName ?? null, lastName: detail.user?.lastName ?? null, email: detail.email }),
    orderCount: detail.stats.orderCount,
    spentCents: detail.stats.spentCents,
    lastOrderAt: detail.stats.lastOrderAt,
    averageCents: detail.stats.orderCount ? Math.round(detail.stats.spentCents / detail.stats.orderCount) : 0,
    loyaltyPoints: detail.user?.loyaltyAccount?.points ?? 0,
    consents: {
      newsletter: latestConsent('NEWSLETTER'),
      marketingCookies: latestConsent('COOKIES_MARKETING'),
    },
    address,
    orders: detail.orders.map((order) => ({
      number: order.number,
      status: deriveStatusKey(order),
      totalCents: order.totalCents,
      currencyCode: order.currencyCode,
      pricesIncludeTax: order.pricesIncludeTax,
      placedAt: order.createdAt,
    })),
  };
}
