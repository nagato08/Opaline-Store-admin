'use server';

import { type FormState, readValues, required, unavailable } from '@/lib/form';

export async function createCampaign(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const errors: Record<string, string> = {};

  const name = required(data, 'name');
  if (!name) errors.name = 'Le nom de la campagne est obligatoire.';

  const placement = required(data, 'placement');
  if (!placement) errors.placement = 'Choisissez un emplacement.';

  const trigger = required(data, 'trigger');
  if (!trigger) errors.trigger = 'Choisissez un déclenchement.';

  const targeting = required(data, 'targeting');
  if (!targeting) errors.targeting = 'Décrivez l’audience visée.';

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

  return unavailable(`La campagne « ${name} »`);
}
