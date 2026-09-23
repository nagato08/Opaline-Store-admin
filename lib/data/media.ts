import { ApiError, apiBase } from '@/lib/api';
import type { SessionData } from '@/lib/session';

/**
 * Médiathèque — téléversement des photos de produit.
 *
 * Le fichier ne part **pas** du navigateur vers l'API. Il passe par une action
 * serveur du back-office, qui le relaie. C'est la même règle que partout
 * ailleurs ici : le jeton d'accès vit dans un cookie `httpOnly` et ne doit
 * jamais atteindre le JavaScript de la page. Un envoi direct depuis le
 * navigateur l'exigerait.
 *
 * Le détour a un coût — le fichier traverse deux fois le réseau — et une
 * limite : la taille du corps d'une action serveur est plafonnée dans
 * `next.config.ts`. C'est le prix d'un jeton qui ne fuit pas.
 */

/** Aligné sur `MAX_SIZE_BYTES` de l'API : refuser ici évite un aller-retour. */
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

/**
 * Types acceptés, copiés sur ceux de l'API.
 *
 * Le SVG en est exclu des deux côtés : il peut embarquer du JavaScript, et
 * servi depuis le domaine de la boutique il devient une faille XSS.
 */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export type UploadedMedia = { id: string; url: string };

/**
 * Téléverse un fichier et rend son identifiant.
 *
 * `apiFetch` n'est pas utilisé : il force `Content-Type: application/json` dès
 * qu'un corps est présent, ce qui détruirait la frontière multipart. On laisse
 * ici `fetch` calculer lui-même l'en-tête à partir du `FormData` — le fixer à
 * la main est l'erreur classique, la frontière est générée à l'exécution et
 * nul ne peut la deviner.
 */
export async function uploadImage(
  session: SessionData,
  file: File,
  options: { folder?: string; alt?: string } = {},
): Promise<UploadedMedia> {
  const body = new FormData();
  body.append('file', file);
  if (options.folder) body.append('folder', options.folder);
  if (options.alt) body.append('alt', options.alt);

  const response = await fetch(`${apiBase()}/admin/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body,
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message;
    throw new ApiError(response.status, message ?? `Envoi refusé (${response.status}).`);
  }

  const media = (await response.json()) as { id: string; url: string };
  return { id: media.id, url: media.url };
}

/**
 * Téléverse une galerie et rend les identifiants **dans l'ordre reçu**.
 *
 * L'ordre est la seule chose qui désigne la couverture : l'API pose
 * `ProductMedia.position` en suivant le tableau `mediaIds`, et la position 0
 * illustre les listes et la recherche. Un envoi en parallèle rendrait cet
 * ordre dépendant de la vitesse du réseau — d'où la boucle séquentielle, qui
 * coûte quelques secondes et garantit le résultat.
 */
export async function uploadGallery(
  session: SessionData,
  files: File[],
  alts: string[],
  folder: string,
): Promise<string[]> {
  const ids: string[] = [];

  for (const [index, file] of files.entries()) {
    const media = await uploadImage(session, file, { folder, alt: alts[index]?.trim() || undefined });
    ids.push(media.id);
  }

  return ids;
}

/**
 * Extrait les fichiers d'un `FormData` et valide ce qui peut l'être sans
 * réseau : type et poids. Les deux contrôles existent déjà côté API — les
 * doubler ici évite d'envoyer quinze mégaoctets pour se les faire refuser.
 */
export function readGallery(data: FormData, field: string): { files: File[]; error?: string } {
  const files = data
    .getAll(field)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  for (const file of files) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return { files: [], error: `« ${file.name} » n’est pas une image JPEG, PNG, WEBP ou AVIF.` };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { files: [], error: `« ${file.name} » dépasse 15 Mo. Réduisez l’image avant de l’envoyer.` };
    }
  }

  return { files };
}
