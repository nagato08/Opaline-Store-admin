'use server';

import { type FormState, readValues, required, toQuantity, unavailable } from '@/lib/form';

/**
 * Commande créée à la main.
 *
 * C'est le cas d'une vente par téléphone ou au comptoir : le back-office
 * saisit pour un client qui n'est pas devant un navigateur. Elle emprunte le
 * même chemin qu'une commande en ligne une fois créée — même figeage du prix,
 * même réservation de stock sous verrou —, seule l'origine de la saisie
 * change.
 */
export async function createOrder(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const errors: Record<string, string> = {};

  const email = required(data, 'email');
  if (!email) errors.email = 'Le courriel du client est obligatoire.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Courriel invalide.';

  const sku = required(data, 'sku');
  if (!sku) errors.sku = 'Choisissez une référence.';

  const quantityRaw = required(data, 'quantity');
  const quantity = toQuantity(quantityRaw);
  if (!quantityRaw) errors.quantity = 'La quantité est obligatoire.';
  else if (quantity === null || quantity <= 0) errors.quantity = 'Quantité invalide.';

  const shipping = required(data, 'shipping');
  if (!shipping) errors.shipping = 'Choisissez un mode de livraison.';

  if (Object.keys(errors).length > 0) {
    return { status: 'invalid', message: 'Corrigez les champs signalés avant de continuer.', errors, values };
  }

  return unavailable(`La commande pour ${email}`);
}
