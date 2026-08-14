'use server';

import { type FormState, readValues, required, unavailable } from '@/lib/form';

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

  const value = required(data, 'value');
  if (!value) errors.value = 'Décrivez la remise, par exemple « −15 % » ou « −5 € dès 40 € ».';

  const scope = required(data, 'scope');
  if (!scope) errors.scope = 'Précisez ce à quoi s’applique la remise.';

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

  return unavailable(`La promotion « ${name} »`);
}
