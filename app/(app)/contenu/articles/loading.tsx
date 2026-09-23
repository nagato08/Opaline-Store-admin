import { ListSkeleton } from '@/components/ui/list-skeleton';

export default function Loading() {
  return <ListSkeleton label="Chargement des articles" columns={5} rows={5} tabs={0} />;
}
