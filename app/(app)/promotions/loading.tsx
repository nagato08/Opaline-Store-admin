import { ListSkeleton } from '@/components/ui/list-skeleton';

export default function Loading() {
  return <ListSkeleton label="Chargement des promotions" columns={5} rows={8} tabs={4} />;
}
