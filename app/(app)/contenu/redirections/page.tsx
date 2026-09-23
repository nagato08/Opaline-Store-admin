import { redirect } from 'next/navigation';
import { Signpost } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, EmptyState } from '@/components/ui/card';
import { Cell, Row, Table } from '@/components/ui/table';
import { number } from '@/lib/format';
import { listRedirects } from '@/lib/data/content';
import { getSession } from '@/lib/current-session';
import { RedirectForm } from './redirect-form';
import { DeleteRedirect } from './delete-redirect';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Redirections — Comptoir' };

export default async function RedirectsPage() {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const redirects = await listRedirects(session);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Redirections"
        count={`${number(redirects.length)} en tout`}
        description="Quand une adresse change, la redirection garde vivants les liens déjà partagés et le référencement acquis. Les plus visitées sont en tête."
      />

      <Card className="mb-6 min-w-0">
        {redirects.length === 0 ? (
          <EmptyState
            icon={Signpost}
            title="Aucune redirection"
            description="Rien à rediriger pour l’instant. Pensez-y le jour où vous renommez un rayon ou retirez une page."
          />
        ) : (
          <Table
            caption="Redirections d’adresses, leur type et le nombre de visiteurs qu’elles ont rattrapés"
            minWidth="min-w-160"
            columns={[
              { label: 'Ancienne adresse' },
              { label: 'Nouvelle adresse' },
              { label: 'Type' },
              { label: 'Visites', align: 'right' },
              { label: '' },
            ]}
          >
            {redirects.map((entry) => (
              <Row key={entry.id}>
                <Cell className="font-mono text-xs text-ink-900">{entry.fromPath}</Cell>
                <Cell className="font-mono text-xs text-ink-600">{entry.toPath}</Cell>
                <Cell>
                  <Badge tone={entry.statusCode === 301 ? 'info' : 'neutral'}>
                    {entry.statusCode === 301 ? 'Définitif' : 'Temporaire'}
                  </Badge>
                </Cell>
                <Cell align="right">
                  {entry.hits === 0 ? (
                    <span className="text-ink-300">—</span>
                  ) : (
                    <span data-numeric className="font-mono text-ink-600">
                      {number(entry.hits)}
                    </span>
                  )}
                </Cell>
                <Cell align="right">
                  <DeleteRedirect id={entry.id} fromPath={entry.fromPath} />
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Card>

      <RedirectForm />
    </div>
  );
}
