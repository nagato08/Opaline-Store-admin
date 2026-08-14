import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, Download, Inbox, X } from 'lucide-react';
import { DetailHeader } from '@/components/layout/detail-header';
import { Badge, Dot } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Card, CardHeader, EmptyState } from '@/components/ui/card';
import { DefinitionList } from '@/components/ui/definition-list';
import { Cell, NumCell, Row, Table } from '@/components/ui/table';
import { money, number, shortDate } from '@/lib/format';
import { ORDER_STATUSES, customerByEmail, lastOrderAt, ordersOf } from '@/lib/demo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/clients/[email]'>) {
  const { email } = await params;
  const customer = customerByEmail(decodeURIComponent(email));
  return { title: `${customer?.name ?? 'Client introuvable'} — Comptoir` };
}

export default async function CustomerPage({ params }: PageProps<'/clients/[email]'>) {
  const { email } = await params;
  const customer = customerByEmail(decodeURIComponent(email));

  if (!customer) notFound();

  const now = new Date();
  const history = ordersOf(customer.email, now);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <DetailHeader
        backHref="/clients"
        backLabel="Clients"
        title={customer.name}
        badge={
          <Badge tone={customer.kind === 'account' ? 'brand' : 'neutral'}>
            {customer.kind === 'account' ? 'Avec compte' : 'Sans compte'}
          </Badge>
        }
        subtitle={customer.email}
        action={
          /* L'export des données d'une personne est un droit RGPD, pas une
             commodité : il doit être atteignable depuis sa fiche, sans passer
             par une demande écrite. */
          <LinkButton
            href={`/api/export/client/${encodeURIComponent(customer.email)}`}
            size="sm"
          >
            <Download aria-hidden className="size-4" />
            Exporter ses données
          </LinkButton>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader
            title="Commandes"
            description={
              customer.kind === 'guest'
                ? 'Commandes retrouvées par courriel : sans compte, il n’y a pas d’historique lié.'
                : 'Historique complet du compte.'
            }
          />
          {history.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Aucune commande sur la période"
              description="Ce client n’a pas de commande dans les douze dernières reçues."
              action={<LinkButton href="/commandes">Voir toutes les commandes</LinkButton>}
            />
          ) : (
            <Table
              caption="Commandes de ce client, de la plus récente à la plus ancienne"
              minWidth="min-w-160"
              columns={[
                { label: 'Numéro' },
                { label: 'Statut' },
                { label: 'Date' },
                { label: 'Total', align: 'right' },
              ]}
            >
              {history.map((order) => (
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
                    <Badge tone={ORDER_STATUSES[order.status].tone}>
                      <Dot />
                      {ORDER_STATUSES[order.status].label}
                    </Badge>
                  </Cell>
                  <Cell className="whitespace-nowrap text-ink-500">
                    {shortDate(order.placedAt)}
                  </Cell>
                  <NumCell>
                    {money(order.totalCents)}
                    {order.country === 'CA' ? (
                      <span className="ml-1.5 font-sans text-xs font-normal text-ink-400">HT</span>
                    ) : null}
                  </NumCell>
                </Row>
              ))}
            </Table>
          )}
        </Card>

        <div className="min-w-0 space-y-6">
          <Card className="min-w-0">
            <CardHeader title="Coordonnées" />
            <address className="px-5 py-4 text-sm not-italic text-ink-700">
              <span className="block font-medium text-ink-900">{customer.name}</span>
              <span className="block">{customer.address.line1}</span>
              <span className="block">
                <span data-numeric className="font-mono">
                  {customer.address.postalCode}
                </span>{' '}
                {customer.address.city}
              </span>
              <span className="block">{customer.address.country}</span>
            </address>
          </Card>

          <Card className="min-w-0">
            <CardHeader title="Activité" />
            <DefinitionList
              items={[
                { term: 'Commandes', value: number(customer.orders), numeric: true },
                { term: 'Total dépensé', value: money(customer.spentCents), numeric: true },
                {
                  term: 'Panier moyen',
                  value: money(Math.round(customer.spentCents / customer.orders)),
                  numeric: true,
                },
                {
                  term: 'Dernière commande',
                  value: shortDate(lastOrderAt(customer, now)),
                  numeric: true,
                },
                {
                  term: 'Points de fidélité',
                  value: number(customer.loyaltyPoints),
                  numeric: true,
                },
              ]}
            />
            <p className="border-t border-ink-200/70 px-5 py-3 text-xs text-ink-500">
              Les points s’accumulent ; leur utilisation au paiement n’est pas encore branchée.
            </p>
          </Card>

          <Card className="min-w-0">
            <CardHeader
              title="Consentements"
              description="Ils se retirent aussi bien qu’ils se donnent."
            />
            <ul className="divide-y divide-ink-200/70">
              {[
                { label: 'Lettre d’information', granted: customer.consents.newsletter },
                { label: 'Personnalisation des offres', granted: customer.consents.profiling },
              ].map((consent) => (
                <li
                  key={consent.label}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                >
                  <span className="text-ink-700">{consent.label}</span>
                  {/* La couleur seule exclurait les daltoniens : le mot porte
                      l'information, l'icône ne fait que l'accélérer. */}
                  <span
                    className={
                      consent.granted
                        ? 'inline-flex items-center gap-1.5 font-medium text-success'
                        : 'inline-flex items-center gap-1.5 text-ink-500'
                    }
                  >
                    {consent.granted ? (
                      <Check aria-hidden className="size-4" />
                    ) : (
                      <X aria-hidden className="size-4" />
                    )}
                    {consent.granted ? 'Accordé' : 'Refusé'}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
