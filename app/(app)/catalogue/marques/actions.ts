'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import {
  createBrand as createBrandApi,
  deleteBrand as deleteBrandApi,
  updateBrand as updateBrandApi,
  type BrandInput,
} from '@/lib/data/catalog';
import { type FormState, checked, optional, readValues, required } from '@/lib/form';

function read(data: FormData): { input?: BrandInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const name = required(data, 'name');
  if (!name) errors.name = 'Le nom est obligatoire.';
  else if (name.length > 120) errors.name = '120 caractères au maximum.';

  const slug = optional(data, 'slug');
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    errors.slug = 'Minuscules, chiffres et tirets uniquement.';
  }

  /* Le site est exigé complet, protocole compris. Un `marque.fr` saisi seul
     produirait un lien relatif que le navigateur résoudrait dans le domaine du
     back-office. */
  const website = optional(data, 'website');
  if (website && !/^https?:\/\/.+/.test(website)) {
    errors.website = 'Adresse complète attendue, en commençant par https://';
  }

  if (Object.keys(errors).length > 0) return { errors };

  return { errors, input: { name, slug, website, isActive: checked(data, 'isActive') } };
}

export async function createBrand(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const { input, errors } = read(data);

  if (!input) {
    return { status: 'invalid', message: 'Corrigez les champs signalés.', errors, values };
  }

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await createBrandApi(session, input);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  revalidatePath('/catalogue/marques');

  return { status: 'saved', message: `« ${input.name} » créée.` };
}

export async function updateBrand(
  id: string,
  _previous: FormState,
  data: FormData,
): Promise<FormState> {
  const values = readValues(data);
  const { input, errors } = read(data);

  if (!input) {
    return { status: 'invalid', message: 'Corrigez les champs signalés.', errors, values };
  }

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await updateBrandApi(session, id, input);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  revalidatePath('/catalogue/marques');
  revalidatePath(`/catalogue/marques/${id}`);

  return { status: 'saved', message: `« ${input.name} » enregistrée.` };
}

export async function deleteBrand(
  id: string,
  _previous: FormState,
  _data: FormData,
): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await deleteBrandApi(session, id);
  } catch (error) {
    const message =
      error instanceof ApiError
        ? `Suppression refusée : ${error.message}`
        : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {} };
  }

  revalidatePath('/catalogue/marques');
  redirect('/catalogue/marques');
}
