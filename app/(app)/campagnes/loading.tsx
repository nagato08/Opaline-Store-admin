import { ListSkeleton } from '@/components/ui/list-skeleton';

export default function Loading() {
  return <ListSkeleton label="Chargement des campagnes" columns={5} rows={6} tabs={4} />;
}
