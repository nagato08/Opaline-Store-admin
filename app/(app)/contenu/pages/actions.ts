'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import {
  PUBLISH_STATUSES,
  createPage as createPageApi,
  deletePage as deletePageApi,
  updatePage as updatePageApi,
  type PageInput,
  type PublishStatus,
} from '@/lib/data/content';
import { type FormState, optional, readValues, required } from '@/lib/form';

function read(data: FormData): { input?: PageInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  /* Le code identifie la page pour le code du front (`mentions-legales`,
     `cgv`…) et ne change jamais : c'est lui qu'un lien en dur cite. */
  const code = required(data, 'code');
  if (!code) errors.code = 'Le code est obligatoire.';
  else if (!/^[a-z0-9-]+$/.test(code)) errors.code = 'Minuscules, chiffres et tirets uniquement.';
  else if (code.length > 60) errors.code = '60 caractères au maximum.';

  const title = required(data, 'title');
  if (!title) errors.title = 'Le titre est obligatoire.';
  else if (title.length > 200) errors.title = '200 caractères au maximum.';

  const slug = optional(data, 'slug');
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    errors.slug = 'Minuscules, chiffres et tirets uniquement.';
  }

  const status = required(data, 'status') as PublishStatus;
  if (!(status in PUBLISH_STATUSES)) errors.status = 'Choisissez un état.';

  const body = required(data, 'body');
  if (!body) errors.body = 'Une page vide n’a rien à afficher.';

  const seoDescription = optional(data, 'seoDescription');
  if (seoDescription && seoDescription.length > 160) {
    // Google tronque au-delà : la limite est dans l'API, autant l'annoncer ici.
    errors.seoDescription = '160 caractères au maximum.';
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    input: {
      code,
      title,
      slug,
      excerpt: optional(data, 'excerpt'),
      body,
      status,
      seoTitle: optional(data, 'seoTitle'),
      seoDescription,
    },
  };
}

function refresh(id?: string) {
  revalidatePath('/contenu/pages');
  if (id) revalidatePath(`/contenu/pages/${id}`);
}

export async function createPage(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const { input, errors } = read(data);

  if (!input) return { status: 'invalid', message: 'Corrigez les champs signalés.', errors, values };

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await createPageApi(session, input);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  refresh();
  return { status: 'saved', message: `« ${input.title} » créée.` };
}

export async function updatePage(
  id: string,
  _previous: FormState,
  data: FormData,
): Promise<FormState> {
  const values = readValues(data);
  const { input, errors } = read(data);

  if (!input) return { status: 'invalid', message: 'Corrigez les champs signalés.', errors, values };

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await updatePageApi(session, id, input);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  refresh(id);
  return { status: 'saved', message: `« ${input.title} » enregistrée.` };
}

export async function deletePage(
  id: string,
  _previous: FormState,
  _data: FormData,
): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await deletePageApi(session, id);
  } catch (error) {
    const message =
      error instanceof ApiError
        ? `Suppression refusée : ${error.message}`
        : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {} };
  }

  refresh();
  redirect('/contenu/pages');
}
