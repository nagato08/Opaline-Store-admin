import { redirect } from 'next/navigation';
import { listCustomers } from '@/lib/data/customers';
import { listStockLines } from '@/lib/data/stock';
import { getSession } from '@/lib/current-session';
import { OrderForm } from './order-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nouvelle commande — Comptoir' };

export default async function NewOrderPage() {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const [{ customers }, lines] = await Promise.all([
    listCustomers(session, {}),
    listStockLines(session, {}),
  ]);

  return (
    <OrderForm
      customers={customers.map((customer) => ({ name: customer.name, email: customer.email }))}
      products={lines.map((line) => ({
        sku: line.sku,
        label: `${line.product} — ${line.sku}`,
        available: line.available,
        unit: line.unit,
      }))}
    />
  );
}
