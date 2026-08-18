import type { BadgeTone } from '@/components/ui/badge';
import { apiFetch, ApiError } from '@/lib/api';
import type { SessionData } from '@/lib/session';

/**
 * Vue « produits », branchée sur `GET /admin/catalog/products`.
 *
 * La référence (SKU) vit sur la variante, pas sur le produit — un produit
 * peut porter plusieurs déclinaisons. La page garde pourtant une seule
 * référence par ligne dans son URL : c'est celle de la variante par défaut
 * (`isDefault`, ou la première) qui joue ce rôle d'identifiant de façade.
 */

export type ProductStatus = 'published' | 'draft' | 'archived';

export const PRODUCT_STATUSES: Record<ProductStatus, { label: string; tone: Exclude<BadgeTone, 'brand'>; slug: string }> = {
  published: { label: 'En ligne', tone: 'success', slug: 'en-ligne' },
  draft: { label: 'Brouillon', tone: 'neutral', slug: 'brouillon' },
  archived: { label: 'Archivé', tone: 'warning', slug: 'archive' },
};

export function toProductStatus(value: string | string[] | undefined): ProductStatus | undefined {
  if (typeof value !== 'string') return undefined;
  return (Object.keys(PRODUCT_STATUSES) as ProductStatus[]).find((key) => PRODUCT_STATUSES[key].slug === value);
}

type ApiStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

const STATUS_MAP: Record<ApiStatus, ProductStatus> = { DRAFT: 'draft', ACTIVE: 'published', ARCHIVED: 'archived' };
const STATUS_MAP_REVERSE: Record<ProductStatus, ApiStatus> = { draft: 'DRAFT', published: 'ACTIVE', archived: 'ARCHIVED' };

type ApiTranslation = { locale: string; name: string; slug: string };
type ApiPrice = { currencyCode: string; amountCents: number; customerGroupId: string | null };
type ApiInventoryItem = { onHand: string; reserved: string; lowStockAt?: string };

type ApiVariantListItem = {
  id: string;
  sku: string;
  isActive: boolean;
  isSoldByMeasure: boolean;
  measureUnit: string | null;
  prices: ApiPrice[];
  inventoryItems: ApiInventoryItem[];
};

type ApiOptionValue = { optionValue: { translations: { locale: string; label: string }[] } };

type ApiVariantDetail = ApiVariantListItem & {
  isDefault: boolean;
  stepQuantity: string;
  optionValues: ApiOptionValue[];
};

type ApiCategory = { category: { translations: ApiTranslation[] } };

type ApiProductListItem = {
  id: string;
  status: ApiStatus;
  ecoTaxCents: number;
  translations: ApiTranslation[];
  categories: ApiCategory[];
  media: { media: { url: string } }[];
  variants: ApiVariantListItem[];
  _count: { variants: number };
};

type ApiProductDetail = Omit<ApiProductListItem, 'variants' | '_count'> & {
  taxClass: { name: string } | null;
  media: { media: { url: string }; id: string }[];
  variants: ApiVariantDetail[];
};

function translate(translations: ApiTranslation[]): ApiTranslation | undefined {
  return translations.find((translation) => translation.locale === 'FR') ?? translations[0];
}

function basePriceCents(prices: ApiPrice[]): number {
  return prices.find((price) => price.currencyCode === 'EUR' && !price.customerGroupId)?.amountCents ?? 0;
}

function totalOnHand(variants: ApiVariantListItem[]): number {
  return variants.reduce(
    (sum, variant) => sum + variant.inventoryItems.reduce((s, item) => s + Number(item.onHand), 0),
    0,
  );
}

export type ProductImage = { url: string };

export type ProductListItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceCents: number;
  ecoTaxCents: number;
  variantCount: number;
  onHand: number;
  unit: string;
  status: ProductStatus;
  images: ProductImage[];
};

export type Variant = {
  id: string;
  sku: string;
  label: string;
  isDefault: boolean;
  isActive: boolean;
  priceCents: number;
  onHand: number;
  reserved: number;
  threshold: number;
  stepQuantity: number;
  unit: string;
};

function variantLabel(variant: ApiVariantDetail): string {
  const label = variant.optionValues
    .map((entry) => {
      const translations = entry.optionValue.translations;
      return translations.find((t) => t.locale === 'FR')?.label ?? translations[0]?.label;
    })
    .filter(Boolean)
    .join(' · ');
  return label || variant.sku;
}

export type ProductDetail = ProductListItem & {
  slug: string;
  taxClassName: string | null;
  defaultVariantId: string | null;
  variants: Variant[];
};

function primaryCategoryName(categories: ApiCategory[]): string {
  return categories[0] ? (translate(categories[0].category.translations)?.name ?? '—') : '—';
}

function defaultVariantSku(variants: ApiVariantListItem[]): string {
  return variants[0]?.sku ?? '';
}

function toListItem(product: ApiProductListItem): ProductListItem {
  return {
    id: product.id,
    sku: defaultVariantSku(product.variants),
    name: translate(product.translations)?.name ?? '—',
    category: primaryCategoryName(product.categories),
    priceCents: basePriceCents(product.variants[0]?.prices ?? []),
    ecoTaxCents: product.ecoTaxCents,
    variantCount: product._count.variants,
    onHand: totalOnHand(product.variants),
    unit: product.variants[0] ? unitOf(product.variants[0]) : 'pièces',
    status: STATUS_MAP[product.status],
    images: product.media.map((entry) => ({ url: entry.media.url })),
  };
}

function unitOf(variant: Pick<ApiVariantListItem, 'isSoldByMeasure' | 'measureUnit'>): string {
  return variant.isSoldByMeasure ? (variant.measureUnit ?? 'kg') : 'pièces';
}

function toDetail(product: ApiProductDetail): ProductDetail {
  const defaultVariant = product.variants.find((variant) => variant.isDefault) ?? product.variants[0];

  return {
    id: product.id,
    sku: defaultVariant?.sku ?? '',
    name: translate(product.translations)?.name ?? '—',
    category: primaryCategoryName(product.categories),
    priceCents: basePriceCents(defaultVariant?.prices ?? []),
    ecoTaxCents: product.ecoTaxCents,
    variantCount: product.variants.length,
    onHand: totalOnHand(product.variants),
    unit: defaultVariant ? unitOf(defaultVariant) : 'pièces',
    status: STATUS_MAP[product.status],
    images: product.media.map((entry) => ({ url: entry.media.url })),
    slug: translate(product.translations)?.slug ?? '',
    taxClassName: product.taxClass?.name ?? null,
    defaultVariantId: defaultVariant?.id ?? null,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      label: variantLabel(variant),
      isDefault: variant.isDefault,
      isActive: variant.isActive,
      priceCents: basePriceCents(variant.prices),
      onHand: variant.inventoryItems.reduce((sum, item) => sum + Number(item.onHand), 0),
      reserved: variant.inventoryItems.reduce((sum, item) => sum + Number(item.reserved), 0),
      threshold: variant.inventoryItems.reduce((sum, item) => sum + Number(item.lowStockAt ?? 0), 0),
      stepQuantity: Number(variant.stepQuantity),
      unit: unitOf(variant),
    })),
  };
}

export type ProductListResult = { products: ProductListItem[]; total: number; counts: Array<{ key: ProductStatus; count: number }> };

export async function listProducts(
  session: SessionData,
  filters: { status?: ProductStatus; search?: string },
): Promise<ProductListResult> {
  const params = new URLSearchParams({ perPage: '100' });
  if (filters.search) params.set('search', filters.search);

  const page = await apiFetch<{ items: ApiProductListItem[]; meta: { total: number } }>(
    session,
    `/admin/catalog/products?${params}`,
  );

  const all = page.items.map(toListItem);
  const counts = (Object.keys(PRODUCT_STATUSES) as ProductStatus[]).map((key) => ({
    key,
    count: all.filter((product) => product.status === key).length,
  }));

  return {
    products: filters.status ? all.filter((product) => product.status === filters.status) : all,
    total: page.meta.total,
    counts,
  };
}

/** Fiche produit, retrouvée par la référence de sa variante par défaut. */
export async function getProductBySku(session: SessionData, sku: string): Promise<ProductDetail | null> {
  const page = await apiFetch<{ items: ApiProductListItem[] }>(
    session,
    `/admin/catalog/products?${new URLSearchParams({ search: sku, perPage: '5' })}`,
  );
  const match = page.items.find((product) => product.variants.some((variant) => variant.sku === sku));
  if (!match) return null;

  try {
    const detail = await apiFetch<ApiProductDetail>(session, `/admin/catalog/products/${match.id}`);
    return toDetail(detail);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * Modification d'une fiche produit existante.
 *
 * `slug` est explicitement repassé tel quel : sans lui, l'API régénère un
 * slug à partir du nouveau nom, et l'URL publique du produit changerait au
 * moindre correctif de libellé.
 */
export async function updateProduct(
  session: SessionData,
  productId: string,
  input: { name: string; slug: string; status: ProductStatus; ecoTaxCents: number },
): Promise<void> {
  await apiFetch(session, `/admin/catalog/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: STATUS_MAP_REVERSE[input.status],
      ecoTaxCents: input.ecoTaxCents,
      translations: [{ locale: 'FR', name: input.name, slug: input.slug }],
    }),
  });
}

export async function updateVariantPrice(session: SessionData, productId: string, variantId: string, amountCents: number): Promise<void> {
  await apiFetch(session, `/admin/catalog/products/${productId}/variants/${variantId}/price`, {
    method: 'PATCH',
    body: JSON.stringify({ amountCents }),
  });
}

export type Category = { id: string; name: string };

/** Catégories existantes, pour le sélecteur de création — aucune n'est inventée. */
export async function listCategories(session: SessionData): Promise<Category[]> {
  const rows = await apiFetch<Array<{ id: string; translations: ApiTranslation[] }>>(
    session,
    '/admin/catalog/categories',
  );
  return rows.map((row) => ({ id: row.id, name: translate(row.translations)?.name ?? '—' }));
}

/**
 * Création d'un produit avec sa variante par défaut.
 *
 * Un seul prix, une seule variante : c'est ce que le formulaire collecte
 * aujourd'hui. Ajouter des déclinaisons (couleur, taille) se fait ensuite,
 * depuis la fiche produit.
 */
export async function createProduct(
  session: SessionData,
  input: {
    name: string;
    sku: string;
    categoryId: string;
    description?: string;
    priceCents: number;
    ecoTaxCents: number;
  },
): Promise<{ sku: string }> {
  await apiFetch(session, '/admin/catalog/products', {
    method: 'POST',
    body: JSON.stringify({
      ecoTaxCents: input.ecoTaxCents,
      categoryIds: [input.categoryId],
      translations: [
        {
          locale: 'FR',
          name: input.name,
          shortDescription: input.description || undefined,
        },
      ],
      variants: [
        {
          sku: input.sku,
          isDefault: true,
          prices: [{ currencyCode: 'EUR', amountCents: input.priceCents }],
        },
      ],
    }),
  });

  return { sku: input.sku };
}

export { STATUS_MAP_REVERSE };
