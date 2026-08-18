'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import { STATUS_MAP_REVERSE, updateProduct as updateProductApi, updateVariantPrice, type ProductStatus } from '@/lib/data/products';
import { type FormState, readValues, required, toCents } from '@/lib/form';

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
  const ecoTaxCents = ecoTaxRaw ? toCents(ecoTaxRaw) : 0;
  if (ecoTaxRaw && ecoTaxCents === null) errors.ecoTax = 'Montant d’éco-participation invalide.';

  const status = required(data, 'status') as ProductStatus;
  if (!status || !(status in STATUS_MAP_REVERSE)) errors.status = 'Choisissez un état.';

  if (Object.keys(errors).length > 0) {
    return { status: 'invalid', message: 'Corrigez les champs signalés avant de continuer.', errors, values };
  }

  const productId = required(data, 'productId');
  const variantId = required(data, 'variantId');
  const slug = required(data, 'slug');

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await updateProductApi(session, productId, {
      name,
      slug,
      status,
      ecoTaxCents: ecoTaxCents ?? 0,
    });

    if (variantId) {
      await updateVariantPrice(session, productId, variantId, priceCents as number);
    }
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  const sku = required(data, 'sku');
  revalidatePath('/produits');
  if (sku) revalidatePath(`/produits/${encodeURIComponent(sku)}`);

  return { status: 'saved', message: `« ${name} » enregistré.` };
}
