'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import { adjustStock as adjustStockApi, type StockMovementType } from '@/lib/data/stock';
import { type FormState, readValues, required, toSignedQuantity } from '@/lib/form';

const REASON_TYPES: Record<string, StockMovementType> = {
  'Inventaire physique': 'ADJUSTMENT',
  'Casse ou produit périmé': 'LOSS',
  'Retour non conforme': 'RETURN',
  'Correction d’erreur de saisie': 'ADJUSTMENT',
};

/**
 * Ajustement manuel du stock physique.
 *
 * Un motif est obligatoire : contrairement à une vente, un ajustement manuel
 * n'a pas d'autre trace de pourquoi le nombre a changé — casse, inventaire,
 * retour non conforme. Sans motif, une différence constatée six mois plus
 * tard est impossible à expliquer.
 */
export async function adjustStock(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const errors: Record<string, string> = {};

  const variantId = required(data, 'variantId');
  const locationId = required(data, 'locationId');
  if (!variantId || !locationId) errors.sku = 'Choisissez une référence.';

  const quantityRaw = required(data, 'quantity');
  const quantity = toSignedQuantity(quantityRaw);
  if (!quantityRaw) errors.quantity = 'La quantité à ajouter ou retirer est obligatoire.';
  else if (quantity === null) errors.quantity = 'Quantité invalide — zéro n’est pas un ajustement.';

  const reason = required(data, 'reason');
  if (!reason) errors.reason = 'Le motif est obligatoire — il fait foi en cas d’écart constaté plus tard.';

  if (Object.keys(errors).length > 0) {
    return { status: 'invalid', message: 'Corrigez les champs signalés avant de continuer.', errors, values };
  }

  const session = await getSession();
  if (!session) redirect('/connexion');

  const note = required(data, 'note');

  try {
    await adjustStockApi(session, {
      variantId,
      locationId,
      quantity: quantity as number,
      type: REASON_TYPES[reason] ?? 'ADJUSTMENT',
      reason: note ? `${reason} — ${note}` : reason,
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  revalidatePath('/stock');
  revalidatePath('/stock/ajuster');

  return { status: 'saved', message: 'Ajustement enregistré.' };
}
