import type { SessionData, SessionUser } from './session';

/**
 * Client de l'API, côté serveur uniquement.
 *
 * `API_URL` est lu à l'exécution et vise le nom de conteneur sur le réseau
 * Docker (`http://opaline-api:3000/api`) : l'appel ne sort pas de la machine.
 * `NEXT_PUBLIC_API_URL`, lui, est figé dans le bundle au build et porte
 * l'adresse publique — il sert au navigateur, pas au serveur.
 */
export function apiBase(): string {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3000/api'
  ).replace(/\/$/, '');
}

/**
 * Le jeton de renouvellement ne figure **pas** dans le corps de la réponse :
 * l'API le pose en cookie, à destination de son propre domaine. Le back-office
 * doit donc le récupérer dans l'en-tête `Set-Cookie` pour pouvoir le rejouer
 * plus tard — l'API accepte de le recevoir dans le corps de `/auth/refresh`.
 */
function readRefreshToken(response: Response): string | null {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const cookies = headers.getSetCookie?.() ?? [response.headers.get('set-cookie') ?? ''];

  for (const cookie of cookies) {
    const match = /(?:^|,\s*)refresh_token=([^;]+)/.exec(cookie);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

export type LoginOutcome =
  | { ok: true; session: SessionData }
  | { ok: false; reason: 'credentials' | 'forbidden' | 'unreachable' };

/**
 * Connexion au back-office.
 *
 * Deux appels, pas un : `/auth/login` ne dit pas le rôle, or un compte client
 * ne doit pas entrer ici. C'est `/auth/me` qui tranche, et le refus arrive
 * donc **avant** que la moindre session soit posée.
 */
export async function login(email: string, password: string): Promise<LoginOutcome> {
  let response: Response;

  try {
    response = await fetch(`${apiBase()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
  } catch {
    return { ok: false, reason: 'unreachable' };
  }

  if (!response.ok) return { ok: false, reason: 'credentials' };

  const { accessToken, expiresIn } = (await response.json()) as {
    accessToken: string;
    expiresIn: number;
  };
  const refreshToken = readRefreshToken(response);

  if (!accessToken || !refreshToken) return { ok: false, reason: 'unreachable' };

  const me = await fetch(`${apiBase()}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!me.ok) return { ok: false, reason: 'unreachable' };

  const user = (await me.json()) as SessionUser;
  const { isStaff } = await import('./session');

  if (!isStaff(user.role)) return { ok: false, reason: 'forbidden' };

  return {
    ok: true,
    session: {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    },
  };
}

/**
 * Renouvelle la paire de jetons.
 *
 * L'API fait **tourner** le jeton de renouvellement à chaque usage et révoque
 * toute la famille si un jeton déjà consommé réapparaît — protection contre le
 * vol de jeton. Le nouveau jeton doit donc être persisté immédiatement :
 * perdre la rotation, c'est déconnecter l'utilisateur au prochain appel.
 */
export async function refreshSession(session: SessionData): Promise<SessionData | null> {
  try {
    const response = await fetch(`${apiBase()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const { accessToken, expiresIn } = (await response.json()) as {
      accessToken: string;
      expiresIn: number;
    };

    return {
      ...session,
      accessToken,
      refreshToken: readRefreshToken(response) ?? session.refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };
  } catch {
    return null;
  }
}

/** Erreur remontée par l'API, avec son code HTTP pour distinguer 404 de 403. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Appel authentifié à l'API pour les pages et actions serveur du back-office.
 *
 * Le jeton d'accès vient de la session scellée. Son renouvellement — le
 * jeton expire vite — est déjà géré par le middleware avant que la page ne
 * s'exécute : cette fonction n'a donc pas à réessayer après un 401.
 */
export async function apiFetch<T>(
  session: Pick<SessionData, 'accessToken'>,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
    throw new ApiError(response.status, message ?? `Erreur API (${response.status}).`);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

/** Révoque la session côté API. L'échec n'est pas bloquant : le cookie local part quand même. */
export async function revokeSession(session: SessionData): Promise<void> {
  try {
    await fetch(`${apiBase()}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      cache: 'no-store',
    });
  } catch {
    // Le jeton expirera de lui-même ; inutile de bloquer la déconnexion.
  }
}
