import { cache } from 'react';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, openSession, type SessionData } from './session';

/**
 * Session courante, dédupliquée par requête.
 *
 * `cache()` évite qu'une page et son layout, qui lisent chacun la session,
 * déclenchent deux vérifications de signature HMAC pour le même rendu.
 */
export const getSession = cache(async (): Promise<SessionData | null> => {
  const store = await cookies();
  return openSession(store.get(SESSION_COOKIE)?.value);
});
