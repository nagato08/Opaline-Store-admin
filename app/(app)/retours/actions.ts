'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import { approveReturn, receiveReturn, rejectReturn } from '@/lib/data/engagement';
import { type FormState, checked, optional, readValues, toCents } from '@/lib/form';

function refresh(id: string) {
  revalidatePath('/retours');
  revalidatePath(`/retours/${id}`);
}

function failure(error: unknown, fallback: string): FormState {
  return {
    status: 'invalid',
    message: error instanceof ApiError ? error.message : fallback,
    errors: {},
  };
}

/**
 * Acceptation ou refus d'une demande.
 *
 * Le commentaire est facultatif côté API mais fortement encouragé sur un
 * refus : c'est le seul message que le client recevra pour comprendre.
 */
export async function decide(
  id: string,
  _previous: FormState,
  data: FormData,
): Promise<FormState> {
  /* La décision vient du bouton cliqué, pas d'un champ séparé : les deux
     issues partagent le même commentaire, et un sélecteur « accepter /
     refuser » suivi d'un bouton « valider » ferait deux gestes là où la
     décision est binaire. */
  const accept = data.get('decision') === 'approve';

  const session = await getSession();
  if (!session) redirect('/connexion');

  const comment = optional(data, 'adminComment');

  try {
    if (accept) await approveReturn(session, id, comment);
    else await rejectReturn(session, id, comment);
  } catch (error) {
    return failure(error, 'Décision refusée. Réessayez.');
  }

  refresh(id);
  return { status: 'saved', message: accept ? 'Retour accepté.' : 'Retour refusé.' };
}

/**
 * Réception du colis.
 *
 * Deux décisions distinctes en un geste : remettre ou non les articles en
 * vente, et combien rembourser. Le montant laissé vide rembourse la valeur des
 * articles retournés, ce qui est le cas courant — le champ n'existe que pour
 * les cas où il ne l'est pas, frais de retour déduits par exemple.
 */
export async function receive(
  id: string,
  _previous: FormState,
  data: FormData,
): Promise<FormState> {
  const values = readValues(data);
  const amountRaw = optional(data, 'refundAmount');
  const refundAmountCents = amountRaw === undefined ? undefined : toCents(amountRaw);

  if (amountRaw !== undefined && refundAmountCents === null) {
    return {
      status: 'invalid',
      message: 'Corrigez le montant.',
      errors: { refundAmount: 'Montant invalide.' },
      values,
    };
  }

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await receiveReturn(session, id, {
      adminComment: optional(data, 'adminComment'),
      restock: checked(data, 'restock'),
      refundAmountCents: refundAmountCents ?? undefined,
    });
  } catch (error) {
    return failure(error, 'Réception refusée. Réessayez.');
  }

  refresh(id);
  return { status: 'saved', message: 'Retour reçu et remboursé.' };
}
