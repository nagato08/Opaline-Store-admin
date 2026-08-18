import { apiFetch } from '@/lib/api';
import type { SessionData } from '@/lib/session';

/**
 * Vue « stock », branchée sur `GET /admin/inventory` et `GET /admin/inventory/expiring`.
 *
 * Le disponible — physique moins réservé — décide seul du niveau d'alerte.
 * L'API le calcule déjà (`InventoryService.listStock`) : ce module se
 * contente de traduire la forme de la réponse, jamais de refaire le calcul.
 */

export type StockLevel = 'out' | 'low' | 'ok';

export const STOCK_LEVELS: Record<StockLevel, { label: string; tone: 'danger' | 'warning' | 'success'; slug: string }> = {
  out: { label: 'Rupture', tone: 'danger', slug: 'rupture' },
  low: { label: 'Sous le seuil', tone: 'warning', slug: 'sous-seuil' },
  ok: { label: 'Suffisant', tone: 'success', slug: 'suffisant' },
};

export function toStockLevel(value: string | string[] | undefined): StockLevel | undefined {
  if (typeof value !== 'string') return undefined;
  return (Object.keys(STOCK_LEVELS) as StockLevel[]).find((key) => STOCK_LEVELS[key].slug === value);
}

type ApiStockRow = {
  variantId: string;
  sku: string;
  productId: string;
  name: { locale: string; name: string }[];
  location: { id: string; code: string; name: string };
  onHand: number;
  reserved: number;
  available: number;
  threshold: number;
  unit: string | null;
  openLots: number;
  level: StockLevel;
};

export type StockLine = {
  variantId: string;
  sku: string;
  productId: string;
  product: string;
  locationId: string;
  locationName: string;
  onHand: number;
  reserved: number;
  available: number;
  threshold: number;
  unit: string;
  openLots: number;
  level: StockLevel;
};

function productName(translations: { locale: string; name: string }[]): string {
  return translations.find((translation) => translation.locale === 'FR')?.name ?? translations[0]?.name ?? '—';
}

function toStockLine(row: ApiStockRow): StockLine {
  return {
    variantId: row.variantId,
    sku: row.sku,
    productId: row.productId,
    product: productName(row.name),
    locationId: row.location.id,
    locationName: row.location.name,
    onHand: row.onHand,
    reserved: row.reserved,
    available: row.available,
    threshold: row.threshold,
    unit: row.unit ?? 'pièces',
    openLots: row.openLots,
    level: row.level,
  };
}

export type Location = { id: string; code: string; name: string; isDefault: boolean };

export async function listLocations(session: SessionData): Promise<Location[]> {
  return apiFetch<Location[]>(session, '/admin/inventory/locations');
}

export async function listStockLines(
  session: SessionData,
  filters: { level?: StockLevel; search?: string } = {},
): Promise<StockLine[]> {
  const params = new URLSearchParams();
  if (filters.level) params.set('level', filters.level);
  if (filters.search) params.set('search', filters.search);
  const query = params.size > 0 ? `?${params}` : '';

  const rows = await apiFetch<ApiStockRow[]>(session, `/admin/inventory${query}`);
  return rows.map(toStockLine);
}

export type StockMovementType = 'RECEIPT' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'TRANSFER' | 'LOSS' | 'EXPIRY';

/** Ajustement manuel : `quantity` est signée — négative pour une sortie. */
export async function adjustStock(
  session: SessionData,
  input: {
    variantId: string;
    locationId: string;
    quantity: number;
    type: StockMovementType;
    reason?: string;
  },
): Promise<void> {
  await apiFetch(session, '/admin/inventory/adjust', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

type ApiLot = {
  lotNumber: string;
  quantity: string;
  expiresAt: string;
  variant: {
    sku: string;
    isSoldByMeasure: boolean;
    measureUnit: string | null;
    product: { translations: { locale: string; name: string }[] };
  };
};

export type ExpiringLot = {
  lotNumber: string;
  product: string;
  sku: string;
  quantity: number;
  unit: string;
  expiresAt: string;
};

function toLot(lot: ApiLot): ExpiringLot {
  return {
    lotNumber: lot.lotNumber,
    product: productName(lot.variant.product.translations),
    sku: lot.variant.sku,
    quantity: Number(lot.quantity),
    unit: lot.variant.isSoldByMeasure ? (lot.variant.measureUnit ?? 'kg') : 'pièces',
    expiresAt: lot.expiresAt,
  };
}

/** Lots dont la date limite tombe dans les `days` prochains jours (7 par défaut). */
export async function expiringLots(session: SessionData, days = 7): Promise<ExpiringLot[]> {
  const rows = await apiFetch<ApiLot[]>(session, `/admin/inventory/expiring?days=${days}`);
  return rows.map(toLot);
}

/**
 * Un lot par son numéro.
 *
 * Il n'existe pas de route dédiée : seuls les lots datés existent en base
 * (le mobilier n'en a pas), donc une fenêtre large sur `expiring` couvre tout
 * lot encore ouvert, indépendamment de son échéance réelle.
 */
export async function lotByNumber(session: SessionData, lotNumber: string): Promise<ExpiringLot | null> {
  const lots = await expiringLots(session, 3650);
  return lots.find((lot) => lot.lotNumber === lotNumber) ?? null;
}

/** Lots ouverts pour un jeu de références données, classés au plus court (FEFO). */
export async function expiringLotsForSkus(session: SessionData, skus: string[]): Promise<ExpiringLot[]> {
  const lots = await expiringLots(session, 3650);
  return lots.filter((lot) => skus.includes(lot.sku));
}
