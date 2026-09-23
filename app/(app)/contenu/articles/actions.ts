'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import {
  PUBLISH_STATUSES,
  createPost as createPostApi,
  deletePost as deletePostApi,
  updatePost as updatePostApi,
  type PostInput,
  type PublishStatus,
} from '@/lib/data/content';
import { type FormState, optional, readValues, required } from '@/lib/form';

function read(data: FormData): { input?: PostInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

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
  if (!body) errors.body = 'Un article vide n’a rien à publier.';

  const seoDescription = optional(data, 'seoDescription');
  if (seoDescription && seoDescription.length > 160) {
    errors.seoDescription = '160 caractères au maximum.';
  }

  if (Object.keys(errors).length > 0) return { errors };

  /* Les étiquettes arrivent en une seule ligne séparée par des virgules :
     c'est la saisie la plus rapide, et un champ par étiquette obligerait à
     gérer l'ajout et le retrait de lignes pour un gain nul. */
  const tags = (optional(data, 'tags') ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    errors,
    input: {
      title,
      slug,
      excerpt: optional(data, 'excerpt'),
      body,
      status,
      authorName: optional(data, 'authorName'),
      tags,
      seoTitle: optional(data, 'seoTitle'),
      seoDescription,
    },
  };
}

function refresh(id?: string) {
  revalidatePath('/contenu/articles');
  if (id) revalidatePath(`/contenu/articles/${id}`);
}

export async function createPost(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const { input, errors } = read(data);

  if (!input) return { status: 'invalid', message: 'Corrigez les champs signalés.', errors, values };

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await createPostApi(session, input);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  refresh();
  return { status: 'saved', message: `« ${input.title} » créé.` };
}

export async function updatePost(
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
    await updatePostApi(session, id, input);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  refresh(id);
  return { status: 'saved', message: `« ${input.title} » enregistré.` };
}

export async function deletePost(
  id: string,
  _previous: FormState,
  _data: FormData,
): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await deletePostApi(session, id);
  } catch (error) {
    const message =
      error instanceof ApiError
        ? `Suppression refusée : ${error.message}`
        : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {} };
  }

  refresh();
  redirect('/contenu/articles');
}
