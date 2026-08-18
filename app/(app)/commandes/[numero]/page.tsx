import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Check, FileText, MapPin, Printer } from 'lucide-react';
import { DetailHeader } from '@/components/layout/detail-header';
import { Badge, Dot } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { DefinitionList } from '@/components/ui/definition-list';
import { Cell, NumCell, Row, Table } from '@/components/ui/table';
import { money, number, shortDate } from '@/lib/format';
import { ORDER_STATUSES, getOrderDetail } from '@/lib/data/orders';
import { getSession } from '@/lib/current-session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/commandes/[numero]'>) {
  const { numero } = await params;
  return { title: `${decodeURIComponent(numero)} — Comptoir` };
}

export default async function OrderPage({ params }: PageProps<'/commandes/[numero]'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const { numero } = await params;
  const detail = await getOrderDetail(session, decodeURIComponent(numero));

  // Un numéro inconnu n'est pas une erreur serveur : c'est une page qui
  // n'existe pas, et elle doit répondre 404 pour ne pas être indexée ni mise
  // en cache comme une fiche valide.
  if (!detail) notFound();

  const { order, totals, timeline, shippingAddress } = detail;
  const status = ORDER_STATUSES[order.status];
  const inclusive = order.pricesIncludeTax;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <DetailHeader
        backHref="/commandes"
        backLabel="Commandes"
        title={order.number}
        mono
        badge={
          <Badge tone={status.tone}>
            <Dot />
            {status.label}
          </Badge>
        }
        subtitle={
          <>
            Passée le {shortDate(order.placedAt)} par{' '}
            <Link
              href={`/clients/${encodeURIComponent(order.email)}`}
              className="font-medium text-cobalt-600 hover:underline"
            >
              {order.customer}
            </Link>
          </>
        }
        action={
          <>
            <LinkButton href={`/api/export/commande/${encodeURIComponent(order.number)}`} size="sm">
              <FileText aria-hidden className="size-4" />
              Exporter la ligne
            </LinkButton>
            {/* La facture PDF n'existe pas encore : le numéro légal est émis,
                le fichier attend l'identité légale de l'entreprise. Le bouton
                est donc absent plutôt que présent et inerte. */}
            <LinkButton href={`/commandes/${encodeURIComponent(order.number)}/bon`} size="sm" variant="primary">
              <Printer aria-hidden className="size-4" />
              Bon de préparation
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <Card className="min-w-0">
            <CardHeader
              title="Articles"
              description={
                inclusive
                  ? 'Prix figés à la commande, toutes taxes comprises comme l’impose la France.'
                  : 'Prix figés à la commande, hors taxe : le Canada ajoute TPS et TVQ à la caisse.'
              }
            />
            <Table
              caption="Lignes de la commande, avec quantité, prix unitaire figé et remise"
              minWidth="min-w-200"
              columns={[
                { label: 'Article' },
                { label: 'Quantité', align: 'right' },
                { label: 'Prix unitaire', align: 'right' },
                { label: 'Remise', align: 'right' },
                { label: 'Total', align: 'right' },
              ]}
            >
              {order.lines.map((line) => (
                <Row key={line.sku}>
                  <Cell>
                    <span className="block font-medium text-ink-900">{line.label}</span>
                    <span className="mt-0.5 block font-mono text-xs text-ink-500" translate="no">
                      {line.sku}
                    </span>
                    {/* Les lots consommés sont conservés sur la ligne : sans
                        eux, un rappel produit oblige à contacter tous les
                        acheteurs au lieu des seuls concernés. */}
                    {line.lotNumbers?.length ? (
                      <span className="mt-1.5 flex flex-wrap gap-1">
                        {line.lotNumbers.map((lot) => (
                          <Link key={lot} href={`/stock/lots/${lot}`}>
                            <Badge tone="neutral" className="hover:ring-ink-300">
                              Lot {lot}
                            </Badge>
                          </Link>
                        ))}
                      </span>
                    ) : null}
                  </Cell>
                  <NumCell>{number(line.quantity)}</NumCell>
                  <NumCell>{money(line.unitPriceCents, order.currencyCode)}</NumCell>
                  <NumCell>
                    {line.discountCents > 0 ? (
                      <span className="text-success">−{money(line.discountCents, order.currencyCode)}</span>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </NumCell>
                  <NumCell>{money(line.totalCents, order.currencyCode)}</NumCell>
                </Row>
              ))}
            </Table>
          </Card>

          <Card className="mt-6 min-w-0">
            <CardHeader
              title="Totaux"
              description="La remise s’applique avant la taxe : elle réduit la base taxable, sinon la facture n’est pas conforme."
            />
            <DefinitionList
              items={[
                { term: 'Sous-total', value: money(totals.subtotalCents, order.currencyCode), numeric: true },
                ...(totals.discountCents > 0
                  ? [
                      {
                        term: 'Remises',
                        value: (
                          <span className="text-success">
                            −{money(totals.discountCents, order.currencyCode)}
                          </span>
                        ),
                        numeric: true,
                      },
                    ]
                  : []),
                {
                  term: inclusive ? 'Base hors taxe après remise' : 'Base taxable après remise',
                  value: money(totals.taxableCents, order.currencyCode),
                  numeric: true,
                },
                ...totals.taxBreakdown.map((bucket) => ({
                  term: `${bucket.name} sur ${money(bucket.baseCents, order.currencyCode)}`,
                  value: money(bucket.taxCents, order.currencyCode),
                  numeric: true,
                })),
                ...(totals.ecoTaxCents > 0
                  ? [
                      {
                        term: 'Éco-participation',
                        value: money(totals.ecoTaxCents, order.currencyCode),
                        numeric: true,
                      },
                    ]
                  : []),
                {
                  term: `Livraison — ${order.shippingLabel}`,
                  value: money(totals.shippingCents, order.currencyCode),
                  numeric: true,
                },
              ]}
            />
            <div className="flex items-baseline justify-between gap-6 border-t border-ink-200 px-5 py-4">
              <span className="text-sm font-semibold text-ink-900">
                Total {inclusive ? 'toutes taxes comprises' : 'hors taxe'}
              </span>
              <span
                data-numeric
                className="font-mono text-xl font-semibold whitespace-nowrap text-ink-900"
              >
                {money(totals.totalCents, order.currencyCode)}
              </span>
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="min-w-0">
            <CardHeader title="Suivi" description="Reconstruit depuis le statut courant" />
            <ol className="px-5 py-4">
              {timeline.map((entry, index) => (
                <li key={entry.label} className="flex gap-3 pb-5 last:pb-0">
                  <span className="flex flex-col items-center">
                    <span
                      aria-hidden
                      className={
                        entry.done
                          ? 'grid size-6 shrink-0 place-items-center rounded-full bg-cobalt-500 text-white'
                          : 'grid size-6 shrink-0 place-items-center rounded-full bg-ink-100 ring-1 ring-ink-200 ring-inset'
                      }
                    >
                      {entry.done ? <Check className="size-3.5" /> : null}
                    </span>
                    {index < timeline.length - 1 ? (
                      <span
                        aria-hidden
                        className={entry.done ? 'w-px flex-1 bg-cobalt-200' : 'w-px flex-1 bg-ink-200'}
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 pb-1">
                    <span
                      className={
                        entry.done
                          ? 'block text-sm font-medium text-ink-900'
                          : 'block text-sm font-medium text-ink-400'
                      }
                    >
                      {entry.label}
                      {entry.done ? null : (
                        <span className="ml-1.5 text-xs font-normal">— à venir</span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-500">{entry.detail}</span>
                    {entry.done ? (
                      <span className="mt-0.5 block font-mono text-xs text-ink-400" data-numeric>
                        {shortDate(entry.at)}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="min-w-0">
            <CardHeader
              title="Livraison"
              description="Adresse figée à la commande"
              action={<MapPin aria-hidden className="size-4 text-ink-400" />}
            />
            {shippingAddress ? (
              <address className="px-5 py-4 text-sm not-italic text-ink-700">
                <span className="block font-medium text-ink-900">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                </span>
                <span className="block">{shippingAddress.line1}</span>
                {shippingAddress.line2 ? <span className="block">{shippingAddress.line2}</span> : null}
                <span className="block">
                  <span data-numeric className="font-mono">
                    {shippingAddress.postalCode}
                  </span>{' '}
                  {shippingAddress.city}
                </span>
                <span className="block">{shippingAddress.countryCode}</span>
              </address>
            ) : (
              <p className="px-5 py-4 text-sm text-ink-500">Adresse non renseignée.</p>
            )}
            <DefinitionList
              className="border-t border-ink-200/70"
              items={[
                { term: 'Mode', value: order.shippingLabel },
                { term: 'Paiement', value: order.paymentLabel },
                { term: 'Courriel', value: order.email },
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
