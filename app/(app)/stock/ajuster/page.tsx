import { redirect } from 'next/navigation';
import { listLocations, listStockLines } from '@/lib/data/stock';
import { getSession } from '@/lib/current-session';
import { AdjustForm } from './adjust-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ajuster le stock — Comptoir' };

export default async function AdjustStockPage() {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const [lines, locations] = await Promise.all([listStockLines(session, {}), listLocations(session)]);
  return <AdjustForm lines={lines} locations={locations} />;
}
