'use server';

import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import { createProduct as createProductApi } from '@/lib/data/products';
import { type FormState, readValues, required, toCents } from '@/lib/form';

/**
 * Création d'un produit.
 */
export async function createProduct(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const errors: Record<string, string> = {};

  const name = required(data, 'name');
  if (!name) errors.name = 'Le nom du produit est obligatoire.';

  const sku = required(data, 'sku');
  if (!sku) errors.sku = 'La référence (SKU) est obligatoire.';
  else if (!/^[A-Z0-9-]+$/.test(sku)) {
    errors.sku = 'Uniquement des majuscules, chiffres et tirets.';
  }

  const categoryId = required(data, 'categoryId');
  if (!categoryId) errors.categoryId = 'Choisissez une catégorie.';

  const priceRaw = required(data, 'price');
  const priceCents = toCents(priceRaw);
  if (priceRaw && priceCents === null) errors.price = 'Prix invalide.';
  else if (priceCents === 0) errors.price = 'Le prix doit être supérieur à zéro.';
  else if (!priceRaw) errors.price = 'Le prix est obligatoire.';

  const ecoTaxRaw = data.get('ecoTax') as string;
  const ecoTaxCents = ecoTaxRaw ? toCents(ecoTaxRaw) : 0;
  if (ecoTaxRaw && ecoTaxCents === null) {
    errors.ecoTax = 'Montant d’éco-participation invalide.';
  }

  const description = (data.get('description') as string | null)?.trim() ?? '';

  if (Object.keys(errors).length > 0) {
    return {
      status: 'invalid',
      message: 'Corrigez les champs signalés avant de continuer.',
      errors,
      values,
    };
  }

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await createProductApi(session, {
      name,
      sku,
      categoryId,
      description: description || undefined,
      priceCents: priceCents as number,
      ecoTaxCents: ecoTaxCents ?? 0,
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  redirect(`/produits/${encodeURIComponent(sku)}`);
}
