import { notFound, redirect } from 'next/navigation';
import { DetailHeader } from '@/components/layout/detail-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { DeleteButton } from '@/components/ui/delete-button';
import { PUBLISH_STATUSES, getPost } from '@/lib/data/content';
import { getSession } from '@/lib/current-session';
import { PostForm } from '../post-form';
import { deletePost, updatePost } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Article — Comptoir' };

export default async function EditPostPage({ params }: PageProps<'/contenu/articles/[id]'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const { id } = await params;
  const post = await getPost(session, id);
  if (!post) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <DetailHeader
        backHref="/contenu/articles"
        backLabel="Articles"
        title={post.title}
        subtitle={<span className="font-mono">/{post.slug}</span>}
        badge={
          <Badge tone={PUBLISH_STATUSES[post.status].tone}>
            {PUBLISH_STATUSES[post.status].label}
          </Badge>
        }
      />

      <div className="space-y-6">
        <PostForm action={updatePost.bind(null, post.id)} post={post} submitLabel="Enregistrer" />

        <Card className="min-w-0">
          <CardHeader
            title="Supprimer"
            description="Définitif, et l’adresse publique de l’article disparaît avec lui. Pour le retirer sans casser les liens déjà partagés, passez-le en « Archivé »."
          />
          <div className="p-5 pt-0">
            <DeleteButton
              action={deletePost.bind(null, post.id)}
              label="Supprimer l’article"
              confirmation={`Supprimer « ${post.title} » définitivement ?`}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
