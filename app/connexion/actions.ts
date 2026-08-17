'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { login } from '@/lib/api';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sealSession,
  sessionCookieOptions,
} from '@/lib/session';
import { type FormState, readValues, required } from '@/lib/form';

export async function signIn(_previous: FormState, data: FormData): Promise<FormState> {
  const values = readValues(data);
  const email = required(data, 'email');
  const password = required(data, 'password');

  // Le mot de passe ne revient jamais dans l'état renvoyé au navigateur.
  delete values.password;

  const errors: Record<string, string> = {};
  if (!email) errors.email = 'Renseignez votre adresse.';
  if (!password) errors.password = 'Renseignez votre mot de passe.';

  if (Object.keys(errors).length > 0) {
    return { status: 'invalid', message: 'Complétez les champs manquants.', errors, values };
  }

  const outcome = await login(email, password);

  if (!outcome.ok) {
    /* Message unique sur identifiants inconnus et mot de passe faux : les
       distinguer permettrait d'énumérer les comptes existants. Le refus de
       rôle, lui, est explicite — la personne existe, elle sait déjà qui elle
       est, et un message vague la ferait recommencer en boucle. */
    const message =
      outcome.reason === 'forbidden'
        ? 'Ce compte existe mais n’a pas accès au back-office. Demandez à un administrateur de vous attribuer un rôle.'
        : outcome.reason === 'unreachable'
          ? 'L’API est injoignable pour le moment. Réessayez dans un instant.'
          : 'Adresse ou mot de passe incorrect.';

    return { status: 'invalid', message, values };
  }

  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    await sealSession(outcome.session),
    sessionCookieOptions(SESSION_MAX_AGE),
  );

  const suite = required(data, 'suite');

  // Seuls les chemins internes sont acceptés : accepter une URL absolue
  // ouvrirait une redirection ouverte, utilisable pour renvoyer un
  // administrateur fraîchement connecté vers un faux back-office.
  redirect(suite.startsWith('/') && !suite.startsWith('//') ? suite : '/tableau-de-bord');
}
