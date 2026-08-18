'use server';

import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSession } from '@/lib/current-session';
import { createCampaign as createCampaignApi, type Audience, type Placement, type Trigger } from '@/lib/data/campaigns';
import { type FormState, readValues, required } from '@/lib/form';

export async function createCampaign(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const errors: Record<string, string> = {};

  const name = required(data, 'name');
  if (!name) errors.name = 'Le nom de la campagne est obligatoire.';

  const placement = required(data, 'placement');
  if (!placement) errors.placement = 'Choisissez un emplacement.';

  const trigger = required(data, 'trigger');
  if (!trigger) errors.trigger = 'Choisissez un déclenchement.';

  const audience = required(data, 'audience');
  if (!audience) errors.audience = 'Choisissez une audience.';

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
    await createCampaignApi(session, {
      name,
      placement: placement as Placement,
      trigger: trigger as Trigger,
      audience: audience as Audience,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Erreur inattendue. Réessayez.';
    return { status: 'invalid', message, errors: {}, values };
  }

  redirect('/campagnes');
}
