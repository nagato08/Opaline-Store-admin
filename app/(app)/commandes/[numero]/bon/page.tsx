import { notFound, redirect } from 'next/navigation';
import { DetailHeader } from '@/components/layout/detail-header';
import { Cell, NumCell, Row, Table } from '@/components/ui/table';
import { money, number, shortDate } from '@/lib/format';
import { getOrderDetail } from '@/lib/data/orders';
import { getSession } from '@/lib/current-session';
import { PrintButton } from './print-button';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/commandes/[numero]/bon'>) {
  const { numero } = await params;
  return { title: `Bon de préparation ${decodeURIComponent(numero)} — Comptoir` };
}

/**
 * Bon de préparation.
 *
 * Le document qu'on emporte dans la réserve pour aller chercher les articles.
 * Ce n'est ni une facture — elle a son numéro légal et un format contraint —
 * ni un bon de livraison : aucun prix n'y figure hors rappel du total, parce
 * que ce qui compte à la préparation est le SKU, la quantité et le numéro de
 * lot.
 *
 * Les numéros de lot sont imprimés quand ils existent : c'est la seule façon
 * de cibler un rappel produit après coup, et les relever au moment de
 * l'emballage est le seul moment où c'est faisable sans rouvrir les colis.
 */
export default async function PickingSlipPage({ params }: PageProps<'/commandes/[numero]/bon'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const { numero } = await params;
  const detail = await getOrderDetail(session, decodeURIComponent(numero));
  if (!detail) notFound();

  const { order, shippingAddress } = detail;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div data-no-print>
        <DetailHeader
          backHref={`/commandes/${encodeURIComponent(order.number)}`}
          backLabel={order.number}
          title="Bon de préparation"
          action={<PrintButton />}
        />
      </div>

      <article className="rounded-card bg-surface p-8 shadow-card print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-200 pb-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900">Bon de préparation</h1>
            <p className="mt-1 font-mono text-sm text-ink-600" translate="no">
              {order.number}
            </p>
          </div>
          <dl className="text-right text-sm">
            <dt className="text-ink-500">Commandé le</dt>
            <dd className="text-ink-900">{shortDate(order.placedAt)}</dd>
            <dt className="mt-2 text-ink-500">Articles</dt>
            <dd data-numeric className="font-mono text-ink-900">
              {number(order.itemCount)}
            </dd>
          </dl>
        </header>

        <section className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">
              Livrer à
            </h2>
            {shippingAddress ? (
              <address className="mt-1.5 text-sm not-italic text-ink-900">
                {shippingAddress.firstName} {shippingAddress.lastName}
                <br />
                {shippingAddress.line1}
                {shippingAddress.line2 ? (
                  <>
                    <br />
                    {shippingAddress.line2}
                  </>
                ) : null}
                <br />
                {shippingAddress.postalCode} {shippingAddress.city}
                <br />
                {shippingAddress.countryCode}
                {shippingAddress.phone ? (
                  <>
                    <br />
                    <span className="font-mono">{shippingAddress.phone}</span>
                  </>
                ) : null}
              </address>
            ) : (
              <p className="mt-1.5 text-sm text-ink-500">Aucune adresse de livraison.</p>
            )}
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">
              Livraison
            </h2>
            <p className="mt-1.5 text-sm text-ink-900">{order.shippingLabel}</p>
            <h2 className="mt-4 text-xs font-semibold tracking-wider text-ink-500 uppercase">
              Client
            </h2>
            <p className="mt-1.5 text-sm text-ink-900">{order.email}</p>
          </div>
        </section>

        <section className="mt-6 min-w-0">
          <Table
            caption="Articles à préparer, avec leur référence, leur quantité et leurs numéros de lot"
            minWidth="min-w-0"
            columns={[
              { label: 'Article' },
              { label: 'Lots' },
              { label: 'Quantité', align: 'right' },
              { label: 'Préparé', align: 'right' },
            ]}
          >
            {order.lines.map((line) => (
              <Row key={line.id}>
                <Cell>
                  <span className="block text-ink-900">{line.label}</span>
                  <span className="mt-0.5 block font-mono text-xs text-ink-500" translate="no">
                    {line.sku}
                    {line.variantName ? ` · ${line.variantName}` : ''}
                  </span>
                </Cell>
                <Cell className="font-mono text-xs text-ink-600">
                  {line.lotNumbers.length > 0 ? line.lotNumbers.join(', ') : '—'}
                </Cell>
                <NumCell>{number(line.quantity)}</NumCell>
                <Cell align="right">
                  {/* Une case à cocher sur papier : c'est le geste de celui qui
                      prépare, il n'a pas d'écran sous la main dans la réserve. */}
                  <span
                    aria-hidden
                    className="inline-block size-5 rounded-[3px] ring-1 ring-ink-400 ring-inset"
                  />
                  <span className="sr-only">À cocher une fois l’article prélevé</span>
                </Cell>
              </Row>
            ))}
          </Table>
        </section>

        <footer className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-ink-200 pt-5">
          <p className="max-w-xs text-xs text-ink-500">
            Document interne. Ce n’est ni une facture ni un bon de livraison — la facture porte un
            numéro légal distinct.
          </p>
          <p className="text-sm text-ink-600">
            Total commande{' '}
            <span data-numeric className="font-mono font-medium text-ink-900">
              {money(order.totalCents, order.currencyCode)}
            </span>
          </p>
        </footer>
      </article>
    </div>
  );
}
