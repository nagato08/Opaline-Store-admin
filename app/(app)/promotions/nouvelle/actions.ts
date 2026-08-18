'use server';

import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import { createPromotion as createPromotionApi, type DiscountKind } from '@/lib/data/promotions';
import { type FormState, readValues, required } from '@/lib/form';

export async function createPromotion(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const errors: Record<string, string> = {};

  const name = required(data, 'name');
  if (!name) errors.name = 'Le nom de la promotion est obligatoire.';

  const kind = required(data, 'kind');
  if (!kind) errors.kind = 'Choisissez si un code est requis.';

  const code = required(data, 'code');
  // Un code se saisit au panier ; sans lui la remise est automatique et n'a
  // donc pas besoin de code, mais l'inverse est une saisie incomplète.
  if (kind === 'code' && !code) errors.code = 'Le code est obligatoire pour ce type de promotion.';
  if (code && !/^[A-Z0-9]+$/.test(code)) errors.code = 'Majuscules et chiffres uniquement.';

  const discountKind = required(data, 'discountKind') as DiscountKind;
  const valueRaw = required(data, 'value');
  let value: number | undefined;

  if (discountKind !== 'shipping') {
    if (!valueRaw) errors.value = 'La valeur de la remise est obligatoire.';
    else {
      const parsed = Number(valueRaw.replace(',', '.'));
      if (!Number.isFinite(parsed) || parsed <= 0) errors.value = 'Valeur invalide.';
      else if (discountKind === 'percentage' && parsed > 100) errors.value = 'Un pourcentage ne dépasse pas 100.';
      else value = discountKind === 'percentage' ? Math.round(parsed) : Math.round(parsed * 100);
    }
  }

  const startsAt = required(data, 'startsAt');
  const endsAt = required(data, 'endsAt');
  if (!startsAt) errors.startsAt = 'La date de début est obligatoire.';
  if (!endsAt) errors.endsAt = 'La date de fin est obligatoire.';
  if (startsAt && endsAt && startsAt > endsAt) {
    errors.endsAt = 'La fin ne peut pas précéder le début.';
  }

  if (Object.keys(errors).length > 0) {
    return { status: 'invalid', message: 'Corrigez les champs signalés avant de continuer.', errors, values };
  }

  const session = await getSession();
  if (!session) redirect('/connexion');

  try {
    await createPromotionApi(session, {
      name,
      code: kind === 'code' ? code : undefined,
      isAutomatic: kind === 'automatic',
      discountKind,
      value,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  redirect('/promotions');
}
