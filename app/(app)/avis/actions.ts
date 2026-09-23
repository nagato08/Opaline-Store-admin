'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import { REVIEW_STATUSES, moderateReview, type ReviewStatus } from '@/lib/data/engagement';
import { type FormState, optional, required } from '@/lib/form';

/**
 * Modération d'un avis.
 *
 * La réponse du commerçant part dans le même envoi que la décision : elle est
 * publiée sous l'avis, et l'écrire au moment où l'on tranche est le seul
 * moment où le contexte est frais.
 */
export async function moderate(
  id: string,
  _previous: FormState,
  data: FormData,
): Promise<FormState> {
  const status = required(data, 'status') as ReviewStatus;

  if (!(status in REVIEW_STATUSES)) {
    return { status: 'invalid', message: 'Décision inconnue.', errors: {} };
  }

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await moderateReview(session, id, status, optional(data, 'reply'));
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {} };
  }

  revalidatePath('/avis');

  return {
    status: 'saved',
    message: status === 'APPROVED' ? 'Avis publié.' : 'Avis refusé.',
  };
}
