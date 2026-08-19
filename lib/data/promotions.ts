import { apiFetch } from '@/lib/api';
import type { SessionData } from '@/lib/session';
import { scheduleState, type ScheduleState } from './schedule';

/**
 * Création de promotion, branchée sur `POST /admin/promotions`.
 *
 * Le moteur de règles accepte des ciblages arbitraires (catégorie, marque,
 * groupe client…), mais ce formulaire n'en construit qu'un sous-ensemble
 * honnête : une remise sur le panier entier, en pourcentage ou en montant
 * fixe, ou la livraison offerte. Un ciblage plus fin (par catégorie) demande
 * un sélecteur dédié qui n'existe pas encore côté écran — plutôt que de
 * prétendre cibler « Mobilier » sans le faire, l'option n'est pas proposée.
 */

export type DiscountKind = 'percentage' | 'fixed' | 'shipping';

export async function createPromotion(
  session: SessionData,
  input: {
    name: string;
    code?: string;
    isAutomatic: boolean;
    discountKind: DiscountKind;
    /** Pourcentage entier (0–100) ou centimes, selon `discountKind`. */
    value?: number;
    startsAt: string;
    endsAt: string;
  },
): Promise<void> {
  const actions =
    input.discountKind === 'shipping'
      ? [{ type: 'FREE_SHIPPING' }]
      : [
          {
            type: input.discountKind === 'percentage' ? 'PERCENTAGE_OFF' : 'FIXED_OFF',
            value: input.value,
            appliesTo: 'CART',
          },
        ];

  await apiFetch(session, '/admin/promotions', {
    method: 'POST',
    body: JSON.stringify({
      code: input.code ?? (input.name.toUpperCase().replaceAll(/[^A-Z0-9]/g, '').slice(0, 40) || 'PROMO'),
      name: input.name,
      status: 'ACTIVE',
      isAutomatic: input.isAutomatic,
      actions,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    }),
  });
}

type ApiPromotionAction =
  | { type: 'PERCENTAGE_OFF'; value: number }
  | { type: 'FIXED_OFF'; value: number }
  | { type: 'FREE_SHIPPING' }
  | { type: 'BUY_X_GET_Y' };

type ApiPromotionScope = 'ITEM' | 'CART' | 'SHIPPING';

type ApiPromotion = {
  id: string;
  code: string;
  name: string;
  scope: ApiPromotionScope;
  isAutomatic: boolean;
  actions: ApiPromotionAction[];
  startsAt: string | null;
  endsAt: string | null;
  usageCount: number;
  usageLimit: number | null;
};

const SCOPE_LABELS: Record<ApiPromotionScope, string> = {
  CART: 'Panier entier',
  ITEM: 'Article ciblé',
  SHIPPING: 'Livraison',
};

function actionLabel(actions: ApiPromotionAction[]): string {
  const action = actions[0];
  if (!action) return '—';

  switch (action.type) {
    case 'PERCENTAGE_OFF':
      return `−${action.value} %`;
    case 'FIXED_OFF':
      return `−${(action.value / 100).toFixed(2)} €`;
    case 'FREE_SHIPPING':
      return 'Frais de port offerts';
    case 'BUY_X_GET_Y':
      return 'Articles offerts';
  }
}

export type Promotion = {
  id: string;
  name: string;
  code: string;
  isAutomatic: boolean;
  value: string;
  scope: string;
  uses: number;
  maxUses: number | null;
  startsAt: string | null;
  endsAt: string | null;
  state: ScheduleState;
};

export async function listPromotions(session: SessionData): Promise<Promotion[]> {
  const now = new Date();
  const page = await apiFetch<{ items: ApiPromotion[] }>(session, '/admin/promotions?perPage=100');

  return page.items.map((promotion) => ({
    id: promotion.id,
    name: promotion.name,
    code: promotion.code,
    isAutomatic: promotion.isAutomatic,
    value: actionLabel(promotion.actions),
    scope: SCOPE_LABELS[promotion.scope],
    uses: promotion.usageCount,
    maxUses: promotion.usageLimit,
    startsAt: promotion.startsAt,
    endsAt: promotion.endsAt,
    state: scheduleState(promotion.startsAt, promotion.endsAt, now),
  }));
}
