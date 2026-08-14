'use server';

import { type FormState, readValues, required, toCents, unavailable } from '@/lib/form';

export async function updateProduct(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const errors: Record<string, string> = {};

  const name = required(data, 'name');
  if (!name) errors.name = 'Le nom du produit est obligatoire.';

  const priceRaw = required(data, 'price');
  const priceCents = toCents(priceRaw);
  if (!priceRaw) errors.price = 'Le prix est obligatoire.';
  else if (priceCents === null) errors.price = 'Prix invalide.';
  else if (priceCents === 0) errors.price = 'Le prix doit être supérieur à zéro.';

  const ecoTaxRaw = data.get('ecoTax') as string;
  if (ecoTaxRaw && toCents(ecoTaxRaw) === null) errors.ecoTax = 'Montant d’éco-participation invalide.';

  const status = required(data, 'status');
  if (!status) errors.status = 'Choisissez un état.';

  if (Object.keys(errors).length > 0) {
    return { status: 'invalid', message: 'Corrigez les champs signalés avant de continuer.', errors, values };
  }

  return unavailable(`« ${name} »`);
}
