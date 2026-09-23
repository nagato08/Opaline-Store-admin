import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge, Dot } from '@/components/ui/badge';
import { Card, EmptyState } from '@/components/ui/card';
import { Cell, Row, Table } from '@/components/ui/table';
import { number, shortDate } from '@/lib/format';
import { PUBLISH_STATUSES, listPages } from '@/lib/data/content';
import { getSession } from '@/lib/current-session';
import { PageForm } from './page-form';
import { createPage } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Pages — Comptoir' };

export default async function PagesPage() {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const pages = await listPages(session);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Pages"
        count={`${number(pages.length)} en tout`}
        description="Les pages fixes de la boutique. Mentions légales, conditions de vente et politique de retours y vivent — ce sont des obligations légales, pas du décor."
      />

      <Card className="mb-6 min-w-0">
        {pages.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucune page"
            description="La boutique n’a encore aucune page fixe. Les mentions légales et les conditions générales de vente sont obligatoires avant toute vente."
          />
        ) : (
          <Table
            caption="Pages éditoriales de la boutique, leur adresse et leur état de publication"
            minWidth="min-w-160"
            columns={[
              { label: 'Page' },
              { label: 'Code' },
              { label: 'Adresse' },
              { label: 'État' },
              { label: 'Modifiée' },
            ]}
          >
            {pages.map((page) => (
              <Row key={page.id}>
                <Cell>
                  <Link
                    href={`/contenu/pages/${page.id}`}
                    className="font-medium text-ink-900 hover:text-cobalt-600 hover:underline"
                  >
                    {page.title}
                  </Link>
                </Cell>
                <Cell className="font-mono text-xs text-ink-500">{page.code}</Cell>
                <Cell className="font-mono text-xs text-ink-500">/{page.slug}</Cell>
                <Cell>
                  <Badge tone={PUBLISH_STATUSES[page.status].tone}>
                    <Dot />
                    {PUBLISH_STATUSES[page.status].label}
                  </Badge>
                </Cell>
                <Cell className="whitespace-nowrap text-ink-600">{shortDate(page.updatedAt)}</Cell>
              </Row>
            ))}
          </Table>
        )}
      </Card>

      <PageForm action={createPage} submitLabel="Créer la page" />
    </div>
  );
}
