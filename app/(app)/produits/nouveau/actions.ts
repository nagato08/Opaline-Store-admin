'use server';

import { type FormState, readValues, required, toCents, unavailable } from '@/lib/form';

/**
 * Création d'un produit.
 *
 * La validation est réelle — champs requis, prix positif — même si l'écriture
 * ne l'est pas encore : un formulaire qui accepte n'importe quoi parce que
 * « de toute façon ça ne sauvegarde pas » habituerait à mal saisir, et le jour
 * où l'API répond, les mauvaises habitudes suivent.
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

  const category = required(data, 'category');
  if (!category) errors.category = 'Choisissez une catégorie.';

  const priceRaw = required(data, 'price');
  const priceCents = toCents(priceRaw);
  if (priceRaw && priceCents === null) errors.price = 'Prix invalide.';
  else if (priceCents === 0) errors.price = 'Le prix doit être supérieur à zéro.';
  else if (!priceRaw) errors.price = 'Le prix est obligatoire.';

  const ecoTaxRaw = data.get('ecoTax') as string;
  if (ecoTaxRaw && toCents(ecoTaxRaw) === null) {
    errors.ecoTax = 'Montant d’éco-participation invalide.';
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: 'invalid',
      message: 'Corrigez les champs signalés avant de continuer.',
      errors,
      values,
    };
  }

  return unavailable(`« ${name} »`);
}
