'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import {
  createCategory as createCategoryApi,
  deleteCategory as deleteCategoryApi,
  updateCategory as updateCategoryApi,
  type CategoryInput,
} from '@/lib/data/catalog';
import { type FormState, checked, optional, readValues, required } from '@/lib/form';

/**
 * Validation commune à la création et à la modification.
 *
 * Le slug est contraint ici et pas seulement côté API : il finit dans l'URL
 * publique d'un rayon, et laisser passer une majuscule ou un espace donnerait
 * `/rayons/Mobilier%20de%20Jardin`.
 */
function read(data: FormData): { input?: CategoryInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const name = required(data, 'name');
  if (!name) errors.name = 'Le nom est obligatoire.';
  else if (name.length > 255) errors.name = '255 caractères au maximum.';

  const slug = optional(data, 'slug');
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    errors.slug = 'Minuscules, chiffres et tirets uniquement.';
  }

  const positionRaw = optional(data, 'position');
  const position = positionRaw === undefined ? undefined : Number(positionRaw);
  if (position !== undefined && !Number.isInteger(position)) {
    errors.position = 'Un nombre entier, ou rien.';
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    input: {
      name,
      slug,
      parentId: optional(data, 'parentId'),
      isActive: checked(data, 'isActive'),
      showInMenu: checked(data, 'showInMenu'),
      position,
    },
  };
}

export async function createCategory(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const { input, errors } = read(data);

  if (!input) {
    return { status: 'invalid', message: 'Corrigez les champs signalés.', errors, values };
  }

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await createCategoryApi(session, input);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  revalidatePath('/catalogue/categories');
  // La création débloque le sélecteur du formulaire produit : sans cette ligne,
  // la catégorie tout juste créée reste absente de la liste déroulante.
  revalidatePath('/produits/nouveau');

  return { status: 'saved', message: `« ${input.name} » créée.` };
}

export async function updateCategory(
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
    await updateCategoryApi(session, id, input);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  revalidatePath('/catalogue/categories');
  revalidatePath(`/catalogue/categories/${id}`);
  revalidatePath('/produits/nouveau');

  return { status: 'saved', message: `« ${input.name} » enregistrée.` };
}

/**
 * Suppression.
 *
 * L'API refuse de supprimer une catégorie qui porte des produits ou des
 * sous-catégories — c'est une contrainte de clé étrangère, pas une règle
 * métier du back-office. Son message est donc remonté tel quel : il dit
 * précisément ce qui s'y oppose.
 */
export async function deleteCategory(
  id: string,
  _previous: FormState,
  _data: FormData,
): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await deleteCategoryApi(session, id);
  } catch (error) {
    const message =
      error instanceof ApiError
        ? `Suppression refusée : ${error.message}`
        : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {} };
  }

  revalidatePath('/catalogue/categories');
  revalidatePath('/produits/nouveau');
  redirect('/catalogue/categories');
}
