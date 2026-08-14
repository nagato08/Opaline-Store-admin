import { PanelSkeleton } from '@/components/ui/panel-skeleton';

export default function Loading() {
  return <PanelSkeleton label="Chargement des réglages" panels={4} lines={4} />;
}
