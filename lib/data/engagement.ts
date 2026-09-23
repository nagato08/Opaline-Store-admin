import { apiFetch } from '@/lib/api';
import type { SessionData } from '@/lib/session';
import type { BadgeTone } from '@/components/ui/badge';

/** Forme rendue par `paginate()` côté API : les totaux sont sous `meta`. */
type Paginated<T> = { items: T[]; meta: { total: number; page: number; totalPages: number } };

/**
 * Avis clients et demandes de retour.
 *
 * Deux files d'attente qui se ressemblent : quelque chose arrive du client, un
 * humain tranche. Elles ne se mélangent pas pour autant — un avis engage
 * l'image de la boutique, un retour engage son argent.
 */

// --- Avis --------------------------------------------------------------------

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export const REVIEW_STATUSES: Record<
  ReviewStatus,
  { label: string; tone: Exclude<BadgeTone, 'brand'>; slug: string }
> = {
  PENDING: { label: 'À modérer', tone: 'warning', slug: 'a-moderer' },
  APPROVED: { label: 'Publié', tone: 'success', slug: 'publie' },
  REJECTED: { label: 'Refusé', tone: 'danger', slug: 'refuse' },
};

export function toReviewStatus(value: string | string[] | undefined): ReviewStatus | undefined {
  if (typeof value !== 'string') return undefined;
  return (Object.keys(REVIEW_STATUSES) as ReviewStatus[]).find(
    (key) => REVIEW_STATUSES[key].slug === value,
  );
}

type ApiReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string | null;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  reply: string | null;
  createdAt: string;
  product: { translations: Array<{ locale: string; name: string; slug: string }> };
  user: { email: string; firstName: string | null } | null;
};

export type ReviewRow = {
  id: string;
  rating: number;
  title: string;
  body: string;
  author: string;
  email: string | null;
  productName: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  reply: string;
  createdAt: string;
};

function toReviewRow(review: ApiReview): ReviewRow {
  const translation =
    review.product.translations.find((row) => row.locale === 'FR') ?? review.product.translations[0];

  return {
    id: review.id,
    rating: review.rating,
    title: review.title ?? '',
    body: review.body ?? '',
    /* Un avis peut venir d'un visiteur sans compte : le nom saisi fait alors
       foi, et à défaut on se rabat sur le prénom du compte. Jamais l'adresse
       courriel — elle n'a pas à être publiée. */
    author: review.authorName ?? review.user?.firstName ?? 'Client',
    email: review.user?.email ?? null,
    productName: translation?.name ?? '—',
    status: review.status,
    isVerifiedPurchase: review.isVerifiedPurchase,
    reply: review.reply ?? '',
    createdAt: review.createdAt,
  };
}

export type ReviewListResult = {
  reviews: ReviewRow[];
  total: number;
  counts: Array<{ key: ReviewStatus; count: number }>;
};

/**
 * Les compteurs par état demandent un appel par état : l'API ne les agrège
 * pas. Trois requêtes légères valent mieux qu'un total faux, et l'onglet « à
 * modérer » est le seul qui compte vraiment au quotidien.
 */
export async function listReviews(
  session: SessionData,
  status?: ReviewStatus,
): Promise<ReviewListResult> {
  const params = new URLSearchParams({ perPage: '100' });
  if (status) params.set('status', status);

  /* Le total vit sous `meta`, pas à la racine : c'est la forme rendue par
     `paginate()` côté API pour toutes les listes paginées. */
  const [page, ...counts] = await Promise.all([
    apiFetch<Paginated<ApiReview>>(session, `/admin/reviews?${params}`),
    ...(Object.keys(REVIEW_STATUSES) as ReviewStatus[]).map((key) =>
      apiFetch<Paginated<unknown>>(session, `/admin/reviews?perPage=1&status=${key}`),
    ),
  ]);

  return {
    reviews: page.items.map(toReviewRow),
    total: page.meta.total,
    counts: (Object.keys(REVIEW_STATUSES) as ReviewStatus[]).map((key, index) => ({
      key,
      count: counts[index]?.meta.total ?? 0,
    })),
  };
}

export async function moderateReview(
  session: SessionData,
  id: string,
  status: ReviewStatus,
  reply?: string,
): Promise<void> {
  await apiFetch(session, `/admin/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(reply ? { reply } : {}) }),
  });
}

// --- Retours -----------------------------------------------------------------

export type ReturnStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export const RETURN_STATUSES: Record<
  ReturnStatus,
  { label: string; tone: Exclude<BadgeTone, 'brand'>; slug: string }
> = {
  REQUESTED: { label: 'À traiter', tone: 'warning', slug: 'a-traiter' },
  APPROVED: { label: 'Acceptée', tone: 'info', slug: 'acceptee' },
  REJECTED: { label: 'Refusée', tone: 'danger', slug: 'refusee' },
  IN_TRANSIT: { label: 'En transit', tone: 'info', slug: 'en-transit' },
  RECEIVED: { label: 'Reçue', tone: 'info', slug: 'recue' },
  COMPLETED: { label: 'Close', tone: 'success', slug: 'close' },
  CANCELLED: { label: 'Annulée', tone: 'neutral', slug: 'annulee' },
};

export function toReturnStatus(value: string | string[] | undefined): ReturnStatus | undefined {
  if (typeof value !== 'string') return undefined;
  return (Object.keys(RETURN_STATUSES) as ReturnStatus[]).find(
    (key) => RETURN_STATUSES[key].slug === value,
  );
}

type ApiReturnItem = {
  id: string;
  orderItemId: string;
  quantity: string;
  reason: string | null;
  condition: string | null;
  isRestocked: boolean;
};

type ApiReturn = {
  id: string;
  number: string;
  status: ReturnStatus;
  resolution: string;
  reason: string | null;
  customerComment: string | null;
  adminComment: string | null;
  createdAt: string;
  receivedAt: string | null;
  items: ApiReturnItem[];
  order: { number: string; email: string };
};

export type ReturnRow = {
  id: string;
  number: string;
  orderNumber: string;
  email: string;
  status: ReturnStatus;
  resolution: string;
  reason: string;
  customerComment: string;
  adminComment: string;
  itemCount: number;
  quantity: number;
  createdAt: string;
  items: Array<{ id: string; quantity: number; reason: string; condition: string; isRestocked: boolean }>;
};

function toReturnRow(request: ApiReturn): ReturnRow {
  return {
    id: request.id,
    number: request.number,
    orderNumber: request.order.number,
    email: request.order.email,
    status: request.status,
    resolution: request.resolution,
    reason: request.reason ?? '',
    customerComment: request.customerComment ?? '',
    adminComment: request.adminComment ?? '',
    itemCount: request.items.length,
    quantity: request.items.reduce((sum, item) => sum + Number(item.quantity), 0),
    createdAt: request.createdAt,
    items: request.items.map((item) => ({
      id: item.id,
      quantity: Number(item.quantity),
      reason: item.reason ?? '',
      condition: item.condition ?? '',
      isRestocked: item.isRestocked,
    })),
  };
}

export async function listReturns(
  session: SessionData,
  status?: ReturnStatus,
): Promise<{ returns: ReturnRow[]; total: number }> {
  const params = new URLSearchParams({ perPage: '100' });
  if (status) params.set('status', status);

  const page = await apiFetch<Paginated<ApiReturn>>(session, `/admin/returns?${params}`);

  return { returns: page.items.map(toReturnRow), total: page.meta.total };
}

export async function getReturn(session: SessionData, id: string): Promise<ReturnRow | null> {
  try {
    return toReturnRow(await apiFetch<ApiReturn>(session, `/admin/returns/${id}`));
  } catch {
    return null;
  }
}

export async function approveReturn(
  session: SessionData,
  id: string,
  adminComment?: string,
): Promise<void> {
  await apiFetch(session, `/admin/returns/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ adminComment: adminComment ?? '' }),
  });
}

export async function rejectReturn(
  session: SessionData,
  id: string,
  adminComment?: string,
): Promise<void> {
  await apiFetch(session, `/admin/returns/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ adminComment: adminComment ?? '' }),
  });
}

/**
 * Réception du colis : remise en stock optionnelle, puis remboursement.
 *
 * `restock` est un choix, pas une formalité — un article qui revient abîmé ne
 * doit pas retourner en vente. Le montant laissé vide rembourse la valeur des
 * articles retournés, ce qui est le cas courant.
 */
export async function receiveReturn(
  session: SessionData,
  id: string,
  input: { adminComment?: string; restock: boolean; refundAmountCents?: number },
): Promise<void> {
  await apiFetch(session, `/admin/returns/${id}/receive`, {
    method: 'POST',
    body: JSON.stringify({
      ...(input.adminComment ? { adminComment: input.adminComment } : {}),
      restock: input.restock,
      ...(input.refundAmountCents === undefined
        ? {}
        : { refundAmountCents: input.refundAmountCents }),
    }),
  });
}
