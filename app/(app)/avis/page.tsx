import { redirect } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, EmptyState } from '@/components/ui/card';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { number } from '@/lib/format';
import { REVIEW_STATUSES, listReviews, toReviewStatus } from '@/lib/data/engagement';
import { getSession } from '@/lib/current-session';
import { ReviewCard } from './review-card';
import { moderate } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Avis — Comptoir' };

export default async function ReviewsPage({ searchParams }: PageProps<'/avis'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const params = await searchParams;
  const status = toReviewStatus(params.etat);
  const { reviews, total, counts } = await listReviews(session, status);

  const tabs = [
    { label: 'Tous', count: total },
    ...(Object.keys(REVIEW_STATUSES) as Array<keyof typeof REVIEW_STATUSES>).map((key) => ({
      value: REVIEW_STATUSES[key].slug,
      label: REVIEW_STATUSES[key].label,
      count: counts.find((entry) => entry.key === key)?.count ?? 0,
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Avis"
        count={`${number(reviews.length)} affichés`}
        description="Un avis n’apparaît sur la boutique qu’une fois publié ici. Les avis vérifiés proviennent d’une commande réellement passée."
      />

      <div className="mb-4">
        <FilterTabs
          tabs={tabs}
          current={status && REVIEW_STATUSES[status].slug}
          param="etat"
          basePath="/avis"
        />
      </div>

      <Card className="min-w-0">
        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Aucun avis"
            description="Rien à modérer. Les avis arrivent après les premières commandes livrées — c’est le signe que la boutique tourne."
          />
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} action={moderate.bind(null, review.id)} />
          ))
        )}
      </Card>
    </div>
  );
}
