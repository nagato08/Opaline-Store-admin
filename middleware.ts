import { NextResponse, type NextRequest } from 'next/server';
import { refreshSession } from '@/lib/api';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  openSession,
  sealSession,
  sessionCookieOptions,
} from '@/lib/session';

/** Chemins atteignables sans session. */
const OPEN_PATHS = ['/connexion', '/deconnexion', '/api/health'];

/**
 * Porte d'entrée du back-office.
 *
 * Deux rôles, et un seul est une garde de sécurité :
 *
 * 1. **Rediriger** vers la connexion quand la session manque. C'est du confort
 *    d'usage — la vraie barrière est l'API, qui valide la signature du jeton à
 *    chaque appel et refuse un rôle insuffisant. Un middleware contourné ne
 *    donnerait accès qu'à des écrans vides.
 * 2. **Renouveler le jeton d'accès** avant qu'il n'expire. C'est ici et nulle
 *    part ailleurs : l'API fait tourner le jeton de renouvellement à chaque
 *    usage, et seul le middleware peut écrire un cookie sur une requête de
 *    rendu de page — un composant serveur ne le peut pas. Renouveler ailleurs
 *    perdrait la rotation, et le rejeu du jeton périmé ferait révoquer toute
 *    la famille par la détection de vol.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (OPEN_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const session = await openSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const login = new URL('/connexion', request.url);

    // La page demandée est mémorisée pour y revenir après connexion, plutôt
    // que de déposer l'utilisateur sur le tableau de bord.
    if (pathname !== '/') login.searchParams.set('suite', pathname);

    const response = NextResponse.redirect(login);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Marge de 60 s : renouveler pile à l'échéance laisserait passer des appels
  // avec un jeton expiré entre le rendu et la requête.
  if (Date.now() < session.expiresAt - 60_000) {
    return NextResponse.next();
  }

  const renewed = await refreshSession(session);

  if (!renewed) {
    const response = NextResponse.redirect(new URL('/connexion', request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const response = NextResponse.next();
  response.cookies.set(
    SESSION_COOKIE,
    await sealSession(renewed),
    sessionCookieOptions(SESSION_MAX_AGE),
  );
  return response;
}

export const config = {
  // Les fichiers statiques et les images optimisées n'ont rien à protéger et
  // paieraient une vérification de signature à chaque requête.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
