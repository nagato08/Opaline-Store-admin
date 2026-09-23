import { ListSkeleton } from '@/components/ui/list-skeleton';

export default function Loading() {
  return <ListSkeleton label="Chargement des retours" columns={6} rows={6} tabs={5} />;
}
