import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PackageX } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge, Dot } from '@/components/ui/badge';
import { Card, EmptyState } from '@/components/ui/card';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { Cell, Row, Table } from '@/components/ui/table';
import { number, shortDate } from '@/lib/format';
import { RETURN_STATUSES, listReturns, toReturnStatus } from '@/lib/data/engagement';
import { getSession } from '@/lib/current-session';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Retours — Comptoir' };

/* Les sept états de l'API ne font pas sept onglets : quatre d'entre eux sont
   des fins de parcours qu'on ne consulte qu'exceptionnellement. Seuls les
   états sur lesquels on agit méritent un onglet. */
const TABBED = ['REQUESTED', 'APPROVED', 'RECEIVED', 'COMPLETED'] as const;

export default async function ReturnsPage({ searchParams }: PageProps<'/retours'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const params = await searchParams;
  const status = toReturnStatus(params.etat);
  const { returns, total } = await listReturns(session, status);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Retours"
        count={`${number(returns.length)} affichés`}
        description="Les demandes de retour des clients. Accepter n’engage rien tant que le colis n’est pas revenu — c’est la réception qui déclenche le remboursement."
      />

      <div className="mb-4">
        <FilterTabs
          tabs={[
            { label: 'Tous', count: status ? undefined : total },
            ...TABBED.map((key) => ({
              value: RETURN_STATUSES[key].slug,
              label: RETURN_STATUSES[key].label,
            })),
          ]}
          current={status && RETURN_STATUSES[status].slug}
          param="etat"
          basePath="/retours"
        />
      </div>

      <Card className="min-w-0">
        {returns.length === 0 ? (
          <EmptyState
            icon={PackageX}
            title="Aucun retour"
            description="Rien à traiter. Les demandes arrivent depuis l’espace client, après une commande livrée."
          />
        ) : (
          <Table
            caption="Demandes de retour, leur commande d’origine et leur état de traitement"
            minWidth="min-w-180"
            columns={[
              { label: 'Demande' },
              { label: 'Commande' },
              { label: 'Client' },
              { label: 'Articles', align: 'right' },
              { label: 'État' },
              { label: 'Reçue le' },
            ]}
          >
            {returns.map((entry) => (
              <Row key={entry.id}>
                <Cell>
                  <Link
                    href={`/retours/${entry.id}`}
                    className="font-mono font-medium text-ink-900 hover:text-cobalt-600 hover:underline"
                  >
                    {entry.number}
                  </Link>
                </Cell>
                <Cell>
                  <Link
                    href={`/commandes/${encodeURIComponent(entry.orderNumber)}`}
                    className="font-mono text-xs text-cobalt-600 hover:underline"
                  >
                    {entry.orderNumber}
                  </Link>
                </Cell>
                <Cell className="text-ink-600">{entry.email}</Cell>
                <Cell align="right">
                  <span data-numeric className="font-mono text-ink-600">
                    {number(entry.quantity)}
                  </span>
                </Cell>
                <Cell>
                  <Badge tone={RETURN_STATUSES[entry.status].tone}>
                    <Dot />
                    {RETURN_STATUSES[entry.status].label}
                  </Badge>
                </Cell>
                <Cell className="whitespace-nowrap text-ink-600">{shortDate(entry.createdAt)}</Cell>
              </Row>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
