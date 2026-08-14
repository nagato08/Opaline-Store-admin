import { daysFromNow } from './random';
import type { BadgeTone } from '@/components/ui/badge';

export type Category = 'Mobilier' | 'Électronique' | 'Alimentaire';

export type ProductStatus = 'published' | 'draft' | 'archived';

export const PRODUCT_STATUSES: Record<
  ProductStatus,
  { label: string; tone: Exclude<BadgeTone, 'brand'>; slug: string }
> = {
  published: { label: 'En ligne', tone: 'success', slug: 'en-ligne' },
  draft: { label: 'Brouillon', tone: 'neutral', slug: 'brouillon' },
  archived: { label: 'Archivé', tone: 'warning', slug: 'archive' },
};

export function toProductStatus(value: string | string[] | undefined): ProductStatus | undefined {
  if (typeof value !== 'string') return undefined;

  return (Object.keys(PRODUCT_STATUSES) as ProductStatus[]).find(
    (key) => PRODUCT_STATUSES[key].slug === value,
  );
}

/**
 * Photo de démonstration. Vient d'Unsplash, à remplacer par les visuels du
 * client servis par Cloudinary — même convention que la boutique cliente,
 * pour que les deux catalogues de démonstration se répondent.
 */
const photo = (id: string, w = 400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export type ProductImage = { url: string; alt: string };

export type DemoProduct = {
  name: string;
  sku: string;
  category: Category;
  /** Prix unitaire hors éco-participation, en centimes entiers. */
  priceCents: number;
  /**
   * Éco-participation. Obligation légale française sur le mobilier et
   * l'électronique : elle s'affiche à part, jamais fondue dans le prix.
   */
  ecoTaxCents: number;
  variants: number;
  /** Décimal pour l'alimentaire, qui se vend au poids. */
  onHand: number;
  unit: string;
  status: ProductStatus;
  /**
   * Galerie ordonnée — `ProductMedia.position` côté API. La première image
   * est la couverture : c'est elle qui illustre les listes et les moteurs de
   * recherche. Un tableau vide est un état réel, pas une erreur : un produit
   * fraîchement créé n'a pas encore de photo.
   */
  images: ProductImage[];
};

export function products(): DemoProduct[] {
  return [
    { name: 'Canapé Oslo', sku: 'MOB-OSL-3P-GRI', category: 'Mobilier', priceCents: 89900, ecoTaxCents: 1200, variants: 4, onHand: 0, unit: 'pièces', status: 'published', images: [{ url: photo('photo-1555041469-a586c61ea9bc'), alt: 'Canapé d’angle en tissu gris clair' }] },
    { name: 'Lampe Arc', sku: 'MOB-ARC-LAI', category: 'Mobilier', priceCents: 9400, ecoTaxCents: 60, variants: 2, onHand: 0, unit: 'pièces', status: 'published', images: [{ url: photo('photo-1507473885765-e6ed057f782c'), alt: 'Lampe à poser en laiton allumée' }] },
    { name: 'Table Rennes', sku: 'MOB-REN-180-CHE', category: 'Mobilier', priceCents: 54900, ecoTaxCents: 900, variants: 3, onHand: 12, unit: 'pièces', status: 'published', images: [{ url: photo('photo-1499933374294-4584851497cc'), alt: 'Table ronde à pieds de chêne' }] },
    { name: 'Chaise Lund', sku: 'MOB-LUN-NOI', category: 'Mobilier', priceCents: 12900, ecoTaxCents: 150, variants: 5, onHand: 46, unit: 'pièces', status: 'published', images: [] },
    { name: 'Casque Aurea', sku: 'ELE-AUR-BT-NOI', category: 'Électronique', priceCents: 14960, ecoTaxCents: 50, variants: 3, onHand: 87, unit: 'pièces', status: 'published', images: [{ url: photo('photo-1505740420928-5e560c06d30e'), alt: 'Casque audio noir sur fond clair' }] },
    { name: 'Enceinte Mistral', sku: 'ELE-MIS-BT', category: 'Électronique', priceCents: 7990, ecoTaxCents: 40, variants: 2, onHand: 23, unit: 'pièces', status: 'published', images: [{ url: photo('photo-1531104985437-603d6490e6d4'), alt: 'Enceinte noire posée sur un support métallique' }] },
    { name: 'Station de charge Nord', sku: 'ELE-NOR-USBC', category: 'Électronique', priceCents: 3490, ecoTaxCents: 20, variants: 1, onHand: 4, unit: 'pièces', status: 'published', images: [] },
    { name: 'Écouteurs Brise', sku: 'ELE-BRI-TWS', category: 'Électronique', priceCents: 5990, ecoTaxCents: 20, variants: 2, onHand: 0, unit: 'pièces', status: 'draft', images: [] },
    { name: 'Riz basmati bio', sku: 'ALI-RIZ-BAS-BIO', category: 'Alimentaire', priceCents: 1800, ecoTaxCents: 0, variants: 2, onHand: 212.5, unit: 'kg', status: 'published', images: [{ url: photo('photo-1586201375761-83865001e31c'), alt: 'Sachet de riz basmati posé sur un plan de travail' }] },
    { name: 'Miel de châtaignier', sku: 'ALI-MIE-CHA-500', category: 'Alimentaire', priceCents: 1800, ecoTaxCents: 0, variants: 1, onHand: 38.5, unit: 'kg', status: 'published', images: [{ url: photo('photo-1558642452-9d2a7deb7f62'), alt: 'Pot de miel ambré et cuillère en bois' }] },
    { name: 'Huile d’olive vierge', sku: 'ALI-HUI-OLI-1L', category: 'Alimentaire', priceCents: 1450, ecoTaxCents: 0, variants: 2, onHand: 96.75, unit: 'L', status: 'published', images: [{ url: photo('photo-1474979266404-7eaacbcd87c5'), alt: 'Bouteille d’huile d’olive sur une table en bois' }] },
    { name: 'Café Arabica moulu', sku: 'ALI-CAF-ARA-250', category: 'Alimentaire', priceCents: 890, ecoTaxCents: 0, variants: 3, onHand: 61.2, unit: 'kg', status: 'published', images: [] },
    { name: 'Confiture d’abricot', sku: 'ALI-CON-ABR-370', category: 'Alimentaire', priceCents: 620, ecoTaxCents: 0, variants: 1, onHand: 148, unit: 'pots', status: 'published', images: [] },
    { name: 'Plaid Bergen', sku: 'MOB-BER-LAI-GRI', category: 'Mobilier', priceCents: 6900, ecoTaxCents: 0, variants: 3, onHand: 0, unit: 'pièces', status: 'archived', images: [] },
  ];
}

/** Un produit par sa référence ; `undefined` si elle n'existe pas. */
export function productBySku(sku: string): DemoProduct | undefined {
  return products().find((product) => product.sku === sku);
}

/**
 * Variantes d'un produit.
 *
 * Le pas de vente porte la contrainte d'achat : l'alimentaire au poids se
 * commande par multiples de 250 g ou de 500 g, pas au gramme près. C'est
 * `Variant.stepQuantity` côté API.
 */
export type Variant = {
  label: string;
  sku: string;
  priceCents: number;
  onHand: number;
  stepQuantity: number;
};

export function variantsOf(product: DemoProduct): Variant[] {
  const step = product.unit === 'pièces' || product.unit === 'pots' ? 1 : 0.25;

  /* Les déclinaisons sont dérivées du produit plutôt qu'écrites à la main :
     un catalogue de démonstration où les prix des variantes ne suivent pas
     celui du produit se remarque à la première lecture. */
  const suffixes =
    product.category === 'Alimentaire'
      ? ['vrac', 'sachet 500 g', 'sachet 1 kg', 'lot de 6', 'lot de 12']
      : ['gris', 'noir', 'chêne', 'laiton', 'blanc'];

  return Array.from({ length: product.variants }, (_, index) => ({
    label: suffixes[index] ?? `déclinaison ${index + 1}`,
    sku: `${product.sku}-${String(index + 1).padStart(2, '0')}`,
    priceCents: product.priceCents + index * Math.round(product.priceCents * 0.06),
    onHand: Math.round((product.onHand / product.variants) * 100) / 100,
    stepQuantity: step,
  }));
}

/* ------------------------------------------------------------------------- */

export type StockLine = {
  sku: string;
  product: string;
  variant: string;
  category: Category;
  /** Physiquement présent, réservations comprises. */
  onHand: number;
  /** Immobilisé par des commandes payées non encore expédiées. */
  reserved: number;
  threshold: number;
  unit: string;
  /** Nombre de lots ouverts ; nul pour ce qui ne périme pas. */
  lots: number;
};

export function stockLines(): StockLine[] {
  return [
    { sku: 'MOB-OSL-3P-GRI', product: 'Canapé Oslo', variant: 'gris', category: 'Mobilier', onHand: 0, reserved: 0, threshold: 2, unit: 'pièces', lots: 0 },
    { sku: 'MOB-ARC-LAI', product: 'Lampe Arc', variant: 'laiton', category: 'Mobilier', onHand: 0, reserved: 0, threshold: 3, unit: 'pièces', lots: 0 },
    { sku: 'ELE-NOR-USBC', product: 'Station de charge Nord', variant: 'blanc', category: 'Électronique', onHand: 4, reserved: 3, threshold: 10, unit: 'pièces', lots: 0 },
    { sku: 'ALI-MIE-CHA-500', product: 'Miel de châtaignier', variant: 'pot 500 g', category: 'Alimentaire', onHand: 38.5, reserved: 4, threshold: 40, unit: 'kg', lots: 3 },
    { sku: 'MOB-REN-180-CHE', product: 'Table Rennes', variant: 'chêne 180 cm', category: 'Mobilier', onHand: 12, reserved: 2, threshold: 4, unit: 'pièces', lots: 0 },
    { sku: 'ELE-MIS-BT', product: 'Enceinte Mistral', variant: 'anthracite', category: 'Électronique', onHand: 23, reserved: 1, threshold: 8, unit: 'pièces', lots: 0 },
    { sku: 'ALI-CAF-ARA-250', product: 'Café Arabica moulu', variant: 'sachet 250 g', category: 'Alimentaire', onHand: 61.2, reserved: 6.5, threshold: 25, unit: 'kg', lots: 4 },
    { sku: 'MOB-LUN-NOI', product: 'Chaise Lund', variant: 'noir', category: 'Mobilier', onHand: 46, reserved: 8, threshold: 12, unit: 'pièces', lots: 0 },
    { sku: 'ELE-AUR-BT-NOI', product: 'Casque Aurea', variant: 'noir', category: 'Électronique', onHand: 87, reserved: 12, threshold: 20, unit: 'pièces', lots: 0 },
    { sku: 'ALI-HUI-OLI-1L', product: 'Huile d’olive vierge', variant: 'bidon 1 L', category: 'Alimentaire', onHand: 96.75, reserved: 3, threshold: 30, unit: 'L', lots: 2 },
    { sku: 'ALI-RIZ-BAS-BIO', product: 'Riz basmati bio', variant: 'vrac', category: 'Alimentaire', onHand: 212.5, reserved: 18, threshold: 60, unit: 'kg', lots: 5 },
    { sku: 'ALI-CON-ABR-370', product: 'Confiture d’abricot', variant: 'pot 370 g', category: 'Alimentaire', onHand: 148, reserved: 9, threshold: 40, unit: 'pots', lots: 2 },
  ];
}

/**
 * Niveau d'alerte d'une ligne de stock.
 *
 * Le disponible est ce qui reste **après** réservation : c'est lui qu'il faut
 * comparer au seuil. Comparer la quantité physique laisserait passer une
 * rupture sur un article entièrement réservé.
 */
export function stockLevel(line: StockLine): 'out' | 'low' | 'ok' {
  const available = line.onHand - line.reserved;

  if (available <= 0) return 'out';
  return available <= line.threshold ? 'low' : 'ok';
}

/** La ligne de stock d'une référence, si elle est suivie. */
export function stockLineBySku(sku: string): StockLine | undefined {
  return stockLines().find((line) => line.sku === sku);
}

export type Rupture = { product: string; variant: string; sku: string };

export function outOfStock(): Rupture[] {
  return stockLines()
    .filter((line) => stockLevel(line) === 'out')
    .map(({ product, variant, sku }) => ({ product, variant, sku }));
}

/* ------------------------------------------------------------------------- */

export type TopProduct = {
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  revenueCents: number;
};

/** Volumes constatés sur sept jours ; les autres périodes s'en déduisent. */
const TOP_PRODUCTS_7D: TopProduct[] = [
  { name: 'Canapé Oslo', sku: 'MOB-OSL-3P-GRI', quantity: 4, unit: 'pièces', revenueCents: 359600 },
  { name: 'Casque Aurea', sku: 'ELE-AUR-BT-NOI', quantity: 14, unit: 'pièces', revenueCents: 209440 },
  { name: 'Lampe Arc', sku: 'MOB-ARC-LAI', quantity: 12, unit: 'pièces', revenueCents: 112800 },
  { name: 'Riz basmati bio', sku: 'ALI-RIZ-BAS-BIO', quantity: 62.5, unit: 'kg', revenueCents: 112500 },
  { name: 'Miel de châtaignier', sku: 'ALI-MIE-CHA-500', quantity: 41.5, unit: 'kg', revenueCents: 74700 },
];

export function topProducts(days: number): TopProduct[] {
  const factor = days / 7;

  return TOP_PRODUCTS_7D.map((product) => ({
    ...product,
    // Les quantités au poids gardent une décimale, les unités restent entières.
    quantity:
      product.unit === 'pièces'
        ? Math.round(product.quantity * factor)
        : Math.round(product.quantity * factor * 10) / 10,
    revenueCents: Math.round(product.revenueCents * factor),
  }));
}

/* ------------------------------------------------------------------------- */

export type ExpiringLot = {
  lotNumber: string;
  product: string;
  sku: string;
  quantity: number;
  unit: string;
  expiresAt: string;
};

/** Un lot par son numéro ; `undefined` si le numéro n'existe pas. */
export function lotByNumber(lotNumber: string, now: Date): ExpiringLot | undefined {
  return expiringLots(now).find((lot) => lot.lotNumber === lotNumber);
}

/** Lots consommables classés au plus court — l'ordre de sortie en FEFO. */
export function expiringLots(now: Date): ExpiringLot[] {
  return [
    { lotNumber: 'L-24-0417', product: 'Miel de châtaignier', sku: 'ALI-MIE-CHA-500', quantity: 12.5, unit: 'kg', expiresAt: daysFromNow(now, 1) },
    { lotNumber: 'L-24-0392', product: 'Riz basmati bio', sku: 'ALI-RIZ-BAS-BIO', quantity: 48, unit: 'kg', expiresAt: daysFromNow(now, 3) },
    { lotNumber: 'L-24-0401', product: 'Huile d’olive vierge', sku: 'ALI-HUI-OLI-1L', quantity: 26.75, unit: 'L', expiresAt: daysFromNow(now, 5) },
    { lotNumber: 'L-24-0388', product: 'Café Arabica moulu', sku: 'ALI-CAF-ARA-250', quantity: 9.2, unit: 'kg', expiresAt: daysFromNow(now, 6) },
    { lotNumber: 'L-24-0405', product: 'Confiture d’abricot', sku: 'ALI-CON-ABR-370', quantity: 31, unit: 'pots', expiresAt: daysFromNow(now, 7) },
  ];
}
