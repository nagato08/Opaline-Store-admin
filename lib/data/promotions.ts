import { apiFetch } from '@/lib/api';
import type { SessionData } from '@/lib/session';

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
