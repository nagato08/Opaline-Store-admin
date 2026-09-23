import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { DetailHeader } from '@/components/layout/detail-header';
import { Badge, Dot } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { DefinitionList } from '@/components/ui/definition-list';
import { Cell, Row, Table } from '@/components/ui/table';
import { number, shortDate } from '@/lib/format';
import { RETURN_STATUSES, getReturn } from '@/lib/data/engagement';
import { getSession } from '@/lib/current-session';
import { ReturnActions } from './return-actions';
import { decide, receive } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Retour — Comptoir' };

export default async function ReturnPage({ params }: PageProps<'/retours/[id]'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const { id } = await params;
  const request = await getReturn(session, id);
  if (!request) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <DetailHeader
        backHref="/retours"
        backLabel="Retours"
        title={request.number}
        mono
        subtitle={
          <>
            Demandé le {shortDate(request.createdAt)} sur la commande{' '}
            <Link
              href={`/commandes/${encodeURIComponent(request.orderNumber)}`}
              className="font-medium text-cobalt-600 hover:underline"
            >
              {request.orderNumber}
            </Link>
          </>
        }
        badge={
          <Badge tone={RETURN_STATUSES[request.status].tone}>
            <Dot />
            {RETURN_STATUSES[request.status].label}
          </Badge>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          <ReturnActions
            request={request}
            decide={decide.bind(null, request.id)}
            receive={receive.bind(null, request.id)}
          />

          <Card className="min-w-0">
            <CardHeader
              title="Articles renvoyés"
              description="Les quantités sont décimales : l’alimentaire se vend au poids."
            />
            <Table
              caption="Articles de la demande de retour, avec leur motif et leur état déclaré"
              minWidth="min-w-0"
              columns={[
                { label: 'Quantité', align: 'right' },
                { label: 'Motif' },
                { label: 'État déclaré' },
                { label: 'Remis en vente' },
              ]}
            >
              {request.items.map((item) => (
                <Row key={item.id}>
                  <Cell align="right">
                    <span data-numeric className="font-mono text-ink-900">
                      {number(item.quantity)}
                    </span>
                  </Cell>
                  <Cell className="text-ink-600">{item.reason || '—'}</Cell>
                  <Cell className="text-ink-600">{item.condition || '—'}</Cell>
                  <Cell>
                    {item.isRestocked ? (
                      <Badge tone="success">Oui</Badge>
                    ) : (
                      <span className="text-ink-400">Non</span>
                    )}
                  </Cell>
                </Row>
              ))}
            </Table>
          </Card>

          {request.customerComment ? (
            <Card className="min-w-0">
              <CardHeader title="Message du client" />
              <p className="p-5 text-sm leading-relaxed whitespace-pre-line text-ink-700">
                {request.customerComment}
              </p>
            </Card>
          ) : null}
        </div>

        <div className="min-w-0">
          <Card className="min-w-0">
            <CardHeader title="Demande" />
            <DefinitionList
              items={[
                { term: 'Client', value: request.email },
                { term: 'Motif', value: request.reason || '—' },
                {
                  term: 'Résolution',
                  value: request.resolution === 'REFUND' ? 'Remboursement' : request.resolution,
                },
                { term: 'Articles', value: number(request.itemCount), numeric: true },
                ...(request.adminComment
                  ? [{ term: 'Votre commentaire', value: request.adminComment }]
                  : []),
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
