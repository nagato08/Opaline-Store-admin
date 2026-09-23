import { notFound, redirect } from 'next/navigation';
import { DetailHeader } from '@/components/layout/detail-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { DeleteButton } from '@/components/ui/delete-button';
import { PUBLISH_STATUSES, getPage } from '@/lib/data/content';
import { getSession } from '@/lib/current-session';
import { PageForm } from '../page-form';
import { deletePage, updatePage } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Page — Comptoir' };

export default async function EditPagePage({ params }: PageProps<'/contenu/pages/[id]'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const { id } = await params;
  const page = await getPage(session, id);
  if (!page) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <DetailHeader
        backHref="/contenu/pages"
        backLabel="Pages"
        title={page.title}
        subtitle={<span className="font-mono">/{page.slug}</span>}
        badge={
          <Badge tone={PUBLISH_STATUSES[page.status].tone}>
            {PUBLISH_STATUSES[page.status].label}
          </Badge>
        }
      />

      <div className="space-y-6">
        <PageForm action={updatePage.bind(null, page.id)} page={page} submitLabel="Enregistrer" />

        <Card className="min-w-0">
          <CardHeader
            title="Supprimer"
            description="Définitif. Pour retirer la page de la boutique sans la perdre, passez son état à « Archivé » ci-dessus."
          />
          <div className="p-5 pt-0">
            <DeleteButton
              action={deletePage.bind(null, page.id)}
              label="Supprimer la page"
              confirmation={`Supprimer « ${page.title} » définitivement ?`}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
