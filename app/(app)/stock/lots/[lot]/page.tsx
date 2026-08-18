import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Package } from 'lucide-react';
import { DetailHeader } from '@/components/layout/detail-header';
import { Badge, Dot } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Card, CardHeader, EmptyState } from '@/components/ui/card';
import { DefinitionList } from '@/components/ui/definition-list';
import { Cell, NumCell, Row, Table } from '@/components/ui/table';
import { dayMonth, money, number, shortDate, untilDay } from '@/lib/format';
import { lotByNumber } from '@/lib/data/stock';
import { ORDER_STATUSES, listOrdersByLot } from '@/lib/data/orders';
import { getSession } from '@/lib/current-session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/stock/lots/[lot]'>) {
  const { lot } = await params;
  return { title: `Lot ${decodeURIComponent(lot)} — Comptoir` };
}

export default async function LotPage({ params }: PageProps<'/stock/lots/[lot]'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const { lot: lotNumber } = await params;
  const now = new Date();
  const lot = await lotByNumber(session, decodeURIComponent(lotNumber));

  if (!lot) notFound();

  const daysLeft = Math.round((Date.parse(lot.expiresAt) - now.getTime()) / 86_400_000);
  const tone = daysLeft <= 2 ? 'danger' : daysLeft <= 7 ? 'warning' : 'success';

  /* Le point du lot : retrouver *qui* l'a reçu. C'est ce qui transforme un
     rappel produit en quelques courriels ciblés au lieu d'un message à toute
     la base — et c'est pour ça que `OrderItem.lotNumbers` existe. */
  const affected = await listOrdersByLot(session, lot.lotNumber);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <DetailHeader
        backHref="/stock"
        backLabel="Stock"
        title={lot.lotNumber}
        mono
        badge={
          <Badge tone={tone}>
            <Dot />
            {untilDay(lot.expiresAt, now)}
          </Badge>
        }
        subtitle={
          <>
            {lot.product}
            {' · '}
            <Link
              href={`/produits/${encodeURIComponent(lot.sku)}`}
              className="font-mono text-cobalt-600 hover:underline"
              translate="no"
            >
              {lot.sku}
            </Link>
          </>
        }
        action={
          <LinkButton href={`/api/export/lot/${encodeURIComponent(lot.lotNumber)}`} size="sm">
            <Package aria-hidden className="size-4" />
            Exporter les destinataires
          </LinkButton>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0">
          <CardHeader title="Lot" />
          <DefinitionList
            items={[
              { term: 'Quantité restante', value: `${number(lot.quantity)} ${lot.unit}`, numeric: true },
              { term: 'Date limite', value: dayMonth(lot.expiresAt), numeric: true },
              { term: 'Échéance', value: untilDay(lot.expiresAt, now) },
              { term: 'Ordre de sortie', value: 'FEFO' },
            ]}
          />
          <p className="border-t border-ink-200/70 px-5 py-3 text-xs text-ink-500">
            FEFO : le lot dont la date limite est la plus proche sort le premier, indépendamment de
            sa date d’entrée.
          </p>
        </Card>

        <Card className="min-w-0 lg:col-span-2">
          <CardHeader
            title="Commandes concernées"
            description="Les lots consommés sont conservés sur chaque ligne : un rappel produit vise ces clients-là, pas toute la base."
          />
          {affected.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Aucune commande n’a consommé ce lot"
              description="Il est encore entier en réserve. Rien à rappeler s’il devait être retiré."
              action={<LinkButton href="/stock">Retour au stock</LinkButton>}
            />
          ) : (
            <Table
              caption="Commandes ayant consommé ce lot"
              minWidth="min-w-180"
              columns={[
                { label: 'Numéro' },
                { label: 'Client' },
                { label: 'Statut' },
                { label: 'Date' },
                { label: 'Total', align: 'right' },
              ]}
            >
              {affected.map((order) => (
                <Row key={order.number}>
                  <Cell>
                    <Link
                      href={`/commandes/${encodeURIComponent(order.number)}`}
                      className="font-mono text-[13px] font-medium whitespace-nowrap text-cobalt-600 hover:underline"
                      translate="no"
                    >
                      {order.number}
                    </Link>
                  </Cell>
                  <Cell>
                    <Link
                      href={`/clients/${encodeURIComponent(order.email)}`}
                      className="font-medium text-ink-900 hover:text-cobalt-600 hover:underline"
                    >
                      {order.customer}
                    </Link>
                    <span className="mt-0.5 block text-xs text-ink-500">{order.email}</span>
                  </Cell>
                  <Cell>
                    <Badge tone={ORDER_STATUSES[order.status].tone}>
                      <Dot />
                      {ORDER_STATUSES[order.status].label}
                    </Badge>
                  </Cell>
                  <Cell className="whitespace-nowrap text-ink-500">
                    {shortDate(order.placedAt)}
                  </Cell>
                  <NumCell>{money(order.totalCents, order.currencyCode)}</NumCell>
                </Row>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
