import { stockLines } from '@/lib/demo';
import { AdjustForm } from './adjust-form';

export const metadata = { title: 'Ajuster le stock — Comptoir' };

export default function AdjustStockPage() {
  return <AdjustForm lines={stockLines()} />;
}
