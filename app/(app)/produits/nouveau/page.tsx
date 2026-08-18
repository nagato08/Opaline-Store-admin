import { redirect } from 'next/navigation';
import { listCategories } from '@/lib/data/products';
import { getSession } from '@/lib/current-session';
import { ProductForm } from './product-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nouveau produit — Comptoir' };

export default async function NewProductPage() {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const categories = await listCategories(session);
  return <ProductForm categories={categories} />;
}
