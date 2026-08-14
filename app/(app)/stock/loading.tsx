import { ListSkeleton } from '@/components/ui/list-skeleton';

export default function Loading() {
  return <ListSkeleton label="Chargement du stock" columns={6} rows={10} tabs={4} />;
}
