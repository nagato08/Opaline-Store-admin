import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Newspaper } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge, Dot } from '@/components/ui/badge';
import { Card, EmptyState } from '@/components/ui/card';
import { Cell, Row, Table } from '@/components/ui/table';
import { number, shortDate } from '@/lib/format';
import { PUBLISH_STATUSES, listPosts } from '@/lib/data/content';
import { getSession } from '@/lib/current-session';
import { PostForm } from './post-form';
import { createPost } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Articles — Comptoir' };

export default async function PostsPage() {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const posts = await listPosts(session);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Articles"
        count={`${number(posts.length)} en tout`}
        description="Le blog de la boutique. Un article se référence dans les moteurs de recherche et amène des visiteurs que le catalogue seul n’attire pas."
      />

      <Card className="mb-6 min-w-0">
        {posts.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="Aucun article"
            description="Le blog est vide. Un premier article sur ce que vous vendez et pourquoi vous l’avez choisi vaut mieux qu’une page « à propos »."
          />
        ) : (
          <Table
            caption="Articles du blog, leur auteur, leurs étiquettes et leur état de publication"
            minWidth="min-w-160"
            columns={[
              { label: 'Article' },
              { label: 'Auteur' },
              { label: 'Étiquettes' },
              { label: 'État' },
              { label: 'Modifié' },
            ]}
          >
            {posts.map((post) => (
              <Row key={post.id}>
                <Cell>
                  <Link
                    href={`/contenu/articles/${post.id}`}
                    className="font-medium text-ink-900 hover:text-cobalt-600 hover:underline"
                  >
                    {post.title}
                  </Link>
                  <span className="mt-0.5 block font-mono text-xs text-ink-500">/{post.slug}</span>
                </Cell>
                <Cell className="text-ink-600">{post.authorName || '—'}</Cell>
                <Cell className="text-ink-600">
                  {post.tags.length > 0 ? post.tags.join(', ') : '—'}
                </Cell>
                <Cell>
                  <Badge tone={PUBLISH_STATUSES[post.status].tone}>
                    <Dot />
                    {PUBLISH_STATUSES[post.status].label}
                  </Badge>
                </Cell>
                <Cell className="whitespace-nowrap text-ink-600">{shortDate(post.updatedAt)}</Cell>
              </Row>
            ))}
          </Table>
        )}
      </Card>

      <PostForm action={createPost} submitLabel="Créer l’article" />
    </div>
  );
}
