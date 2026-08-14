'use server';

import { type FormState, readValues, required, toQuantity, unavailable } from '@/lib/form';

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

  const sku = required(data, 'sku');
  if (!sku) errors.sku = 'Choisissez une référence.';

  const quantityRaw = required(data, 'quantity');
  const quantity = toQuantity(quantityRaw);
  if (!quantityRaw) errors.quantity = 'La nouvelle quantité physique est obligatoire.';
  else if (quantity === null) errors.quantity = 'Quantité invalide.';

  const reason = required(data, 'reason');
  if (!reason) errors.reason = 'Le motif est obligatoire — il fait foi en cas d’écart constaté plus tard.';

  if (Object.keys(errors).length > 0) {
    return { status: 'invalid', message: 'Corrigez les champs signalés avant de continuer.', errors, values };
  }

  return unavailable(`L’ajustement de ${sku}`);
}
