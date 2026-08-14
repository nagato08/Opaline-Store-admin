import { ListSkeleton } from '@/components/ui/list-skeleton';

export default function Loading() {
  return <ListSkeleton label="Chargement des clients" columns={5} rows={10} tabs={3} />;
}
