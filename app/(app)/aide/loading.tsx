import { PanelSkeleton } from '@/components/ui/panel-skeleton';

export default function Loading() {
  return <PanelSkeleton label="Chargement de l’aide" panels={3} lines={5} />;
}
