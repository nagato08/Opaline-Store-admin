import { ListSkeleton } from '@/components/ui/list-skeleton';

export default function Loading() {
  return <ListSkeleton label="Chargement des commandes" columns={6} rows={10} tabs={6} />;
}
