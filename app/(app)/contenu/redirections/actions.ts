'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import {
  createRedirect as createRedirectApi,
  deleteRedirect as deleteRedirectApi,
} from '@/lib/data/content';
import { type FormState, readValues, required } from '@/lib/form';

/** Les deux seuls codes qui ont un sens ici, et ils ne veulent pas dire la même chose. */
const CODES = [301, 302];

export async function createRedirect(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const errors: Record<string, string> = {};

  const fromPath = required(data, 'fromPath');
  const toPath = required(data, 'toPath');

  /* Les deux chemins doivent commencer par `/` : une adresse absolue enverrait
     les visiteurs hors de la boutique, ce qui n'est jamais ce qu'on veut d'une
     redirection interne. */
  if (!fromPath) errors.fromPath = 'L’ancienne adresse est obligatoire.';
  else if (!fromPath.startsWith('/')) errors.fromPath = 'Doit commencer par une barre oblique.';

  if (!toPath) errors.toPath = 'La nouvelle adresse est obligatoire.';
  else if (!toPath.startsWith('/')) errors.toPath = 'Doit commencer par une barre oblique.';

  if (fromPath && fromPath === toPath) {
    // Une redirection d'une adresse vers elle-même boucle indéfiniment.
    errors.toPath = 'Les deux adresses sont identiques : la redirection bouclerait.';
  }

  const statusCode = Number(required(data, 'statusCode'));
  if (!CODES.includes(statusCode)) errors.statusCode = 'Choisissez 301 ou 302.';

  if (Object.keys(errors).length > 0) {
    return { status: 'invalid', message: 'Corrigez les champs signalés.', errors, values };
  }

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await createRedirectApi(session, { fromPath, toPath, statusCode });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  revalidatePath('/contenu/redirections');
  return { status: 'saved', message: `${fromPath} redirige désormais vers ${toPath}.` };
}

export async function deleteRedirect(
  id: string,
  _previous: FormState,
  _data: FormData,
): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await deleteRedirectApi(session, id);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {} };
  }

  revalidatePath('/contenu/redirections');
  return { status: 'saved', message: 'Redirection supprimée.' };
}
