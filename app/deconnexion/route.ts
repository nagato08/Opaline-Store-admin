import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { revokeSession } from '@/lib/api';
import { SESSION_COOKIE, openSession } from '@/lib/session';

/**
 * Déconnexion.
 *
 * En `POST` et non en `GET` : un lien de déconnexion se déclenche tout seul
 * au préchargement d'un navigateur ou d'un antivirus, et déconnecte
 * l'utilisateur sans qu'il ait rien demandé.
 *
 * Le jeton est aussi révoqué côté API — se contenter d'effacer le cookie
 * local laisserait un jeton de renouvellement valable trente jours dans la
 * nature.
 */
export async function POST(request: NextRequest) {
  const store = await cookies();
  const session = await openSession(store.get(SESSION_COOKIE)?.value);

  if (session) await revokeSession(session);

  const response = NextResponse.redirect(new URL('/connexion', request.url), {
    // 303 : la redirection après un POST doit se suivre en GET, sinon le
    // navigateur rejoue la déconnexion sur la page de connexion.
    status: 303,
  });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
