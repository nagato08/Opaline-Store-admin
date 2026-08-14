import Link from 'next/link';
import { Download, UserSearch } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Card, EmptyState } from '@/components/ui/card';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { SearchField } from '@/components/ui/search-field';
import { Cell, NumCell, Row, Table } from '@/components/ui/table';
import { dayMonth, money, number } from '@/lib/format';
import { customers, lastOrderAt } from '@/lib/demo';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Clients — Comptoir' };

const KINDS = {
  account: { label: 'Avec compte', slug: 'compte' },
  guest: { label: 'Sans compte', slug: 'invite' },
};

export default async function CustomersPage({ searchParams }: PageProps<'/clients'>) {
  const params = await searchParams;
  const kind = (Object.keys(KINDS) as Array<keyof typeof KINDS>).find(
    (key) => KINDS[key].slug === params.type,
  );
  const query = typeof params.q === 'string' ? params.q.trim() : '';

  const now = new Date();
  const all = customers();
  const filtered = all
    .filter((customer) => (kind ? customer.kind === kind : true))
    .filter((customer) =>
      query
        ? `${customer.name} ${customer.email}`
            .toLocaleLowerCase('fr')
            .includes(query.toLocaleLowerCase('fr'))
        : true,
    );

  const tabs = [
    { label: 'Tous', count: all.length },
    ...(Object.keys(KINDS) as Array<keyof typeof KINDS>).map((key) => ({
      value: KINDS[key].slug,
      label: KINDS[key].label,
      count: all.filter((customer) => customer.kind === key).length,
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Clients"
        count={`${number(filtered.length)} affichés`}
        description="Une commande peut être passée sans compte. Distinguer les deux évite de promettre un historique à quelqu’un qui n’en a pas."
        action={
          <LinkButton href="/api/export/clients" size="sm">
            <Download aria-hidden className="size-4" />
            Exporter
          </LinkButton>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={tabs}
          current={kind && KINDS[kind].slug}
          param="type"
          basePath="/clients"
        />
        <SearchField
          action="/clients"
          defaultValue={query}
          label="Rechercher un client par nom ou courriel"
          placeholder="Nom, courriel…"
        />
      </div>

      <Card className="min-w-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={UserSearch}
            title="Aucun client ne correspond"
            description="Aucune fiche ne répond à cette recherche. Vérifiez l’orthographe ou revenez à la liste complète."
            action={<LinkButton href="/clients">Voir tous les clients</LinkButton>}
          />
        ) : (
          <Table
            caption="Clients, du plus dépensier au moins dépensier"
            minWidth="min-w-200"
            columns={[
              { label: 'Client' },
              { label: 'Compte' },
              { label: 'Pays' },
              { label: 'Dernière commande' },
              { label: 'Commandes', align: 'right' },
              { label: 'Total dépensé', align: 'right' },
            ]}
          >
            {filtered.map((customer) => (
              <Row key={customer.email}>
                <Cell>
                  <Link
                    href={`/clients/${encodeURIComponent(customer.email)}`}
                    className="font-medium text-ink-900 hover:text-cobalt-600 hover:underline"
                  >
                    {customer.name}
                  </Link>
                  <span className="mt-0.5 block text-xs text-ink-500">{customer.email}</span>
                </Cell>
                <Cell>
                  {customer.kind === 'account' ? (
                    <span className="text-ink-600">Avec compte</span>
                  ) : (
                    <Badge tone="neutral">Invité</Badge>
                  )}
                </Cell>
                <Cell className="text-ink-600">
                  {/* Le pays n'est pas décoratif : il décide de l'affichage TTC
                      ou hors taxe, donc de la lecture des montants ci-contre. */}
                  {customer.country === 'FR' ? 'France' : 'Canada'}
                </Cell>
                {/* La date seule : l'heure d'une commande passée il y a trois
                    semaines n'apprend rien, et douze lignes affichant la même
                    minute donnent l'impression d'une donnée inventée. */}
                <Cell className="whitespace-nowrap text-ink-500">
                  {dayMonth(lastOrderAt(customer, now))}
                </Cell>
                <Cell align="right">
                  <span data-numeric className="font-mono text-ink-600">
                    {number(customer.orders)}
                  </span>
                </Cell>
                <NumCell>{money(customer.spentCents)}</NumCell>
              </Row>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
