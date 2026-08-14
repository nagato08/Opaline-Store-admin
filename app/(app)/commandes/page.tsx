import Link from 'next/link';
import { Download, Inbox, Package } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge, Dot } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Card, EmptyState } from '@/components/ui/card';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { SearchField } from '@/components/ui/search-field';
import { Cell, NumCell, Row, Table } from '@/components/ui/table';
import { money, number, shortDate } from '@/lib/format';
import { ORDER_STATUSES, orders, ordersByStatus, toStatusKey } from '@/lib/demo';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Commandes — Comptoir' };

export default async function OrdersPage({ searchParams }: PageProps<'/commandes'>) {
  const params = await searchParams;
  const status = toStatusKey(params.statut);
  const query = typeof params.q === 'string' ? params.q.trim() : '';

  const now = new Date();
  const all = orders(now);
  const counts = ordersByStatus();

  /* Le filtre par statut et la recherche s'appliquent l'un après l'autre : on
     cherche « Berger dans ce qui reste à préparer », pas l'un ou l'autre. */
  const filtered = all
    .filter((order) => (status ? order.status === status : true))
    .filter((order) =>
      query
        ? `${order.number} ${order.customer} ${order.email}`
            .toLocaleLowerCase('fr')
            .includes(query.toLocaleLowerCase('fr'))
        : true,
    );

  /* Le filtre courant est repassé à l'export sous la forme exacte où l'écran
     le lit : `statut` doit être le slug validé, pas la valeur brute de l'URL,
     sinon `?statut=nimporte-quoi` exporterait tout en prétendant filtrer. */
  const exportParams = new URLSearchParams();
  if (status) exportParams.set('statut', ORDER_STATUSES[status].slug);
  if (query) exportParams.set('q', query);
  const exportQuery = exportParams.size > 0 ? `?${exportParams}` : '';

  const tabs = [
    { label: 'Toutes', count: all.length },
    ...counts.map((slice) => ({
      value: ORDER_STATUSES[slice.key].slug,
      label: slice.label,
      count: all.filter((order) => order.status === slice.key).length,
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Commandes"
        count={`${number(filtered.length)} affichées`}
        description="Les douze dernières commandes reçues. Une commande fige son prix, ses taxes et ses adresses : la modifier n’altère jamais le catalogue."
        action={
          <>
            {/* L'export reprend le filtre affiché : exporter le carnet entier
                alors qu'on regarde les commandes à préparer oblige à refaire
                le tri dans le tableur. */}
            <LinkButton href={`/api/export/commandes${exportQuery}`} size="sm">
              <Download aria-hidden className="size-4" />
              Exporter
            </LinkButton>
            <LinkButton href="/commandes/nouvelle" variant="primary" size="sm" className="whitespace-nowrap">
              Nouvelle commande
            </LinkButton>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs tabs={tabs} current={status && ORDER_STATUSES[status].slug} param="statut" basePath="/commandes" />
        <SearchField
          action="/commandes"
          defaultValue={query}
          label="Rechercher une commande par numéro, nom ou courriel"
          placeholder="Numéro, client, courriel…"
        />
      </div>

      <Card className="min-w-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Aucune commande ne correspond"
            description="Aucune commande ne répond à ce filtre. Élargissez la recherche ou revenez à la liste complète."
            action={<LinkButton href="/commandes">Voir toutes les commandes</LinkButton>}
          />
        ) : (
          /* Six colonnes et pas huit. « Paiement » redit ce que le statut
             annonce déjà — « En attente de paiement » ne laisse aucun doute —
             et le nombre d'articles tient sous le numéro. À huit colonnes, le
             total sortait du cadre : c'est précisément la valeur qu'on vient
             lire. */
          <Table
            caption="Commandes reçues, de la plus récente à la plus ancienne"
            minWidth="min-w-200"
            columns={[
              { label: 'Numéro' },
              { label: 'Client' },
              { label: 'Statut' },
              { label: 'Livraison' },
              { label: 'Date' },
              { label: 'Total', align: 'right' },
            ]}
          >
            {filtered.map((order) => (
              <Row key={order.number}>
                <Cell>
                  <Link
                    href={`/commandes/${order.number}`}
                    className="font-mono text-[13px] font-medium whitespace-nowrap text-cobalt-600 hover:underline"
                    translate="no"
                  >
                    {order.number}
                  </Link>
                  <span className="mt-0.5 block text-xs text-ink-500">
                    <span data-numeric>{number(order.itemCount)}</span>{' '}
                    {order.itemCount > 1 ? 'articles' : 'article'}
                  </span>
                </Cell>
                <Cell>
                  <span className="block font-medium text-ink-900">{order.customer}</span>
                  <span className="mt-0.5 block text-xs text-ink-500">{order.email}</span>
                </Cell>
                <Cell>
                  <Badge tone={ORDER_STATUSES[order.status].tone}>
                    <Dot />
                    {ORDER_STATUSES[order.status].label}
                  </Badge>
                </Cell>
                <Cell className="text-ink-600">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <Package aria-hidden className="size-3.5 shrink-0 text-ink-400" />
                    {order.shipping}
                  </span>
                </Cell>
                <Cell className="whitespace-nowrap text-ink-500">{shortDate(order.placedAt)}</Cell>
                <NumCell>
                  {money(order.totalCents)}
                  {/* Le Canada affiche hors taxe et ajoute TPS/TVQ à la caisse :
                      un total canadien ne se compare pas à un total français
                      sans le dire. */}
                  {order.country === 'CA' ? (
                    <span className="ml-1.5 font-sans text-xs font-normal text-ink-400">
                      HT
                    </span>
                  ) : null}
                </NumCell>
              </Row>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
