import { apiFetch } from '@/lib/api';
import type { SessionData } from '@/lib/session';
import type { BadgeTone } from '@/components/ui/badge';

/**
 * Contenu éditorial — pages et articles.
 *
 * L'API stocke le corps dans un champ JSON libre, et la boutique n'en rend
 * aujourd'hui que deux formes : `text` et `heading`
 * (`front-ecommerce/components/content/blocks.tsx`). Le back-office collecte
 * donc du texte brut et le convertit, plutôt que d'offrir un éditeur riche
 * dont 90 % des productions ne s'afficheraient nulle part.
 *
 * La conversion est réversible : le texte se reconstruit à l'identique depuis
 * les blocs, ce qui permet de rouvrir un contenu pour le modifier.
 */

export type PublishStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export const PUBLISH_STATUSES: Record<
  PublishStatus,
  { label: string; tone: Exclude<BadgeTone, 'brand'> }
> = {
  DRAFT: { label: 'Brouillon', tone: 'neutral' },
  SCHEDULED: { label: 'Programmé', tone: 'info' },
  PUBLISHED: { label: 'En ligne', tone: 'success' },
  ARCHIVED: { label: 'Archivé', tone: 'warning' },
};

export type ContentBlock = { type: string; value?: string };

type ApiContentTranslation = {
  locale: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: { blocks?: ContentBlock[] } | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

function french<T extends { locale: string }>(translations: T[]): T | undefined {
  return translations.find((row) => row.locale === 'FR') ?? translations[0];
}

// --- Conversion texte ↔ blocs ------------------------------------------------

/**
 * Découpe un texte en blocs.
 *
 * Deux règles, et pas une de plus : une ligne vide sépare deux blocs, une
 * ligne commençant par `## ` devient un titre. C'est exactement ce que la
 * boutique sait afficher — inventer davantage produirait du contenu invisible.
 */
export function toBlocks(text: string): ContentBlock[] {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) =>
      chunk.startsWith('## ')
        ? { type: 'heading', value: chunk.slice(3).trim() }
        : { type: 'text', value: chunk },
    );
}

/** Reconstruit le texte éditable depuis les blocs enregistrés. */
export function fromBlocks(blocks: ContentBlock[] | undefined): string {
  return (blocks ?? [])
    .map((block) =>
      block.type === 'heading' ? `## ${block.value ?? ''}` : (block.value ?? ''),
    )
    .join('\n\n');
}

// --- Pages -------------------------------------------------------------------

type ApiPage = {
  id: string;
  code: string;
  template: string | null;
  status: PublishStatus;
  publishedAt: string | null;
  updatedAt: string;
  translations: ApiContentTranslation[];
};

export type PageRow = {
  id: string;
  code: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  status: PublishStatus;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
};

export type PageInput = {
  code: string;
  title: string;
  slug?: string;
  excerpt?: string;
  body: string;
  status: PublishStatus;
  seoTitle?: string;
  seoDescription?: string;
};

function toPageRow(page: ApiPage): PageRow {
  const translation = french(page.translations);

  return {
    id: page.id,
    code: page.code,
    title: translation?.title ?? '—',
    slug: translation?.slug ?? '',
    excerpt: translation?.excerpt ?? '',
    body: fromBlocks(translation?.content?.blocks),
    status: page.status,
    seoTitle: translation?.seoTitle ?? '',
    seoDescription: translation?.seoDescription ?? '',
    updatedAt: page.updatedAt,
  };
}

export async function listPages(session: SessionData): Promise<PageRow[]> {
  const rows = await apiFetch<ApiPage[]>(session, '/admin/content/pages?perPage=100');
  return rows.map(toPageRow);
}

export async function getPage(session: SessionData, id: string): Promise<PageRow | null> {
  const rows = await listPages(session);
  return rows.find((row) => row.id === id) ?? null;
}

export async function createPage(session: SessionData, input: PageInput): Promise<void> {
  await apiFetch(session, '/admin/content/pages', {
    method: 'POST',
    body: JSON.stringify(contentPayload(input, { code: input.code })),
  });
}

export async function updatePage(
  session: SessionData,
  id: string,
  input: PageInput,
): Promise<void> {
  await apiFetch(session, `/admin/content/pages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(contentPayload(input, { code: input.code })),
  });
}

export async function deletePage(session: SessionData, id: string): Promise<void> {
  await apiFetch(session, `/admin/content/pages/${id}`, { method: 'DELETE' });
}

// --- Articles ----------------------------------------------------------------

type ApiPost = {
  id: string;
  status: PublishStatus;
  authorName: string | null;
  tags: string[];
  publishedAt: string | null;
  updatedAt: string;
  translations: ApiContentTranslation[];
};

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  status: PublishStatus;
  authorName: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  publishedAt: string | null;
  updatedAt: string;
};

export type PostInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  body: string;
  status: PublishStatus;
  authorName?: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
};

function toPostRow(post: ApiPost): PostRow {
  const translation = french(post.translations);

  return {
    id: post.id,
    title: translation?.title ?? '—',
    slug: translation?.slug ?? '',
    excerpt: translation?.excerpt ?? '',
    body: fromBlocks(translation?.content?.blocks),
    status: post.status,
    authorName: post.authorName ?? '',
    tags: post.tags,
    seoTitle: translation?.seoTitle ?? '',
    seoDescription: translation?.seoDescription ?? '',
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
  };
}

export async function listPosts(session: SessionData): Promise<PostRow[]> {
  const page = await apiFetch<{ items: ApiPost[] }>(session, '/admin/content/posts?perPage=100');
  return page.items.map(toPostRow);
}

export async function getPost(session: SessionData, id: string): Promise<PostRow | null> {
  const rows = await listPosts(session);
  return rows.find((row) => row.id === id) ?? null;
}

export async function createPost(session: SessionData, input: PostInput): Promise<void> {
  await apiFetch(session, '/admin/content/posts', {
    method: 'POST',
    body: JSON.stringify(contentPayload(input, { tags: input.tags, authorName: input.authorName })),
  });
}

export async function updatePost(
  session: SessionData,
  id: string,
  input: PostInput,
): Promise<void> {
  await apiFetch(session, `/admin/content/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(contentPayload(input, { tags: input.tags, authorName: input.authorName })),
  });
}

export async function deletePost(session: SessionData, id: string): Promise<void> {
  await apiFetch(session, `/admin/content/posts/${id}`, { method: 'DELETE' });
}

/**
 * Corps commun aux pages et aux articles.
 *
 * Seul le français est envoyé. Une page sans traduction anglaise s'affiche en
 * français côté boutique, ce qui vaut mieux qu'un formulaire à deux colonnes
 * que personne ne remplit ; l'anglais viendra par un sélecteur de langue.
 *
 * Le slug part absent quand il n'est pas saisi, pour que l'API le déduise du
 * titre. Une chaîne vide passerait la validation et produirait une URL nue.
 */
function contentPayload(
  input: {
    title: string;
    slug?: string;
    excerpt?: string;
    body: string;
    status: PublishStatus;
    seoTitle?: string;
    seoDescription?: string;
  },
  extra: Record<string, unknown>,
) {
  return {
    ...extra,
    status: input.status,
    translations: [
      {
        locale: 'FR',
        title: input.title,
        ...(input.slug ? { slug: input.slug } : {}),
        ...(input.excerpt ? { excerpt: input.excerpt } : {}),
        content: { blocks: toBlocks(input.body) },
        ...(input.seoTitle ? { seoTitle: input.seoTitle } : {}),
        ...(input.seoDescription ? { seoDescription: input.seoDescription } : {}),
      },
    ],
  };
}

// --- Redirections ------------------------------------------------------------

type ApiRedirect = {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  hits: number;
};

export type RedirectRow = ApiRedirect;

export type RedirectInput = { fromPath: string; toPath: string; statusCode: number };

/**
 * Redirections d'adresses.
 *
 * Triées par nombre de visites côté API : celles qui servent le plus arrivent
 * en tête, et c'est l'information utile — une redirection à zéro visite est
 * probablement inutile ou mal écrite.
 */
export async function listRedirects(session: SessionData): Promise<RedirectRow[]> {
  return apiFetch<ApiRedirect[]>(session, '/admin/content/redirects?perPage=100');
}

export async function createRedirect(session: SessionData, input: RedirectInput): Promise<void> {
  await apiFetch(session, '/admin/content/redirects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteRedirect(session: SessionData, id: string): Promise<void> {
  await apiFetch(session, `/admin/content/redirects/${id}`, { method: 'DELETE' });
}
