'use server';

import { type FormState, readValues, required, unavailable } from '@/lib/form';

/**
 * Réglages de l'enseigne.
 *
 * Seule cette section du formulaire est éditable : le régime de taxe par
 * pays, les modes de livraison et les prestataires branchés sont des faits
 * d'infrastructure, pas des préférences — les afficher à côté d'un bouton
 * « Enregistrer » qui ne les concerne pas serait trompeur, ce pour quoi ils
 * restent en lecture seule ailleurs sur cette page.
 */
export async function saveStoreSettings(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const errors: Record<string, string> = {};

  const name = required(data, 'storeName');
  if (!name) errors.storeName = 'Le nom de l’enseigne est obligatoire.';

  const email = required(data, 'contactEmail');
  if (!email) errors.contactEmail = 'L’adresse de contact est obligatoire.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.contactEmail = 'Adresse invalide.';

  if (Object.keys(errors).length > 0) {
    return { status: 'invalid', message: 'Corrigez les champs signalés avant de continuer.', errors, values };
  }

  return unavailable('L’enseigne');
}
