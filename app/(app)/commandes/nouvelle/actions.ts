'use server';

import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import { createManualOrder } from '@/lib/data/orders';
import { type FormState, readValues, required, toQuantity } from '@/lib/form';

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

  const firstName = required(data, 'firstName');
  if (!firstName) errors.firstName = 'Le prénom est obligatoire.';

  const lastName = required(data, 'lastName');
  if (!lastName) errors.lastName = 'Le nom est obligatoire.';

  const line1 = required(data, 'line1');
  if (!line1) errors.line1 = 'L’adresse est obligatoire.';

  const postalCode = required(data, 'postalCode');
  if (!postalCode) errors.postalCode = 'Le code postal est obligatoire.';

  const city = required(data, 'city');
  if (!city) errors.city = 'La ville est obligatoire.';

  const countryCode = required(data, 'countryCode');
  if (!countryCode) errors.countryCode = 'Choisissez un pays.';

  const sku = required(data, 'sku');
  if (!sku) errors.sku = 'Choisissez une référence.';

  const quantityRaw = required(data, 'quantity');
  const quantity = toQuantity(quantityRaw);
  if (!quantityRaw) errors.quantity = 'La quantité est obligatoire.';
  else if (quantity === null || quantity <= 0) errors.quantity = 'Quantité invalide.';

  if (Object.keys(errors).length > 0) {
    return { status: 'invalid', message: 'Corrigez les champs signalés avant de continuer.', errors, values };
  }

  const session = await getSession();
  if (!session) redirect('/connexion');

  const idempotencyKey = required(data, 'idempotencyKey') || crypto.randomUUID();
  const customerNote = required(data, 'customerNote');

  let number: string;

  try {
    const result = await createManualOrder(session, idempotencyKey, {
      email,
      firstName,
      lastName,
      line1,
      postalCode,
      city,
      countryCode,
      sku,
      quantity: quantity as number,
      customerNote: customerNote || undefined,
    });
    number = result.number;
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  redirect(`/commandes/${encodeURIComponent(number)}`);
}
