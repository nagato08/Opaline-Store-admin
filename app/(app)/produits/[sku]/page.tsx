import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Boxes, ImageOff } from 'lucide-react';
import { DetailHeader } from '@/components/layout/detail-header';
import { Badge, Dot } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { DefinitionList } from '@/components/ui/definition-list';
import { Cell, NumCell, Row, Table } from '@/components/ui/table';
import { money, number, untilDay } from '@/lib/format';
import { PRODUCT_STATUSES, getProductBySku } from '@/lib/data/products';
import { expiringLotsForSkus } from '@/lib/data/stock';
import { getSession } from '@/lib/current-session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/produits/[sku]'>) {
  const { sku } = await params;
  const session = await getSession();
  const product = session ? await getProductBySku(session, decodeURIComponent(sku)) : null;
  return { title: `${product?.name ?? 'Produit introuvable'} — Comptoir` };
}

const LEVELS = {
  out: { label: 'Rupture', tone: 'danger' as const },
  low: { label: 'Sous le seuil', tone: 'warning' as const },
  ok: { label: 'Suffisant', tone: 'success' as const },
};

function stockLevel(onHand: number, reserved: number, threshold: number): keyof typeof LEVELS {
  const available = onHand - reserved;
  if (available <= 0) return 'out';
  return available <= threshold ? 'low' : 'ok';
}

export default async function ProductPage({ params }: PageProps<'/produits/[sku]'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const { sku } = await params;
  const product = await getProductBySku(session, decodeURIComponent(sku));

  if (!product) notFound();

  const now = new Date();
  const variants = product.variants;
  const lots = await expiringLotsForSkus(session, variants.map((variant) => variant.sku));
  const status = PRODUCT_STATUSES[product.status];
  const totalReserved = variants.reduce((sum, v) => sum + v.reserved, 0);
  const totalThreshold = variants.reduce((sum, v) => sum + v.threshold, 0);
  const level = stockLevel(product.onHand, totalReserved, totalThreshold);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <DetailHeader
        backHref="/produits"
        backLabel="Produits"
        title={product.name}
        badge={
          <Badge tone={status.tone}>
            <Dot />
            {status.label}
          </Badge>
        }
        subtitle={
          <>
            <span className="font-mono" translate="no">
              {product.sku}
            </span>
            {' · '}
            {product.category}
          </>
        }
        action={
          <>
            <LinkButton href="/stock" size="sm">
              <Boxes aria-hidden className="size-4" />
              Voir le stock
            </LinkButton>
            <LinkButton href={`/produits/${encodeURIComponent(product.sku)}/modifier`} size="sm" variant="primary">
              Modifier
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          <Card className="min-w-0">
            <CardHeader
              title="Déclinaisons"
              description="Le pas de vente impose le multiple commandable : l’alimentaire au poids ne se commande pas au gramme près."
            />
            <Table
              caption="Déclinaisons du produit, avec prix, stock et pas de vente"
              minWidth="min-w-180"
              columns={[
                { label: 'Déclinaison' },
                { label: 'Pas de vente', align: 'right' },
                { label: 'En stock', align: 'right' },
                { label: 'Prix', align: 'right' },
              ]}
            >
              {variants.map((variant) => (
                <Row key={variant.sku}>
                  <Cell>
                    <span className="block font-medium text-ink-900">{variant.label}</span>
                    <span className="mt-0.5 block font-mono text-xs text-ink-500" translate="no">
                      {variant.sku}
                    </span>
                  </Cell>
                  <NumCell>
                    {number(variant.stepQuantity)}{' '}
                    <span className="font-sans text-xs font-normal text-ink-500">
                      {variant.unit}
                    </span>
                  </NumCell>
                  <NumCell>
                    {number(variant.onHand)}{' '}
                    <span className="font-sans text-xs font-normal text-ink-500">
                      {variant.unit}
                    </span>
                  </NumCell>
                  <NumCell>{money(variant.priceCents)}</NumCell>
                </Row>
              ))}
            </Table>
          </Card>

          {lots.length > 0 ? (
            <Card className="min-w-0">
              <CardHeader
                title="Lots ouverts"
                description="Classés au plus court : c’est l’ordre de sortie en FEFO, et il n’est pas négociable sur du consommable."
              />
              <Table
                caption="Lots du produit et leur date limite"
                minWidth="min-w-160"
                columns={[
                  { label: 'Lot' },
                  { label: 'Échéance' },
                  { label: 'Quantité', align: 'right' },
                ]}
              >
                {lots.map((lot) => (
                  <Row key={lot.lotNumber}>
                    <Cell>
                      <Link
                        href={`/stock/lots/${lot.lotNumber}`}
                        className="font-mono text-[13px] font-medium text-cobalt-600 hover:underline"
                        translate="no"
                      >
                        {lot.lotNumber}
                      </Link>
                    </Cell>
                    <Cell className="text-ink-600">{untilDay(lot.expiresAt, now)}</Cell>
                    <NumCell>
                      {number(lot.quantity)}{' '}
                      <span className="font-sans text-xs font-normal text-ink-500">{lot.unit}</span>
                    </NumCell>
                  </Row>
                ))}
              </Table>
            </Card>
          ) : null}
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="min-w-0">
            <CardHeader
              title="Photos"
              description={
                product.images.length > 0
                  ? 'La première illustre le catalogue et la recherche.'
                  : undefined
              }
            />
            {product.images.length > 0 ? (
              <ul className="grid grid-cols-3 gap-2 p-5 pt-0">
                {product.images.map((image, index) => (
                  <li key={image.url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element -- cohérent avec le reste du back-office, sans `next/image` nulle part */}
                    <img
                      src={image.url}
                      alt=""
                      className="aspect-square w-full rounded-control object-cover ring-1 ring-ink-200 ring-inset"
                    />
                    {index === 0 ? (
                      <span className="absolute top-1 left-1 rounded-full bg-cobalt-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Couverture
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-ink-100">
                  <ImageOff aria-hidden className="size-5 text-ink-500" />
                </span>
                <p className="mt-3 text-sm text-ink-500">Aucune photo pour ce produit.</p>
                <Link
                  href={`/produits/${encodeURIComponent(product.sku)}/modifier`}
                  className="mt-2 text-sm font-medium text-cobalt-600 hover:underline"
                >
                  En ajouter
                </Link>
              </div>
            )}
          </Card>

          <Card className="min-w-0">
            <CardHeader title="Prix" />
            <DefinitionList
              items={[
                { term: 'Prix de base', value: money(product.priceCents), numeric: true },
                {
                  term: 'Éco-participation',
                  value:
                    product.ecoTaxCents > 0 ? (
                      money(product.ecoTaxCents)
                    ) : (
                      <span className="text-ink-300">—</span>
                    ),
                  numeric: true,
                },
                {
                  term: 'Régime de taxe',
                  value: product.taxClassName ?? <span className="text-ink-300">—</span>,
                },
              ]}
            />
            {product.ecoTaxCents > 0 ? (
              <p className="border-t border-ink-200/70 px-5 py-3 text-xs text-ink-500">
                L’éco-participation est une obligation légale française sur le mobilier et
                l’électronique. Elle s’affiche à part, jamais fondue dans le prix.
              </p>
            ) : null}
          </Card>

          {variants.length > 0 ? (
            <Card className="min-w-0">
              <CardHeader
                title="Stock"
                description={variants.length > 1 ? 'Cumul de toutes les déclinaisons' : undefined}
                action={
                  <Badge tone={LEVELS[level].tone}>
                    <Dot />
                    {LEVELS[level].label}
                  </Badge>
                }
              />
              <DefinitionList
                items={[
                  {
                    term: 'Physique',
                    value: `${number(product.onHand)} ${product.unit}`,
                    numeric: true,
                  },
                  {
                    term: 'Réservé par des commandes',
                    value: `${number(totalReserved)} ${product.unit}`,
                    numeric: true,
                  },
                  {
                    term: 'Disponible à la vente',
                    value: `${number(product.onHand - totalReserved)} ${product.unit}`,
                    numeric: true,
                  },
                  {
                    term: 'Seuil d’alerte',
                    value: `${number(totalThreshold)} ${product.unit}`,
                    numeric: true,
                  },
                ]}
              />
              <p className="border-t border-ink-200/70 px-5 py-3 text-xs text-ink-500">
                C’est le disponible — physique moins réservé — qui décide d’une rupture, jamais la
                quantité en rayon.
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
