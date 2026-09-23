'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import {
  ALLOWED_TRANSITIONS,
  API_STATUS_LABELS,
  markOrderPaid,
  refundOrder,
  shipOrder,
  transitionOrder,
  type ApiOrderStatus,
} from '@/lib/data/orders';
import { type FormState, optional, readValues, required, toCents, toQuantity } from '@/lib/form';

/**
 * Actions de traitement d'une commande.
 *
 * Les quatre gestes qui font passer une commande de « reçue » à « close » :
 * encaisser, avancer son état, rembourser, expédier. Chacun a sa route côté
 * API, et aucune n'était appelée — une commande arrivait dans le back-office
 * sans pouvoir en sortir.
 *
 * Tous rafraîchissent la fiche et la liste : un statut périmé affiché après
 * l'action ferait douter qu'elle ait eu lieu.
 */
function refresh(number: string) {
  revalidatePath('/commandes');
  revalidatePath(`/commandes/${encodeURIComponent(number)}`);
  revalidatePath('/tableau-de-bord');
}

/** Message d'erreur commun : celui de l'API d'abord, il est plus précis. */
function failure(error: unknown, fallback: string): FormState {
  return {
    status: 'invalid',
    message: error instanceof ApiError ? error.message : fallback,
    errors: {},
  };
}

export async function markPaid(
  orderId: string,
  number: string,
  _previous: FormState,
  _data: FormData,
): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await markOrderPaid(session, orderId);
  } catch (error) {
    return failure(error, 'Encaissement refusé. Réessayez.');
  }

  refresh(number);
  return { status: 'saved', message: 'Commande marquée comme payée.' };
}

export async function changeStatus(
  orderId: string,
  number: string,
  current: ApiOrderStatus,
  _previous: FormState,
  data: FormData,
): Promise<FormState> {
  const values = readValues(data);
  const status = required(data, 'status') as ApiOrderStatus;

  /* La transition est revalidée ici et pas seulement à l'affichage : le
     formulaire a pu être soumis depuis une page ouverte avant que la commande
     ne change d'état ailleurs. */
  if (!ALLOWED_TRANSITIONS[current]?.includes(status)) {
    return {
      status: 'invalid',
      message: `Transition impossible depuis « ${API_STATUS_LABELS[current]} ». La commande a peut-être changé d’état entre-temps — rechargez la fiche.`,
      errors: { status: 'État non atteignable.' },
      values,
    };
  }

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await transitionOrder(session, orderId, status, optional(data, 'reason'));
  } catch (error) {
    return failure(error, 'Changement d’état refusé. Réessayez.');
  }

  refresh(number);
  return { status: 'saved', message: `Commande passée en « ${API_STATUS_LABELS[status]} ».` };
}

export async function refund(
  orderId: string,
  number: string,
  refundableCents: number,
  _previous: FormState,
  data: FormData,
): Promise<FormState> {
  const values = readValues(data);
  const errors: Record<string, string> = {};

  const amountRaw = required(data, 'amount');
  const amountCents = toCents(amountRaw);

  if (!amountRaw) errors.amount = 'Le montant est obligatoire.';
  else if (amountCents === null) errors.amount = 'Montant invalide.';
  else if (amountCents === 0) errors.amount = 'Le montant doit être supérieur à zéro.';
  else if (amountCents > refundableCents) {
    // L'API le refuserait aussi, mais l'annoncer ici évite un aller-retour et
    // dit combien reste remboursable.
    errors.amount = `Au maximum ${(refundableCents / 100).toFixed(2)} € restent remboursables.`;
  }

  if (Object.keys(errors).length > 0) {
    return { status: 'invalid', message: 'Corrigez le montant.', errors, values };
  }

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await refundOrder(session, orderId, amountCents as number, optional(data, 'reason'));
  } catch (error) {
    return failure(error, 'Remboursement refusé. Réessayez.');
  }

  refresh(number);
  return { status: 'saved', message: 'Remboursement enregistré.' };
}

/**
 * Expédition.
 *
 * Le formulaire porte une quantité par ligne restant à expédier. Celles
 * laissées à zéro ne partent pas : une commande peut très bien voyager en
 * plusieurs colis, et l'API décrémente ligne par ligne.
 */
export async function ship(
  orderId: string,
  number: string,
  _previous: FormState,
  data: FormData,
): Promise<FormState> {
  const values = readValues(data);
  const errors: Record<string, string> = {};

  const itemIds = data.getAll('itemId').map((value) => String(value));
  const quantities = data.getAll('quantity').map((value) => String(value));

  const items: Array<{ orderItemId: string; quantity: number }> = [];

  for (const [index, itemId] of itemIds.entries()) {
    const raw = quantities[index] ?? '';
    if (raw.trim() === '') continue;

    const quantity = toQuantity(raw);
    if (quantity === null) {
      errors[`quantity-${index}`] = 'Quantité invalide.';
      continue;
    }
    if (quantity > 0) items.push({ orderItemId: itemId, quantity });
  }

  if (Object.keys(errors).length === 0 && items.length === 0) {
    errors.items = 'Indiquez au moins une quantité à expédier.';
  }

  if (Object.keys(errors).length > 0) {
    return { status: 'invalid', message: 'Corrigez les quantités.', errors, values };
  }

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await shipOrder(session, orderId, {
      carrierId: optional(data, 'carrierId'),
      trackingNumber: optional(data, 'trackingNumber'),
      items,
    });
  } catch (error) {
    return failure(error, 'Expédition refusée. Réessayez.');
  }

  refresh(number);
  return { status: 'saved', message: 'Expédition enregistrée.' };
}
