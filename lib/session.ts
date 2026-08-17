/**
 * Session du back-office.
 *
 * Le back-office et l'API vivent sur deux sous-domaines distincts
 * (`admin.opaline…` et `api.opaline…`). Les cookies posés par l'API sont
 * portés par *son* domaine : le serveur Next ne peut donc pas les lire pour
 * rendre une page. D'où ce cookie propre au back-office, qui transporte les
 * jetons obtenus auprès de l'API — le patron « BFF », pas une seconde
 * authentification.
 *
 * Le cookie est **signé** (HMAC-SHA256) : `httpOnly` empêche JavaScript de le
 * lire, mais pas l'utilisateur de le réécrire depuis les outils de
 * développement. Sans signature, n'importe qui se déclarerait `ADMIN` et
 * verrait la coquille du back-office — les données resteraient refusées par
 * l'API, mais afficher l'écran à quelqu'un qui n'y a pas droit reste une
 * fuite.
 *
 * Web Crypto plutôt que `node:crypto` : ce module est appelé depuis le
 * middleware autant que depuis les composants serveur, et `crypto.subtle` est
 * le seul dénominateur commun aux deux environnements d'exécution.
 */

export const SESSION_COOKIE = 'opaline_admin_session';

/** Rôles autorisés à entrer. `CUSTOMER` est explicitement exclu. */
export const STAFF_ROLES = ['SUPPORT', 'FULFILLMENT', 'MANAGER', 'ADMIN'] as const;

export type Role = (typeof STAFF_ROLES)[number] | 'CUSTOMER';

export type SessionUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
};

export type SessionData = {
  accessToken: string;
  refreshToken: string;
  /** Échéance du jeton d'accès, en millisecondes epoch. */
  expiresAt: number;
  user: SessionUser;
};

export function isStaff(role: string): boolean {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

function secret(): string {
  const value = process.env.SESSION_SECRET;

  // Refuser de démarrer plutôt que de signer avec une valeur devinable : une
  // signature faible ne protège de rien et donne l'illusion du contraire.
  if (!value || value.length < 32) {
    throw new Error(
      'SESSION_SECRET manquant ou trop court (32 caractères minimum).',
    );
  }

  return value;
}

async function key(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

/** Sérialise et signe. Le résultat va tel quel dans le cookie. */
export async function sealSession(data: SessionData): Promise<string> {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(data)));
  const signature = await crypto.subtle.sign(
    'HMAC',
    await key(),
    new TextEncoder().encode(payload),
  );

  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * Vérifie la signature puis désérialise. Rend `null` sur cookie absent,
 * tronqué, forgé ou illisible — l'appelant traite ces cas de la même façon :
 * pas de session.
 *
 * `crypto.subtle.verify` compare en temps constant : une comparaison naïve
 * laisserait fuir la signature attendue octet par octet.
 */
export async function openSession(sealed: string | undefined): Promise<SessionData | null> {
  if (!sealed) return null;

  const separator = sealed.lastIndexOf('.');
  if (separator < 1) return null;

  const payload = sealed.slice(0, separator);
  const signature = sealed.slice(separator + 1);

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await key(),
      fromBase64Url(signature) as unknown as ArrayBuffer,
      new TextEncoder().encode(payload),
    );

    if (!valid) return null;

    const data = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payload)),
    ) as SessionData;

    // Une session dont le rôle a perdu ses droits entre-temps ne vaut plus
    // rien : autant la traiter comme absente.
    return isStaff(data.user.role) ? data : null;
  } catch {
    return null;
  }
}

/** Options du cookie de session, communes à toutes les écritures. */
export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/** Durée de vie du cookie : celle du jeton de renouvellement, pas de l'accès. */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
