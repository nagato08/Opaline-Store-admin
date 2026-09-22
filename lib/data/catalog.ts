import { apiFetch } from '@/lib/api';
import type { SessionData } from '@/lib/session';

/**
 * Taxonomie du catalogue — catégories et marques.
 *
 * Ces deux écrans existent pour une raison concrète : créer un produit exige
 * une catégorie, et rien ne permettait d'en créer une. L'API savait le faire
 * depuis le début, le back-office n'appelait que la lecture.
 *
 * La boutique est bilingue et tout libellé visible par un client passe par une
 * table de traduction. Le back-office ne collecte pourtant que le français :
 * une catégorie sans traduction anglaise s'affiche en français côté boutique,
 * ce qui est préférable à un écran de saisie à deux colonnes que personne ne
 * remplit. L'anglais se rajoutera par un sélecteur de langue, pas en doublant
 * chaque champ.
 */

type ApiTranslation = { locale: string; name: string; slug: string };

/** La traduction française fait référence ; à défaut, la première trouvée. */
function translate(translations: ApiTranslation[]): ApiTranslation | undefined {
  return translations.find((row) => row.locale === 'FR') ?? translations[0];
}

// --- Catégories -------------------------------------------------------------

type ApiCategory = {
  id: string;
  parentId: string | null;
  depth: number;
  position: number;
  isActive: boolean;
  showInMenu: boolean;
  translations: ApiTranslation[];
  _count: { products: number };
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  depth: number;
  position: number;
  isActive: boolean;
  showInMenu: boolean;
  productCount: number;
  /** Nom du parent, résolu côté back-office : l'API ne l'imbrique pas. */
  parentName: string | null;
};

export type CategoryInput = {
  name: string;
  slug?: string;
  parentId?: string;
  isActive: boolean;
  showInMenu: boolean;
  position?: number;
};

/**
 * L'API rend la liste à plat, triée par profondeur puis position. On garde cet
 * ordre — il place chaque parent avant ses enfants — et on se contente de
 * résoudre le nom du parent pour l'afficher.
 */
export async function listCategories(session: SessionData): Promise<CategoryRow[]> {
  const rows = await apiFetch<ApiCategory[]>(session, '/admin/catalog/categories');
  const names = new Map(rows.map((row) => [row.id, translate(row.translations)?.name ?? '—']));

  return rows.map((row) => ({
    id: row.id,
    name: names.get(row.id) ?? '—',
    slug: translate(row.translations)?.slug ?? '',
    parentId: row.parentId,
    depth: row.depth,
    position: row.position,
    isActive: row.isActive,
    showInMenu: row.showInMenu,
    productCount: row._count.products,
    parentName: row.parentId ? (names.get(row.parentId) ?? null) : null,
  }));
}

export async function getCategory(session: SessionData, id: string): Promise<CategoryRow | null> {
  const rows = await listCategories(session);
  return rows.find((row) => row.id === id) ?? null;
}

export async function createCategory(session: SessionData, input: CategoryInput): Promise<void> {
  await apiFetch(session, '/admin/catalog/categories', {
    method: 'POST',
    body: JSON.stringify(categoryPayload(input)),
  });
}

export async function updateCategory(
  session: SessionData,
  id: string,
  input: CategoryInput,
): Promise<void> {
  await apiFetch(session, `/admin/catalog/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(categoryPayload(input)),
  });
}

export async function deleteCategory(session: SessionData, id: string): Promise<void> {
  await apiFetch(session, `/admin/catalog/categories/${id}`, { method: 'DELETE' });
}

/**
 * Le slug part **absent** plutôt que vide quand l'utilisateur ne l'a pas
 * saisi : l'API le déduit alors du nom. Une chaîne vide, elle, passerait la
 * validation et produirait une catégorie dont l'URL est `/rayons/`.
 */
function categoryPayload(input: CategoryInput) {
  return {
    parentId: input.parentId || undefined,
    isActive: input.isActive,
    showInMenu: input.showInMenu,
    ...(input.position === undefined ? {} : { position: input.position }),
    translations: [
      {
        locale: 'FR',
        name: input.name,
        ...(input.slug ? { slug: input.slug } : {}),
      },
    ],
  };
}

// --- Marques ----------------------------------------------------------------

type ApiBrand = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  isActive: boolean;
  logo: { url: string } | null;
  _count: { products: number };
};

export type BrandRow = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  isActive: boolean;
  logoUrl: string | null;
  productCount: number;
};

export type BrandInput = {
  name: string;
  slug?: string;
  website?: string;
  isActive: boolean;
};

export async function listBrands(session: SessionData): Promise<BrandRow[]> {
  const rows = await apiFetch<ApiBrand[]>(session, '/admin/catalog/brands');

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    website: row.website,
    isActive: row.isActive,
    logoUrl: row.logo?.url ?? null,
    productCount: row._count.products,
  }));
}

export async function getBrand(session: SessionData, id: string): Promise<BrandRow | null> {
  const rows = await listBrands(session);
  return rows.find((row) => row.id === id) ?? null;
}

export async function createBrand(session: SessionData, input: BrandInput): Promise<void> {
  await apiFetch(session, '/admin/catalog/brands', {
    method: 'POST',
    body: JSON.stringify(brandPayload(input)),
  });
}

export async function updateBrand(session: SessionData, id: string, input: BrandInput): Promise<void> {
  await apiFetch(session, `/admin/catalog/brands/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(brandPayload(input)),
  });
}

export async function deleteBrand(session: SessionData, id: string): Promise<void> {
  await apiFetch(session, `/admin/catalog/brands/${id}`, { method: 'DELETE' });
}

function brandPayload(input: BrandInput) {
  return {
    name: input.name,
    ...(input.slug ? { slug: input.slug } : {}),
    ...(input.website ? { website: input.website } : {}),
    isActive: input.isActive,
  };
}
